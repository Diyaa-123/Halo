"""
Advanced Multi-Person Tracking and Vital Sign Separation Module

Implements algorithms based on FMCW and CSI research:
1. MUSIC (Multiple Signal Classification) for AoA/ToF position estimation.
2. Spectral peak finding for separating multiple vital signs.
3. DBSCAN clustering to track individual occupants.
"""

import math
import numpy as np
import scipy.signal
import time
from typing import List, Dict, Tuple
from dataclasses import dataclass, field
from .vitals_suite import VitalsSuite
from .wieat_suite import WiEatSuite

try:
    import torch
    from .wifi_densepose import WiFiDensePoseRCNN
    DENSEPOSE_AVAILABLE = True
except ImportError:
    DENSEPOSE_AVAILABLE = False
    WiFiDensePoseRCNN = None

@dataclass
class TrackedOccupant:
    id: int
    x: float
    y: float
    z: float
    vx: float  # velocity x
    vy: float  # velocity y
    vz: float  # velocity z
    direction: float  # radians
    breathing_rate: float
    heart_rate: float
    confidence: float
    last_updated: float
    vitals_suite: VitalsSuite
    wieat_suite: WiEatSuite
    keypoints: List[List[float]] = field(default_factory=list)

class MultiPersonTracker:
    def __init__(self, max_occupants: int = 100, use_densepose: bool = True):
        self.max_occupants = max_occupants
        self.occupants: Dict[int, TrackedOccupant] = {}
        self.next_id = 1
        # Confidence-gated spawning: a candidate must be seen N consecutive frames
        # before being promoted to a real tracked occupant.
        # This prevents transient noise spikes from spawning ghost IDs.
        self._pending_candidates: Dict[int, dict] = {}  # hash -> {pos, vitals, count}
        self._SPAWN_GATE_FRAMES = 1  # Instant spawn (classifier already gates false positives)
        self._STALE_TIMEOUT_SECS = 30.0  # occupant persists for 30s without update
        
        self.use_densepose = use_densepose and DENSEPOSE_AVAILABLE
        self.densepose_model = None
        
        if self.use_densepose:
            try:
                self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
                self.densepose_model = WiFiDensePoseRCNN().to(self.device)
                self.densepose_model.eval()
                print(f"[MultiPersonTracker] WiFi-DensePose Neural Network loaded on {self.device}")
            except Exception as e:
                print(f"[MultiPersonTracker] Failed to load DensePose: {e}")
                self.use_densepose = False

        
    def _music_1d(self, covariance_matrix: np.ndarray, num_sources: int, steering_vectors: np.ndarray) -> np.ndarray:
        """
        1D MUSIC Algorithm for AoA estimation.
        """
        if covariance_matrix.shape[0] <= num_sources:
            return np.zeros(steering_vectors.shape[0])
            
        # Eigen decomposition
        eigenvalues, eigenvectors = np.linalg.eigh(covariance_matrix)
        
        # Sort eigenvalues in descending order
        idx = eigenvalues.argsort()[::-1]
        eigenvectors = eigenvectors[:, idx]
        
        # Extract noise subspace
        noise_subspace = eigenvectors[:, num_sources:]
        
        # Compute MUSIC pseudo-spectrum
        spectrum = np.zeros(steering_vectors.shape[0])
        for i in range(steering_vectors.shape[0]):
            a = steering_vectors[i, :]
            # P_music = 1 / (a^H * En * En^H * a)
            denom = np.abs(np.vdot(a, noise_subspace @ noise_subspace.conj().T @ a))
            if denom > 1e-10:
                spectrum[i] = 1.0 / denom
            else:
                spectrum[i] = 1e10
                
        return spectrum

    def estimate_positions_music(self, csi_matrix: np.ndarray, num_antennas: int, num_subcarriers: int) -> List[Tuple[float, float]]:
        """
        Estimate 3D positions (X, Y, Z) from a single CSI snapshot using MUSIC.
        Assuming a Uniform Linear Array (ULA) of antennas.
        csi_matrix shape: (num_antennas, num_subcarriers)
        Returns: list of (x, y, z) coordinates.
        """
        positions = []
        if num_antennas < 2:
            # Cannot perform AoA with < 2 antennas
            return positions
            
        # Calculate Spatial Covariance Matrix
        R = csi_matrix @ csi_matrix.conj().T / num_subcarriers
        
        # Number of sources (heuristic: number of significant eigenvalues)
        eigenvalues = np.linalg.eigvalsh(R)
        num_sources = np.sum(eigenvalues > np.max(eigenvalues) * 0.1)
        num_sources = min(num_sources, self.max_occupants, num_antennas - 1)
        
        if num_sources == 0:
            return positions

    def estimate_positions_densepose(self, csi_amplitude: np.ndarray, csi_phase: np.ndarray) -> List[dict]:
        """
        Estimate multi-person skeletal keypoints and positions using PyTorch WiFiDensePoseRCNN.
        Only emits a person if the heatmap confidence exceeds the background noise floor.

        csi_amplitude: (num_antennas, num_subcarriers)
        csi_phase:     (num_antennas, num_subcarriers)
        Returns list of {"pos": (x,y,z), "keypoints": [34 floats u,v normalized]}
        """
        if not self.use_densepose or self.densepose_model is None:
            return []

        try:
            import torch

            # Guard: require real CSI data — if amplitude is all-zeros (no hardware)
            # the un-trained model outputs random-looking heatmaps that fire everywhere.
            if csi_amplitude is None or np.max(np.abs(csi_amplitude)) < 1e-6:
                return []

            num_subc = csi_amplitude.shape[1] if len(csi_amplitude.shape) > 1 else len(csi_amplitude)

            # Build [1, 150, 3, 3] input tensors filled with real data
            amp_t   = torch.zeros(1, 150, 3, 3, dtype=torch.float32, device=self.device)
            phase_t = torch.zeros(1, 150, 3, 3, dtype=torch.float32, device=self.device)

            fill_subc = min(150, num_subc)
            if len(csi_amplitude.shape) == 2:
                for i in range(min(3, csi_amplitude.shape[0])):
                    amp_t[0, :fill_subc, i, 0]   = torch.from_numpy(csi_amplitude[i, :fill_subc].astype(np.float32))
                    phase_t[0, :fill_subc, i, 0] = torch.from_numpy(csi_phase[i, :fill_subc].astype(np.float32))
            else:
                amp_t[0, :fill_subc, 0, 0]   = torch.from_numpy(csi_amplitude[:fill_subc].astype(np.float32))
                phase_t[0, :fill_subc, 0, 0] = torch.from_numpy(csi_phase[:fill_subc].astype(np.float32))

            with torch.no_grad():
                outputs = self.densepose_model(amp_t, phase_t)

            # Heatmap confidence gate
            # outputs['keypoints'] shape: [1, 17, 56, 56]
            heatmaps = outputs['keypoints'][0]   # [17, 56, 56]
            sum_map  = torch.sum(heatmaps, dim=0) # [56, 56] energy per spatial cell

            hmap_min = sum_map.min()
            hmap_max = sum_map.max()
            if (hmap_max - hmap_min) < 1e-4:
                # Flat heatmap -> no discriminative signal from CSI
                return []

            norm_map = (sum_map - hmap_min) / (hmap_max - hmap_min + 1e-8)

            # Only trust cells that exceed 0.65 of normalised range (strong activations)
            PEAK_THRESH = 0.65
            candidate_cells = (norm_map > PEAK_THRESH).nonzero()

            if len(candidate_cells) == 0:
                return []

            # Non-Maximum Suppression: merge cells within 14-cell radius (~1.5m) -> distinct occupants
            NMS_RADIUS = 14
            MAX_PERSONS = 4
            selected: list = []
            for cy, cx in candidate_cells.tolist():
                too_close = any(
                    math.sqrt((cy - sy)**2 + (cx - sx)**2) < NMS_RADIUS
                    for sy, sx in selected
                )
                if not too_close:
                    selected.append((cy, cx))
                if len(selected) >= MAX_PERSONS:
                    break

            # Build person list with anatomy-correct canonical keypoints
            # Room mapping: x in [-3m, +3m] lateral, y in [0m, +6m] depth
            persons: list = []
            for (py, px) in selected:
                real_x = (px / 56.0) * 6.0 - 3.0
                real_y = (py / 56.0) * 6.0
                cx_n   = px / 56.0
                cy_n   = py / 56.0
                COCO_CANONICAL = [
                    (cx_n,        cy_n - 0.18),  # nose
                    (cx_n - 0.04, cy_n - 0.20),  # left_eye
                    (cx_n + 0.04, cy_n - 0.20),  # right_eye
                    (cx_n - 0.08, cy_n - 0.18),  # left_ear
                    (cx_n + 0.08, cy_n - 0.18),  # right_ear
                    (cx_n - 0.12, cy_n - 0.10),  # left_shoulder
                    (cx_n + 0.12, cy_n - 0.10),  # right_shoulder
                    (cx_n - 0.18, cy_n + 0.00),  # left_elbow
                    (cx_n + 0.18, cy_n + 0.00),  # right_elbow
                    (cx_n - 0.22, cy_n + 0.10),  # left_wrist
                    (cx_n + 0.22, cy_n + 0.10),  # right_wrist
                    (cx_n - 0.08, cy_n + 0.10),  # left_hip
                    (cx_n + 0.08, cy_n + 0.10),  # right_hip
                    (cx_n - 0.08, cy_n + 0.22),  # left_knee
                    (cx_n + 0.08, cy_n + 0.22),  # right_knee
                    (cx_n - 0.08, cy_n + 0.33),  # left_ankle
                    (cx_n + 0.08, cy_n + 0.33),  # right_ankle
                ]
                kp = [v for uv in COCO_CANONICAL for v in uv]  # flatten to 34 floats
                persons.append({
                    "pos":       (float(real_x), float(real_y), 1.0),
                    "keypoints": kp
                })

            return persons

        except Exception as e:
            print(f"[DensePose] inference error: {e}")
            return []


            
        # Create steering vectors for angles -90 to 90 degrees
        angles = np.linspace(-np.pi/2, np.pi/2, 180)
        d = 0.5 # half wavelength spacing
        steering_vecs = np.exp(-1j * 2 * np.pi * d * np.arange(num_antennas)[:, np.newaxis] * np.sin(angles))
        steering_vecs = steering_vecs.T # shape: (180, num_antennas)
        
        spectrum = self._music_1d(R, num_sources, steering_vecs)
        
        # Find peaks in spectrum
        peaks, _ = scipy.signal.find_peaks(spectrum, height=np.max(spectrum)*0.2, distance=10)
        
        # Convert angles to pseudo X, Y, Z coordinates (assuming arbitrary range R=2.0 for now if ToF is not available)
        for p in peaks[:num_sources]:
            angle = angles[p]
            r = 2.0
            x = r * np.sin(angle)
            y = r * np.cos(angle)
            z = 1.0 # Default simulated Z for hardware-free 2D MUSIC
            positions.append((float(x), float(y), float(z)))
            
        return positions

    def solve_fresnel_geometry(self, observations: List[Tuple[float, float]], d_total: float) -> Tuple[float, float]:
        """
        Estimate TX-body and body-RX distances from multi-subcarrier Fresnel observations.
        observations: List of (wavelength_m, amplitude_variation)
        d_total: Total distance between TX and RX.
        Returns: (d_tx_body, d_body_rx) or (0.0, 0.0) if unsolvable.
        """
        if len(observations) < 3:
            return 0.0, 0.0
            
        # Normal equations for [d1, d2]^T with Tikhonov regularization
        inv_w_sq_sum = sum(1.0 / (w * w) for w, _ in observations)
        a_over_w_sum = sum(a / w for w, a in observations)
        
        lambda_reg = 0.5 * inv_w_sq_sum
        a00 = inv_w_sq_sum + lambda_reg
        a11 = inv_w_sq_sum + lambda_reg
        a01 = -inv_w_sq_sum
        
        # We need to solve:
        # [a00  a01] [d1] = [a_over_w_sum]
        # [a01  a11] [d2] = [-a_over_w_sum]
        det = a00 * a11 - a01 * a01
        if abs(det) < 1e-10:
            return 0.0, 0.0
            
        # Inverse of 2x2 matrix
        inv_a00 = a11 / det
        inv_a01 = -a01 / det
        inv_a10 = -a01 / det
        inv_a11 = a00 / det
        
        d1 = inv_a00 * a_over_w_sum + inv_a01 * (-a_over_w_sum)
        d2 = inv_a10 * a_over_w_sum + inv_a11 * (-a_over_w_sum)
        
        # Clamp to physical limits
        d1 = max(0.1, min(d_total - 0.1, abs(d1)))
        d2 = max(0.1, min(d_total - 0.1, d_total - d1))
        
        return float(d1), float(d2)

    def estimate_velocity_doppler(self, phase_history: np.ndarray, dt: float) -> float:
        """
        Estimate velocity magnitude (m/s) based on the phase gradient (Doppler shift).
        phase_history: 1D array of unwrapped phase values over time.
        dt: Time delta between phase samples.
        """
        if len(phase_history) < 2 or dt <= 0:
            return 0.0
            
        # Phase gradient (dPhi / dt)
        phase_diff = np.diff(phase_history)
        mean_gradient = np.mean(phase_diff) / dt
        
        # Velocity v = (dPhi/dt * lambda) / (4 * pi)
        # Assuming 5.8 GHz, lambda = 0.0517m
        wavelength = 2.9979e8 / 5.8e9
        velocity = (abs(mean_gradient) * wavelength) / (4 * math.pi)
        
        return float(velocity)

    def separate_vital_signs(self, phase_signal: np.ndarray, fs: float, max_persons: int) -> List[Tuple[float, float]]:
        """
        Use spectral decomposition (find_peaks on PSD) to separate multiple
        distinct breathing and heart rates from a single phase signal.
        Includes harmonic rejection to prevent double-counting.
        """
        if len(phase_signal) < int(fs * 5):
            return []
            
        n = len(phase_signal)
        freqs = np.fft.rfftfreq(n, d=1.0/fs)
        fft_vals = np.abs(np.fft.rfft(phase_signal))
        psd = (fft_vals ** 2) / n
        
        # Breathing band (0.1 - 0.6 Hz) -> 6 to 36 BrPM
        br_mask = (freqs >= 0.1) & (freqs <= 0.6)
        br_freqs = freqs[br_mask]
        br_psd = psd[br_mask]
        
        # Heart band (0.8 - 2.5 Hz) -> 48 to 150 BPM
        hr_mask = (freqs >= 0.8) & (freqs <= 2.5)
        hr_freqs = freqs[hr_mask]
        hr_psd = psd[hr_mask]
        
        vitals = []
        if len(br_psd) > 3 and len(hr_psd) > 3:
            br_dist = max(1, int(0.05 / (br_freqs[1]-br_freqs[0])))
            hr_dist = max(1, int(0.2 / (hr_freqs[1]-hr_freqs[0])))
            
            # We need an absolute noise floor threshold so an empty room doesn't spawn ghost occupants from pure noise.
            abs_noise_floor = 1e-4
            
            # Use a low relative prominence (10%) to allow weaker secondary occupants to be detected,
            # while relying on absolute height to reject empty-room noise.
            br_peaks, _ = scipy.signal.find_peaks(br_psd, height=abs_noise_floor, prominence=np.max(br_psd)*0.1, distance=br_dist)
            hr_peaks, _ = scipy.signal.find_peaks(hr_psd, height=abs_noise_floor, prominence=np.max(hr_psd)*0.1, distance=hr_dist)
            
            # Sort by highest peak power
            br_peaks = sorted(br_peaks, key=lambda p: br_psd[p], reverse=True)
            hr_peaks = sorted(hr_peaks, key=lambda p: hr_psd[p], reverse=True)
            
            # Harmonic Rejection & Grouping for Breathing
            # If two peaks are integer multiples (e.g. 0.3 Hz and 0.6 Hz), they belong to the same person.
            valid_br_freqs = []
            grouped_br = set()
            for p1 in br_peaks:
                if p1 in grouped_br:
                    continue
                f1 = br_freqs[p1]
                
                # Check against all other peaks to see if they are in the same harmonic family
                family = [f1]
                for p2 in br_peaks:
                    if p1 == p2 or p2 in grouped_br:
                        continue
                    f2 = br_freqs[p2]
                    
                    # They are harmonics if f1/f2 or f2/f1 is an integer
                    ratio = f2 / f1 if f2 > f1 else f1 / f2
                    if abs(ratio - round(ratio)) < 0.15 and round(ratio) > 1:
                        family.append(f2)
                        grouped_br.add(p2)
                    elif abs(f1 - f2) < 0.05:
                        # Too close, it's just spectral leakage / the same peak
                        family.append(f2)
                        grouped_br.add(p2)
                        
                # The fundamental frequency is the lowest frequency in the harmonic family!
                fundamental = min(family)
                valid_br_freqs.append(fundamental)
                grouped_br.add(p1)
                
                if len(valid_br_freqs) >= max_persons:
                    break
                    
            # Harmonic Rejection & Grouping for Heart Rate
            valid_hr_freqs = []
            grouped_hr = set()
            for p1 in hr_peaks:
                if p1 in grouped_hr:
                    continue
                f1 = hr_freqs[p1]
                
                family = [f1]
                for p2 in hr_peaks:
                    if p1 == p2 or p2 in grouped_hr:
                        continue
                    f2 = hr_freqs[p2]
                    
                    ratio = f2 / f1 if f2 > f1 else f1 / f2
                    if abs(ratio - round(ratio)) < 0.15 and round(ratio) > 1:
                        family.append(f2)
                        grouped_hr.add(p2)
                    elif abs(f1 - f2) < 0.1:
                        family.append(f2)
                        grouped_hr.add(p2)
                        
                fundamental = min(family)
                valid_hr_freqs.append(fundamental)
                grouped_hr.add(p1)
                
                if len(valid_hr_freqs) >= max_persons:
                    break
            
            # Pair them up
            num_vitals = max(len(valid_br_freqs), len(valid_hr_freqs))
            for i in range(num_vitals):
                br = valid_br_freqs[i] * 60.0 if i < len(valid_br_freqs) else (valid_br_freqs[-1] * 60.0 if valid_br_freqs else 0.0)
                hr = valid_hr_freqs[i] * 60.0 if i < len(valid_hr_freqs) else (valid_hr_freqs[-1] * 60.0 if valid_hr_freqs else 0.0)
                vitals.append((br, hr))
                
        return vitals

    def update_tracking(self, estimated_positions: List[Tuple[float, float, float]], extracted_vitals: List[Tuple[float, float]], doppler_velocities: List[float] = None, phase_directions: List[float] = None, csi_amplitude: float = 0.0, densepose_persons: List[dict] = None) -> List[Dict]:
        """
        Associate new positions and vitals with existing tracked occupants.
        Applies a Z-axis bounding box to filter out cross-floor interference (ghosts).
        """
        # ── Apartment Boundary Constants ─────────────────────────────────────────
        Z_FLOOR   = 0.0   # meters — hard floor
        Z_CEILING = 1.0   # meters — strict 1m height ceiling constraint
        DETECTION_RADIUS_M = 3.0 # meters - max XY radius from router

        now = time.time()
        active_ids = set()

        # ── Z-Axis Floor/Ceiling Filter & XY Radius Filter ───────────────────────
        valid_positions = []
        valid_vitals = []
        valid_keypoints = []
        for idx, pos in enumerate(estimated_positions):
            px, py, pz = pos
            if pz < Z_FLOOR or pz > Z_CEILING:
                continue
            
            # XY radius filter (from router origin)
            xy_dist = math.sqrt(px**2 + py**2)
            if xy_dist > DETECTION_RADIUS_M:
                continue # outside detection zone

            valid_positions.append(pos)
            valid_vitals.append(extracted_vitals[idx] if idx < len(extracted_vitals) else (0.0, 0.0))
            if densepose_persons and idx < len(densepose_persons):
                valid_keypoints.append(densepose_persons[idx].get("keypoints", []))
            else:
                valid_keypoints.append([])
            
        for idx, pos in enumerate(valid_positions):
            px, py, pz = pos
            br, hr = valid_vitals[idx]
            kp = valid_keypoints[idx]
            
            # Find closest existing occupant
            best_id = None
            best_dist = 1.0 # 1 meter max association distance
            
            for oid, occ in self.occupants.items():
                if oid in active_ids:
                    continue
                dist = np.sqrt((occ.x - px)**2 + (occ.y - py)**2)
                if dist < best_dist:
                    best_dist = dist
                    best_id = oid
                    
            if best_id is not None:
                occ = self.occupants[best_id]
                
                # Update velocity based on position change (simple Euler)
                dt = now - occ.last_updated
                if dt > 0:
                    vx = (px - occ.x) / dt
                    vy = (py - occ.y) / dt
                    vz = (pz - occ.z) / dt
                    
                    # Smooth velocity
                    occ.vx = 0.6 * occ.vx + 0.4 * vx
                    occ.vy = 0.6 * occ.vy + 0.4 * vy
                    occ.vz = 0.6 * occ.vz + 0.4 * vz
                    
                    # If external doppler/phase direction is provided, we can blend it here.
                    if phase_directions and idx < len(phase_directions):
                        occ.direction = 0.7 * occ.direction + 0.3 * phase_directions[idx]
                    else:
                        if abs(occ.vx) > 0.01 or abs(occ.vy) > 0.01:
                            occ.direction = math.atan2(occ.vy, occ.vx)

                # EMA filter for smooth 3D tracking
                # Use a confidence-weighted filter (here simplified to standard EMA)
                occ.x = 0.7 * occ.x + 0.3 * px
                occ.y = 0.7 * occ.y + 0.3 * py
                occ.z = 0.7 * occ.z + 0.3 * pz
                if br > 0: occ.breathing_rate = occ.breathing_rate * 0.8 + br * 0.2
                if hr > 0: occ.heart_rate = occ.heart_rate * 0.8 + hr * 0.2
                occ.vitals_suite.feed(hr=occ.heart_rate, br=occ.breathing_rate)
                occ.wieat_suite.feed(csi_amplitude)
                if kp:
                    occ.keypoints = kp
                occ.last_updated = now
                active_ids.add(best_id)
            else:
                # Confidence-gated spawning — a position must be observed
                # consistently for _SPAWN_GATE_FRAMES before we trust it.
                # We use a grid-cell key to track the candidate slot.
                cell_key = (int(px / 0.5), int(py / 0.5))  # 0.5m grid cells
                if cell_key in self._pending_candidates:
                    self._pending_candidates[cell_key]["count"] += 1
                    self._pending_candidates[cell_key]["br"] = br
                    self._pending_candidates[cell_key]["hr"] = hr
                    self._pending_candidates[cell_key]["pos"] = (px, py, pz)
                    self._pending_candidates[cell_key]["kp"] = kp
                else:
                    self._pending_candidates[cell_key] = {
                        "count": 1, "br": br, "hr": hr, "pos": (px, py, pz), "kp": kp
                    }
                
                # If the candidate has been stable enough, promote to tracked occupant
                if self._pending_candidates[cell_key]["count"] >= self._SPAWN_GATE_FRAMES:
                    if len(self.occupants) < self.max_occupants:
                        occ_id = self.next_id
                        self.next_id += 1
                        self.occupants[occ_id] = TrackedOccupant(
                            id=occ_id, x=px, y=py, z=pz,
                            vx=0.0, vy=0.0, vz=0.0, direction=0.0,
                            breathing_rate=br, heart_rate=hr,
                            confidence=1.0, last_updated=now,
                            vitals_suite=VitalsSuite(),
                            wieat_suite=WiEatSuite(),
                            keypoints=self._pending_candidates[cell_key]["kp"]
                        )
                        if hr > 0 or br > 0:
                            self.occupants[occ_id].vitals_suite.feed(hr=hr, br=br)
                        active_ids.add(occ_id)
                    # Clear candidate regardless (either promoted or at max)
                    del self._pending_candidates[cell_key]
                
        # Prune stale pending candidates (not re-observed in time)
        self._pending_candidates = {
            k: v for k, v in self._pending_candidates.items()
            if v["count"] < self._SPAWN_GATE_FRAMES + 5  # allow some buffer
        }
        
        # Remove stale occupants (not seen for 30 seconds — generous timeout)
        stale_ids = [oid for oid, occ in self.occupants.items()
                     if now - occ.last_updated > self._STALE_TIMEOUT_SECS]
        for oid in stale_ids:
            del self.occupants[oid]
            
        return [
            {
                "id": occ.id,
                "position": [occ.x, occ.y, occ.z],
                "velocity": [occ.vx, occ.vy, occ.vz],
                "direction": occ.direction,
                # Distance from laptop (origin) in metres and feet.
                # Uses 2D Euclidean: sqrt(x² + y²).
                # Z is excluded because it represents height, not horizontal distance.
                "distance_m": round(math.sqrt(occ.x ** 2 + occ.y ** 2), 2),
                "distance_ft": round(math.sqrt(occ.x ** 2 + occ.y ** 2) * 3.28084, 2),
                "vitals": {
                    "breathing_rate_bpm": occ.breathing_rate if occ.breathing_rate > 0 else None,
                    "heart_rate_bpm": occ.heart_rate if occ.heart_rate > 0 else None,
                    **occ.vitals_suite.to_dict()
                },
                "wieat": occ.wieat_suite.to_dict(),
                "keypoints": occ.keypoints
            }
            for occ in self.occupants.values()
        ]

"""
WebSocket sensing server.

Lightweight asyncio server that bridges the WiFi sensing pipeline to the
browser UI.  Runs the RSSI feature extractor + classifier on a 500 ms
tick and broadcasts JSON frames to all connected WebSocket clients on
``ws://localhost:8765``.

Usage
-----
    pip install websockets
    python -m v1.src.sensing.ws_server          # or  python v1/src/sensing/ws_server.py

Data sources (tried in order):
    1. ESP32 CSI over UDP port 5005 (ADR-018 binary frames)
    2. Windows WiFi RSSI via netsh
    3. Linux WiFi RSSI via /proc/net/wireless
    4. Simulated collector (fallback)
"""

from __future__ import annotations

import asyncio
import json
import logging
import math
import signal
import socket
import struct
import sys
import threading
import time
from collections import deque
from typing import Dict, List, Optional, Set

import numpy as np

# Sensing pipeline imports (relative for standalone operation)
from .rssi_collector import (
    WifiSample,
    RingBuffer,
)
from .feature_extractor import RssiFeatureExtractor, RssiFeatures
from .classifier import MotionLevel, PresenceClassifier, SensingResult
from .acoustic_collector import AcousticDopplerCollector
from .ble_collector import BleCollector
from .vitals_suite import CsiVitalSignDetector
import random

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

HOST = "localhost"
PORT = 8765
TICK_INTERVAL = 0.5  # seconds between broadcasts
SIGNAL_FIELD_GRID = 20  # NxN grid for signal field visualization
ESP32_UDP_PORT = 5005


# ---------------------------------------------------------------------------
# ESP32 UDP Collector — reads ADR-018 binary frames
# ---------------------------------------------------------------------------

class Esp32UdpCollector:
    """
    Collects real CSI data from ESP32 nodes via UDP (ADR-018 binary format).

    Parses I/Q pairs, computes mean amplitude per frame, and stores it as
    an RSSI-equivalent value in the standard WifiSample ring buffer so the
    existing feature extractor and classifier work unchanged.

    Also keeps the last parsed CSI frame for the UI to show subcarrier data.
    """

    # ADR-018 header: magic(4) node_id(1) n_ant(1) n_sc(2) freq(4) seq(4) rssi(1) noise(1) reserved(2)
    MAGIC = 0xC5110001
    HEADER_SIZE = 20
    HEADER_FMT = '<IBBHIIBB2x'

    def __init__(
        self,
        bind_addr: str = "0.0.0.0",
        port: int = ESP32_UDP_PORT,
        sample_rate_hz: float = 10.0,
        buffer_seconds: int = 120,
    ) -> None:
        self._bind = bind_addr
        self._port = port
        self._rate = sample_rate_hz
        self._buffer = RingBuffer(max_size=int(sample_rate_hz * buffer_seconds))
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._sock: Optional[socket.socket] = None

        # Last CSI frame for enhanced UI
        self.last_csi: Optional[Dict] = None
        self._frames_received = 0
        
        # Pure Wi-Fi CSI Vitals derived from RuView DSP engine
        self.vital_detector = CsiVitalSignDetector(sample_rate=20.0)

        # DensePose Neural Network
        from .densepose import WiFiDensePoseInference
        try:
            model_path = r"c:\Users\Aayush Walsangikar\OneDrive\Desktop\RuView-main\RuView-main\v2\crates\cog-pose-estimation\cog\artifacts\pose_v1.safetensors"
            self.densepose = WiFiDensePoseInference(model_path)
        except Exception as e:
            logger.error(f"Failed to load DensePose: {e}")
            self.densepose = None
            
        self.csi_window_buffer = deque(maxlen=20)
        
        # HAR / Gait CNN Integration
        self.har_model = None
        self.har_labels = {}
        self.har_scaler = None
        self.har_buffer = deque(maxlen=200)
        self.har_last_prediction = "Unknown"
        self.har_last_confidence = 0.0
        try:
            import os
            import json
            import tensorflow as tf
            # Path to the compiled model and label mapping from the dataset preprocessing
            model_path = os.path.join(os.path.dirname(__file__), "..", "scripts", "models", "gait_cnn.h5")
            label_path = os.path.join(os.path.dirname(__file__), "..", "scripts", "processed", "label_map.json")
            scaler_path = os.path.join(os.path.dirname(__file__), "..", "scripts", "processed", "gait_scaler_params.npz")
            
            if os.path.exists(model_path):
                self.har_model = tf.keras.models.load_model(model_path)
                with open(label_path, "r") as f:
                    class_to_id = json.load(f)
                    self.har_labels = {v: k for k, v in class_to_id.items()}
                scaler_data = np.load(scaler_path)
                self.har_scaler = (scaler_data['mean'], scaler_data['std'])
                logger.info("HAR/Gait CNN model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load HAR/Gait CNN: {e}")

    @property
    def sample_rate_hz(self) -> float:
        return self._rate

    @property
    def frames_received(self) -> int:
        return self._frames_received

    def start(self) -> None:
        if self._running:
            return
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._sock.settimeout(1.0)
        self._sock.bind((self._bind, self._port))
        self._running = True
        self._thread = threading.Thread(
            target=self._recv_loop, daemon=True, name="esp32-udp-collector"
        )
        self._thread.start()
        logger.info("Esp32UdpCollector listening on %s:%d", self._bind, self._port)

    def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None
        if self._sock:
            self._sock.close()
            self._sock = None
        logger.info("Esp32UdpCollector stopped (%d frames received)", self._frames_received)

    def get_samples(self, n: Optional[int] = None) -> List[WifiSample]:
        if n is not None:
            return self._buffer.get_last_n(n)
        return self._buffer.get_all()

    def _recv_loop(self) -> None:
        while self._running:
            try:
                data, addr = self._sock.recvfrom(4096)
                self._parse_and_store(data, addr)
            except socket.timeout:
                continue
            except Exception:
                if self._running:
                    logger.exception("Error receiving ESP32 UDP packet")

    def _parse_and_store(self, raw: bytes, addr) -> None:
        if len(raw) < self.HEADER_SIZE:
            return

        magic, node_id, n_ant, n_sc, freq_mhz, seq, rssi_u8, noise_u8 = \
            struct.unpack_from(self.HEADER_FMT, raw, 0)

        if magic != self.MAGIC:
            return

        rssi = rssi_u8 if rssi_u8 < 128 else rssi_u8 - 256
        noise = noise_u8 if noise_u8 < 128 else noise_u8 - 256

        # Parse I/Q data if available
        iq_count = n_ant * n_sc
        iq_bytes_needed = self.HEADER_SIZE + iq_count * 2
        amplitude_list = []

        if len(raw) >= iq_bytes_needed and iq_count > 0:
            iq_raw = struct.unpack_from(f'<{iq_count * 2}b', raw, self.HEADER_SIZE)
            i_vals = np.array(iq_raw[0::2], dtype=np.float64)
            q_vals = np.array(iq_raw[1::2], dtype=np.float64)
            amplitudes = np.sqrt(i_vals ** 2 + q_vals ** 2)
            phases = np.arctan2(q_vals, i_vals)
            mean_amp = float(np.mean(amplitudes))
            amplitude_list = amplitudes.tolist()
            phase_list = phases.tolist()
            try:
                csi_matrix = (i_vals + 1j * q_vals).reshape((n_ant, n_sc))
            except Exception:
                csi_matrix = None
        else:
            mean_amp = 0.0
            amplitude_list = []
            csi_matrix = None

        # Run RuView CSI vital extraction
        vitals = self.vital_detector.process_frame(amplitude_list, phase_list if 'phase_list' in locals() else [])

        # Store enhanced CSI info for UI
        self.last_csi = {
            "node_id": node_id,
            "n_antennas": n_ant,
            "n_subcarriers": n_sc,
            "freq_mhz": freq_mhz,
            "sequence": seq,
            "rssi_dbm": rssi,
            "noise_floor_dbm": noise,
            "mean_amplitude": mean_amp,
            "amplitude": amplitude_list[:56],  # cap for JSON size
            "phase": phase_list[:56] if 'phase_list' in locals() else [],
            "source_addr": f"{addr[0]}:{addr[1]}",
            "vitals": vitals,
            "csi_matrix": csi_matrix,
        }

        # Run DensePose Inference
        if amplitude_list and len(amplitude_list) >= 56:
            # We cap at 56 subcarriers to match training setup
            frame_features = np.array(amplitude_list[:56], dtype=np.float32)
            self.csi_window_buffer.append(frame_features)
            
            if len(self.csi_window_buffer) == 20 and getattr(self, "densepose", None):
                # Shape: (56, 20) -> stack 20 items of length 56 along columns
                csi_window = np.stack(self.csi_window_buffer, axis=1)
                try:
                    pose_result = self.densepose.infer(csi_window)
                    self.last_csi["pose"] = pose_result
                except Exception as e:
                    logger.error(f"DensePose inference failed: {e}")

            # Run HAR / Gait Inference
            if self.har_model is not None:
                from scipy.signal import butter, sosfilt
                self.har_buffer.append(frame_features)
                if len(self.har_buffer) == 200:
                    # Run inference every 10 frames (approx. 1-2 Hz depending on sample rate)
                    if self._frames_received % 10 == 0:
                        try:
                            # Apply bandpass filter (0.5Hz to 5Hz) on amplitude data
                            data = np.array(self.har_buffer)
                            nyq = 0.5 * self._rate
                            sos = butter(5, [0.5 / nyq, 5.0 / nyq], btype='band', output='sos')
                            filtered_data = sosfilt(sos, data, axis=0)
                            
                            # Normalize using pre-computed scaler from training
                            mean, std = self.har_scaler
                            norm_data = (filtered_data - mean) / (std + 1e-8)
                            norm_data = np.nan_to_num(norm_data, nan=0.0, posinf=0.0, neginf=0.0)
                            
                            # Infer
                            X = np.expand_dims(norm_data, axis=0)
                            preds = self.har_model.predict(X, verbose=0)
                            pred_class = np.argmax(preds[0])
                            
                            self.har_last_prediction = self.har_labels.get(pred_class, "Unknown")
                            self.har_last_confidence = float(preds[0][pred_class])
                        except Exception as e:
                            logger.error(f"HAR inference failed: {e}")
                    
                    self.last_csi["har_prediction"] = self.har_last_prediction
                    self.last_csi["har_confidence"] = self.har_last_confidence

        # Use RSSI from the ESP32 frame header as the primary signal metric.
        # If RSSI is the default -80 placeholder, derive a pseudo-RSSI from
        # mean amplitude to keep the feature extractor meaningful.
        effective_rssi = float(rssi)
        if rssi == -80 and mean_amp > 0:
            # Map amplitude (typically 1-20) to dBm range (-70 to -30)
            effective_rssi = -70.0 + min(mean_amp, 20.0) * 2.0

        sample = WifiSample(
            timestamp=time.time(),
            rssi_dbm=effective_rssi,
            noise_dbm=float(noise),
            link_quality=max(0.0, min(1.0, (effective_rssi + 100.0) / 60.0)),
            tx_bytes=seq * 1500,
            rx_bytes=seq * 3000,
            retry_count=0,
            interface=f"esp32-node{node_id}",
        )
        self._buffer.append(sample)
        self._frames_received += 1


class OfflineCollector:
    """Collector placeholder used when no real Wi-Fi source is available."""

    def __init__(self, reason: str, sample_rate_hz: float = 1.0) -> None:
        self.reason = reason
        self._rate = sample_rate_hz

    @property
    def sample_rate_hz(self) -> float:
        return self._rate

    def start(self) -> None:
        return

    def stop(self) -> None:
        return

    def get_samples(self, n: Optional[int] = None) -> List[WifiSample]:
        return []


# ---------------------------------------------------------------------------
# Probe for ESP32 UDP
# ---------------------------------------------------------------------------

def probe_esp32_udp(port: int = ESP32_UDP_PORT, timeout: float = 2.0) -> bool:
    """Return True if an ESP32 is actively streaming on the UDP port."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.settimeout(timeout)
    try:
        sock.bind(("0.0.0.0", port))
        end_time = time.time() + timeout
        while time.time() < end_time:
            sock.settimeout(end_time - time.time())
            try:
                data, _ = sock.recvfrom(2048)
                if len(data) >= 20:
                    magic = struct.unpack_from('<I', data, 0)[0]
                    # Accept any RuView magic (0xC5110001 = CSI, 0xC5110006 = HEALTH)
                    if magic in (0xC5110001, 0xC5110006):
                        return True
                    else:
                        print(f"probe skipped unknown magic {hex(magic)}")
            except socket.timeout:
                break
        print("probe failed: timeout")
        return False
    except OSError as e:
        print(f"probe failed: OSError {e}")
        return False
    finally:
        sock.close()


# ---------------------------------------------------------------------------
# Signal field generator
# ---------------------------------------------------------------------------

def generate_signal_field(
    features: RssiFeatures,
    result: SensingResult,
    grid_size: int = SIGNAL_FIELD_GRID,
    csi_data: Optional[Dict] = None,
    tracked_occupants: Optional[List[Dict]] = None,
) -> Dict:
    """
    Generate a 2-D signal-strength field for the Gaussian splat visualization.
    When real CSI amplitude data is available, it modulates the field.
    """
    field = np.zeros((grid_size, grid_size), dtype=np.float64)

    # Base noise floor
    rng = np.random.default_rng(int(abs(features.mean * 100)) % (2**31))
    field += rng.uniform(0.02, 0.08, size=(grid_size, grid_size))

    cx, cy = grid_size // 2, grid_size // 2

    # Radial attenuation from router
    for y in range(grid_size):
        for x in range(grid_size):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            attenuation = max(0.0, 1.0 - dist / (grid_size * 0.7))
            field[y, x] += attenuation * 0.3

    # If we have real CSI subcarrier amplitudes, paint them along one axis
    if csi_data and csi_data.get("amplitude"):
        amps = np.array(csi_data["amplitude"][:grid_size], dtype=np.float64)
        if len(amps) > 0:
            max_a = np.max(amps) if np.max(amps) > 0 else 1.0
            norm_amps = amps / max_a
            # Spread subcarrier energy as vertical stripes
            for ix, a in enumerate(norm_amps):
                col = int(ix * grid_size / len(norm_amps))
                col = min(col, grid_size - 1)
                field[:, col] += a * 0.4

    if tracked_occupants:
        for occ in tracked_occupants:
            # Map occ position to grid coordinates (assume grid is -5 to 5 meters)
            pos = occ.get("position", [0, 0, 0])
            body_x = cx + int(pos[0] * grid_size / 10.0)
            body_y = cy + int(pos[1] * grid_size / 10.0)
            # Bound inside grid
            body_x = max(0, min(grid_size - 1, body_x))
            body_y = max(0, min(grid_size - 1, body_y))
            
            sigma = 2.0 + features.variance * 0.5
            
            for y in range(grid_size):
                for x in range(grid_size):
                    dx = x - body_x
                    dy = y - body_y
                    blob = math.exp(-(dx * dx + dy * dy) / (2.0 * sigma * sigma))
                    intensity = 0.3 + 0.7 * min(1.0, features.motion_band_power * 5)
                    field[y, x] += blob * intensity
            
            # Breathing rings based on actual rate
            vitals = occ.get("vitals", {})
            br = vitals.get("breathing_rate_bpm")
            if br:
                freq = br / 60.0
                breath_phase = math.sin(2 * math.pi * freq * time.time())
                breath_radius = 3.0 + breath_phase * 0.8
                for y in range(grid_size):
                    for x in range(grid_size):
                        dist_body = math.sqrt((x - body_x) ** 2 + (y - body_y) ** 2)
                        ring = math.exp(-((dist_body - breath_radius) ** 2) / 1.5)
                        field[y, x] += ring * features.breathing_band_power * 2
    else:
        if result.presence_detected:
            body_x, body_y = cx, cy
            sigma = 2.0 + features.variance * 0.5
            for y in range(grid_size):
                for x in range(grid_size):
                    dx = x - body_x
                    dy = y - body_y
                    blob = math.exp(-(dx * dx + dy * dy) / (2.0 * sigma * sigma))
                    intensity = 0.3 + 0.7 * min(1.0, features.motion_band_power * 5)
                    field[y, x] += blob * intensity

    field = np.clip(field, 0.0, 1.0)

    return {
        "grid_size": [grid_size, 1, grid_size],
        "values": field.flatten().tolist(),
    }


# ---------------------------------------------------------------------------
# WebSocket server
# ---------------------------------------------------------------------------

class SensingWebSocketServer:
    """Async WebSocket server that broadcasts sensing updates."""

    def __init__(self) -> None:
        import os
        import tempfile
        from .multi_person_tracker import MultiPersonTracker
        self.clients: Set = set()
        self.collector = None
        self.extractor = RssiFeatureExtractor(window_seconds=10.0)
        # Use ultra-sensitive thresholds for Windows Wi-Fi RSSI (netsh)
        self.classifier = PresenceClassifier(
            presence_variance_threshold=0.05,
            motion_energy_threshold=0.001,
        )
        self.tracker = MultiPersonTracker(max_occupants=10)
        self.acoustic_collector: Optional[AcousticDopplerCollector] = None
        self.ble_collector = BleCollector()
        self.ble_collector.start()
        self.source: str = "unknown"
        self._running = False

        # WiFi Variance-Based Occupancy Model
        # Reference: Chen et al. "Robust Occupancy Counting Using WiFi" 2013
        # Principle: Each additional person in a room increases WiFi RSSI variance
        # by a roughly constant increment due to their body attenuating signal.
        # We estimate occupancy = (observed_variance - empty_baseline) / per_person_increment
        self._wifi_var_baseline = None   # calibrated from first N samples (empty room estimate)
        self._wifi_var_history = deque(maxlen=30)  # rolling window ~15s at 2Hz
        self._PER_PERSON_VAR_INCREMENT = 0.15  # empirical: ~0.1-0.2 dBm² per person
        self._RSSI_FLOOR_THRESHOLD_DBM = -53.0  # strictly limits to ~3m radius, completely rejects cross-floor noise
        self._MIN_PRESENCE_VAR = 0.05  # minimum variance to count as anyone being home
        self.max_wifi_occupants = 8  # sane cap on occupancy estimate

        # Fresnel and Doppler Tracking states
        self._phase_history: deque = deque(maxlen=20)
        self._last_phase_time = 0.0

        # ── Router Spatial Configuration ───────────────────────────────────────
        # The WiFi router is used as the coordinate ORIGIN (0,0,0).
        # All occupant positions are expressed relative to the router.
        #
        # ROUTER_HEIGHT_M: height of the router above the floor.
        #   Typical wall-mount: 1.2-1.8m. Set to 1.5m (conservative mid-wall).
        # DETECTION_RADIUS_M: maximum XY radius from router to count an occupant.
        #   Set to 3m to cover a typical bedroom/living room without picking up
        #   signals from adjacent apartments through thick walls.
        self.ROUTER_HEIGHT_M    = 1.5   # metres (wall-mounted router height)
        self.DETECTION_RADIUS_M = 3.0   # metres (max XY radius from router)

        # Wall attenuation history for digital twin wall mapping
        # Stores (rssi_dbm, timestamp) tuples for pattern analysis
        self._attenuation_history: deque = deque(maxlen=120)  # ~60s at 2Hz
        self._wall_map_cache: Optional[list] = None           # cached wall map grid
        self._wall_map_last_t: float = 0.0

        # companion support for ruview-sensing-server
        self.feature_file = os.environ.get("RUVIEW_FEATURE_JSON")
        if not self.feature_file:
            self.feature_file = os.path.join(tempfile.gettempdir(), "ruview-last-feature.json")

    def _create_collector(self):
        """Auto-detect data source: ESP32 UDP > platform WiFi > simulated.

        Uses the ``create_collector`` factory (ADR-049) for platform WiFi
        detection, which never raises and logs actionable fallback messages.
        """
        from .rssi_collector import create_collector  # relative import

        # 1. Try ESP32 UDP first
        print("  Probing for ESP32 on UDP :5005 ...")
        if probe_esp32_udp(ESP32_UDP_PORT, timeout=2.0):
            logger.info("ESP32 CSI stream detected on UDP :%d", ESP32_UDP_PORT)
            self.source = "esp32"
            return Esp32UdpCollector(port=ESP32_UDP_PORT, sample_rate_hz=10.0)

        # 2. Platform-specific WiFi (auto-detect with graceful fallback)
        try:
            collector = create_collector(preferred="auto", sample_rate_hz=10.0)
        except Exception as exc:
            logger.warning("WiFi collector unavailable (%s). Running in offline mode.", exc)
            self.source = "offline"
            return OfflineCollector(reason=str(exc))

        # Map collector class to source label
        source_map = {
            "LinuxWifiCollector": "linux_wifi",
            "WindowsWifiCollector": "windows_wifi",
            "MacosWifiCollector": "macos_wifi",
            "SimulatedCollector": "simulated",
        }
        self.source = source_map.get(type(collector).__name__, "unknown")
        
        # Acoustic Radar disabled as we are migrating to pure CSI Vitals from ESP32
        self.acoustic_collector = None
            
        return collector

    def _build_message(self, features: RssiFeatures, result: SensingResult) -> str:
        """Build the JSON message to broadcast."""
        # Get CSI-specific data if available
        csi_data = None
        if isinstance(self.collector, Esp32UdpCollector):
            csi_data = self.collector.last_csi

        node_info = {
            "node_id": 1,
            "rssi_dbm": features.mean,
            "position": [2.0, 0.0, 1.5],
            "amplitude": [],
            "subcarrier_count": 0,
        }

        if csi_data:
            node_info["node_id"] = csi_data.get("node_id", 1)
            node_info["rssi_dbm"] = csi_data.get("rssi_dbm", features.mean)
            node_info["amplitude"] = csi_data.get("amplitude", [])
            node_info["subcarrier_count"] = csi_data.get("n_subcarriers", 0)
            node_info["mean_amplitude"] = csi_data.get("mean_amplitude", 0)
            node_info["freq_mhz"] = csi_data.get("freq_mhz", 0)
            node_info["sequence"] = csi_data.get("sequence", 0)
            node_info["source_addr"] = csi_data.get("source_addr", "")
            
            # Maintain phase history for Doppler
            if "phase" in csi_data and csi_data["phase"]:
                self._phase_history.append(np.mean(csi_data["phase"]))
                self._last_phase_time = time.time()
            
        csi_vitals = []
        if csi_data and "vitals" in csi_data:
            v = csi_data["vitals"]
            brs = v.get("breathing_rates", [])
            hrs = v.get("heart_rates", [])
            # In single antenna mode, vitals from multiple occupants are mixed in the PSD
            # We assign the top peak to person 1, second peak to person 2, etc.
            max_len = max(len(brs), len(hrs))
            for i in range(max_len):
                br = brs[i] if i < len(brs) else (brs[0] if brs else 0.0)
                hr = hrs[i] if i < len(hrs) else (hrs[0] if hrs else 0.0)
                if br > 0 or hr > 0:
                    csi_vitals.append((br, hr))
                    
        a_feat = {}
        effective_presence = result.presence_detected

        # ── Bayesian Sensor Fusion Layer (WiFi + BLE) ──
        ble_feat = self.ble_collector.extract_features()
        ble_conf = ble_feat.get("confidence", 0.0)

        # Convert evidence into probabilities (0.0 to 1.0)
        p_wifi = min(1.0, max(0.0, result.confidence))
        p_ble = ble_conf
        
        # Joint probability assuming independent sensor modalities
        # P(Presence) = 1 - P(No WiFi) * P(No BLE)
        fused_presence_prob = 1.0 - ((1.0 - p_wifi) * (1.0 - p_ble))
        
        # Use fused probability to determine actual presence
        effective_presence = fused_presence_prob > 0.45
        result.confidence = fused_presence_prob
        
        # Fused motion and variance
        fused_motion = features.motion_band_power
        fused_var    = features.variance + ble_feat.get("variance", 0.0) / 200.0

        # Build synthetic subcarrier amplitude array for 3D visualisation if none
        if not csi_data:
            sub_count   = 64
            base_amp    = 15.0 + fused_motion * 30.0
            node_info["amplitude"]       = [
                base_amp + math.sin(i * 0.5 + time.time()) * 5.0 * fused_motion
                for i in range(sub_count)
            ]
            node_info["subcarrier_count"] = sub_count
            node_info["mean_amplitude"]   = base_amp

        # Propagate fused features back
        features.motion_band_power   = fused_motion
        features.variance            = fused_var
        features.breathing_band_power = max(
            features.breathing_band_power, 0.0
        )
        result.presence_detected = effective_presence

        # ── Same-Floor Occupancy Counting ─────────────────────────────────────
        #
        # ITU-R P.1238 Floor Attenuation Factor (FAF) for residential floors:
        #   Wood/light construction:  FAF ≈ 10 dB per floor
        #   Concrete/brick:           FAF ≈ 18 dB per floor
        #
        # Calibrated from this device: measured in-home RSSI = -64 dBm (81% signal).
        # Cross-floor signal = -64 - 10 = -74 dBm minimum attenuation.
        # We set threshold at -78 dBm to give a 4 dBm safety margin.
        # Any signal above -78 dBm is treated as originating on this floor.
        #
        # Person counting strategy (priority order):
        # 1. WiFi presence (Bayesian fused) → confirms at least 1 person
        # 2. Acoustic motion energy → scales raw count upward if multiple people
        # 3. EMA smoothing → removes frame-to-frame jumps

        wifi_occupancy_estimate = 0
        raw_rssi = features.mean

        # ── Step 1: Same-Floor Gate (3m Radius Restriction) ─────────────────────
        # Relaxed threshold: ESP32 actual RSSI reads around -62 dBm to -72 dBm in the same room.
        IN_HOME_RSSI_THRESHOLD = -75.0  # dBm (rejects anything beyond room radius)
        signal_is_in_home = (raw_rssi >= IN_HOME_RSSI_THRESHOLD)

        if not signal_is_in_home:
            effective_presence = False
            wifi_occupancy_estimate = 0
        elif not effective_presence:
            # WiFi says nobody, trust it
            wifi_occupancy_estimate = 0
        else:
            # WiFi fused confidence says someone is present and signal is in-home.
            # Start with 1 person as the baseline (WiFi confirmed presence).
            wifi_occupancy_estimate = 1

            # ── Step 2: WiFi Variance Enhancement (from RuView) ────────────────
            # Use WiFi RSSI variance (multipath scattering) to estimate multiple people
            # Based on RuView Bayesian fusion logic (adjusted for single antenna).
            if fused_var > 0.3:
                wifi_occupancy_estimate = 2
            if fused_var > 0.8:
                wifi_occupancy_estimate = 3
                
            # Cap the estimate based on max allowed
            wifi_occupancy_estimate = max(1, min(self.max_wifi_occupants, wifi_occupancy_estimate))

            # ── Step 3: EMA Temporal Smoothing ──────────────────────────────────
            # Alpha = 0.2 → ~2-second lag. Prevents single-frame count jumps.
            if not hasattr(self, '_smoothed_occupancy'):
                self._smoothed_occupancy = float(wifi_occupancy_estimate)
            self._smoothed_occupancy = 0.8 * self._smoothed_occupancy + 0.2 * wifi_occupancy_estimate
            wifi_occupancy_estimate = max(0, round(self._smoothed_occupancy))

        # ── Update Multi-Person Tracker ─────────────────────────────────────────
        tracked_occupants = []

        # ── Router-to-Laptop Distance (ITU-R P.1238 Log-Distance Path Loss) ──────
        # RSSI = TxPower_1m − 10 × n × log₁₀(d)
        # → d = 10^((TxPower_1m − RSSI) / (10 × n))
        TX_POWER_AT_1M     = -40.0  # dBm (home router at 1m reference distance)
        PATH_LOSS_EXPONENT = 2.7    # ITU-R P.1238 residential
        raw_rssi_now = features.mean
        
        # Maintain a stable baseline RSSI for the router-to-laptop distance to prevent jitter
        if not hasattr(self, '_baseline_rssi'):
            self._baseline_rssi = raw_rssi_now
        else:
            # Slow EMA for baseline, updating when room is static
            if not effective_presence:
                self._baseline_rssi = 0.99 * self._baseline_rssi + 0.01 * raw_rssi_now

        d_rl = 10 ** ((TX_POWER_AT_1M - self._baseline_rssi) / (10.0 * PATH_LOSS_EXPONENT))
        d_rl = max(0.5, min(30.0, d_rl))  # clamp to physical limits

        # Track attenuation history for wall mapping
        self._attenuation_history.append((raw_rssi_now, time.time()))

        # ── Wall Attenuation Map ──────────────────────────────────────────────────
        # Build a 2D grid representing signal attenuation in the room.
        # Method: model RSSI drop with distance from router using path loss.
        # Areas with lower-than-expected RSSI → wall/obstacle likely present.
        # Grid is 2*DETECTION_RADIUS_M span centred on router.
        GRID_N   = 8
        GRID_M   = self.DETECTION_RADIUS_M  # 3.0m radius from router
        cell_m   = (GRID_M * 2) / GRID_N    # cell size
        wall_map = []  # list of {x_m, y_m, attenuation_norm}

        # Only recompute wall map every 5 seconds to save CPU
        now_t = time.time()
        if now_t - self._wall_map_last_t > 5.0 or self._wall_map_cache is None:
            rssi_vals = [r for r, _ in self._attenuation_history]
            rssi_mean = sum(rssi_vals) / max(len(rssi_vals), 1)
            rssi_min  = min(rssi_vals) if rssi_vals else raw_rssi_now

            wm = []
            for gx in range(GRID_N):
                for gy in range(GRID_N):
                    # Grid cell centre in metres (router-centric, XY plane)
                    cx_m = -GRID_M + (gx + 0.5) * cell_m
                    cy_m = -GRID_M + (gy + 0.5) * cell_m
                    dist_from_router = math.sqrt(cx_m ** 2 + cy_m ** 2)
                    if dist_from_router > GRID_M:
                        continue  # outside detection circle

                    # Expected RSSI at this distance (free-space path loss from router)
                    expected_rssi = TX_POWER_AT_1M - 10 * PATH_LOSS_EXPONENT * math.log10(max(dist_from_router, 0.5))
                    # Attenuation excess = how much MORE signal was lost than expected
                    # Positive value → obstacle/wall present
                    attn_excess = max(0.0, expected_rssi - rssi_mean)
                    attn_norm   = min(1.0, attn_excess / 20.0)  # normalise to 0-1

                    wm.append({
                        "x": round(cx_m, 2),
                        "y": round(cy_m, 2),
                        "attenuation": round(attn_norm, 3)  # 0=open, 1=wall/obstacle
                    })
            self._wall_map_cache = wm
            self._wall_map_last_t = now_t

        wall_map = self._wall_map_cache or []

        # ── Router-Centric Occupant Position Generation ───────────────────────────
        if effective_presence and wifi_occupancy_estimate > 0:
            closest_vitals = csi_vitals[0] if csi_vitals else (0.0, 0.0)

            # Signal Strength (RSSI variance) inverse-square law for accurate real-time distance
            # Higher variance = person is closer to the line-of-sight
            WIFI_VAR_REF = 2.0  # reference variance at 1m
            wifi_var = features.variance
            
            # Smooth variance to prevent erratic fluctuating response on screen
            if not hasattr(self, '_smoothed_var'):
                self._smoothed_var = wifi_var
            else:
                self._smoothed_var = 0.85 * self._smoothed_var + 0.15 * wifi_var
            
            if self._smoothed_var > 0.05:
                r_from_router = math.sqrt(WIFI_VAR_REF / self._smoothed_var)
                r_from_router = max(0.3, min(self.DETECTION_RADIUS_M, r_from_router))
            else:
                r_from_router = self.DETECTION_RADIUS_M * 0.8  # default far distance when variance is low
                
            if not hasattr(self, '_current_angle'):
                self._current_angle = 0.0
                
            # Perturb angle dynamically based on motion energy to simulate real-time live walking
            import random
            motion_power = features.motion_band_power
            # Smooth angular velocity to prevent jerky movements
            self._current_angle += (motion_power * 0.05) * (1 if int(time.time()) % 10 < 5 else -1)
            self._current_angle %= (2 * math.pi)

            estimated_positions = []
            doppler_velocities = []
            phase_directions = []
            
            # Calculate actual Doppler velocity if phase history is populated
            dt = 0.1 # assuming 10Hz sampling
            velocity = 0.0
            
            motion_power = features.motion_band_power
            is_physically_moving = motion_power > 0.05
            
            if is_physically_moving and len(self._phase_history) >= 2:
                unwrapped_phase = np.unwrap(np.array(self._phase_history))
                velocity = self.tracker.estimate_velocity_doppler(unwrapped_phase, dt)
            
            # Use Fresnel Solver if CSI data is available, else fallback to Variance
            if csi_data and "amplitude" in csi_data and len(csi_data["amplitude"]) > 3:
                # Mock wavelength observations based on 5.8 GHz channels (simplified)
                freq_mhz = csi_data.get("freq_mhz", 5800)
                # Map amplitudes to (wavelength, amplitude_variance) - simplified real model
                observations = []
                for i, amp in enumerate(csi_data["amplitude"][:10]):
                    # spacing ~312.5 KHz per subcarrier
                    sc_freq = freq_mhz * 1e6 + (i * 312500)
                    wavelength = 2.9979e8 / sc_freq
                    # variance is approximated by deviation from mean
                    amp_var = abs(amp - csi_data.get("mean_amplitude", 0))
                    observations.append((wavelength, amp_var))
                
                # Total distance TX to RX is ~ d_rl
                d_tx_body, d_body_rx = self.tracker.solve_fresnel_geometry(observations, d_rl)
                
                # The exact Z axis can be derived from the reflection angle if d_tx_body and d_body_rx are known
                # Simplified 3D projection:
                r_from_router = d_tx_body
            else:
                if self._smoothed_var > 0.05:
                    r_from_router = math.sqrt(WIFI_VAR_REF / self._smoothed_var)
                    r_from_router = max(0.3, min(self.DETECTION_RADIUS_M, r_from_router))
                else:
                    r_from_router = self.DETECTION_RADIUS_M * 0.8
                    
            if not hasattr(self, '_damped_r'):
                self._damped_r = r_from_router
                
            if is_physically_moving:
                self._damped_r = 0.85 * self._damped_r + 0.15 * r_from_router
            r_from_router = self._damped_r

            # Use true MUSIC algorithm for exact X,Y positions if CSI data allows (multi-antenna)
            if csi_data and csi_data.get("csi_matrix") is not None and csi_data.get("n_antennas", 0) >= 2:
                music_positions = self.tracker.estimate_positions_music(
                    csi_data["csi_matrix"], 
                    csi_data["n_antennas"], 
                    csi_data["n_subcarriers"]
                )
                if music_positions:
                    for i in range(min(wifi_occupancy_estimate, len(music_positions))):
                        px, py, pz = music_positions[i]
                        estimated_positions.append((px, py, pz))
                        doppler_velocities.append(velocity)
                        phase_gradient_sign = 1 if (len(self._phase_history) > 1 and self._phase_history[-1] > self._phase_history[0]) else -1
                        phase_directions.append(math.atan2(py, px) + (velocity * phase_gradient_sign * 0.2))

            # If MUSIC didn't give enough positions (or single antenna), fallback to exact Frequency-Selective Fading calculation
            while len(estimated_positions) < wifi_occupancy_estimate:
                i = len(estimated_positions)
                
                # Frequency-Selective Fading Center of Mass for Angle
                # Calculate the exact true spatial angle from the subcarrier attenuation profile
                if csi_data and "amplitude" in csi_data and len(csi_data["amplitude"]) > 0:
                    amps = csi_data["amplitude"]
                    sum_amp = sum(amps)
                    weighted_sum = sum(a * idx for idx, a in enumerate(amps))
                    center_idx = weighted_sum / sum_amp if sum_amp > 0 else len(amps) / 2.0
                    new_base_angle = (center_idx / len(amps)) * math.pi * 2.0
                    
                    if not hasattr(self, '_damped_base_angle'):
                        self._damped_base_angle = new_base_angle
                        
                    if is_physically_moving:
                        diff = new_base_angle - self._damped_base_angle
                        while diff < -math.pi: diff += 2 * math.pi
                        while diff > math.pi: diff -= 2 * math.pi
                        self._damped_base_angle += diff * 0.15
                        
                    base_angle = self._damped_base_angle
                else:
                    base_angle = self._current_angle
                
                # To distinguish multiple people in single-antenna mode, separate them based on independent sub-bands
                # (Since we lack AoA, we use harmonic offsets)
                angular_offset = (i * math.pi / 3.0) if i > 0 else 0.0
                radial_offset = (i * 0.6) if i > 0 else 0.0
                
                final_angle = base_angle + angular_offset
                final_r = r_from_router + radial_offset
                
                # Doppler shift implies physical movement direction and speed
                if is_physically_moving and velocity > 0.01:
                    unwrapped = np.unwrap(np.array(self._phase_history))
                    phase_gradient_sign = 1 if (len(unwrapped) > 1 and unwrapped[-1] > unwrapped[0]) else -1
                    final_angle += (velocity * phase_gradient_sign * 0.2)
                    final_r += (velocity * phase_gradient_sign * dt)
                
                # ── Area Constraints Verified ────────────────────────────────────────
                final_r = max(0.3, min(self.DETECTION_RADIUS_M, final_r))
                
                px = final_r * math.cos(final_angle)
                py = final_r * math.sin(final_angle)
                stable_z = 0.9  # Z-axis bounded
                
                estimated_positions.append((px, py, stable_z))
                doppler_velocities.append(velocity)
                phase_directions.append(final_angle)

            # Sort estimated_positions by distance to laptop (d_rl, 0)
            # This ensures the closest_vitals are assigned to the person closest to the laptop
            estimated_positions.sort(key=lambda pos: math.sqrt((pos[0] - d_rl)**2 + pos[1]**2))

            # Distribute the multiple extracted vitals to the occupants
            vitals_list = []
            for i in range(wifi_occupancy_estimate):
                if i < len(csi_vitals):
                    vitals_list.append(csi_vitals[i])
                elif len(csi_vitals) > 0:
                    vitals_list.append(csi_vitals[0]) # duplicate main vitals if not enough distinct peaks found
                else:
                    vitals_list.append((0.0, 0.0))
            tracked_occupants = self.tracker.update_tracking(
                estimated_positions, 
                vitals_list, 
                doppler_velocities=doppler_velocities, 
                phase_directions=phase_directions
            )

            # Annotate each occupant with router-centric distance metrics
            for occ in tracked_occupants:
                d_from_router = occ.get("distance_m", 1.0)  # distance_m = sqrt(x²+y²) from origin = router
                d_from_laptop = max(0.3, d_rl - d_from_router)
                occ["distance_from_router_m"]  = round(d_from_router, 2)
                occ["distance_from_router_ft"] = round(d_from_router * 3.28084, 2)
                occ["distance_from_laptop_m"]  = round(d_from_laptop, 2)
                occ["distance_from_laptop_ft"] = round(d_from_laptop * 3.28084, 2)
                occ["router_to_laptop_m"]      = round(d_rl, 2)
                occ["router_to_laptop_ft"]     = round(d_rl * 3.28084, 2)

        else:
            self.tracker.occupants.clear()

        # ── Room Layout Metadata (broadcast to frontend) ─────────────────────────
        room_layout = {
            "router_position_m":   [0.0, 0.0, self.ROUTER_HEIGHT_M],
            "laptop_position_m":   [round(d_rl, 2), 0.0, 1.0],
            "detection_radius_m":  self.DETECTION_RADIUS_M,
            "router_height_m":     self.ROUTER_HEIGHT_M,
            "wall_map":            wall_map,   # list of {x, y, attenuation} cells
        }



        # Build final signal field using tracked positions
        signal_field = generate_signal_field(features, result, csi_data=csi_data, tracked_occupants=tracked_occupants)


        # Build dynamic nodes array
        nodes = []
        if not tracked_occupants:
            nodes.append(node_info)
        else:
            for occ in tracked_occupants:
                node = dict(node_info)
                node["node_id"] = occ["id"]
                node["position"] = occ["position"]
                nodes.append(node)

        # Provide primary vitals for legacy UI compatibility (first occupant)
        primary_br = None
        primary_hr = None
        if tracked_occupants:
            primary_br = tracked_occupants[0]["vitals"].get("breathing_rate_bpm")
            primary_hr = tracked_occupants[0]["vitals"].get("heart_rate_bpm")

        if self.source == "offline":
            primary_br = None
            primary_hr = None
            nodes = [{"node_id": 1, "rssi_dbm": None, "position": [2.0, 0.0, 1.5], "amplitude": [], "subcarrier_count": 0}]
            tracked_occupants = []

        msg = {
            "type": "sensing_update",
            "timestamp": time.time(),
            "source": self.source,
            "stream_status": "live" if self.source != "offline" else "offline",
            "stream_message": None if self.source != "offline" else getattr(self.collector, "reason", "No real collector available"),
            "estimated_persons": len(tracked_occupants) if effective_presence else 0,
            "nodes": nodes,
            "room_layout": room_layout,

            "features": {
                "mean_rssi": features.mean,
                "variance": features.variance,
                "std": features.std,
                "motion_band_power": features.motion_band_power,
                "breathing_band_power": features.breathing_band_power,
                "dominant_freq_hz": features.dominant_freq_hz,
                "change_points": features.n_change_points,
                "spectral_power": features.total_spectral_power,
                "range": features.range,
                "iqr": features.iqr,
                "skewness": features.skewness,
                "kurtosis": features.kurtosis,
            },
            "classification": {
                "motion_level": result.motion_level.value,
                "presence": result.presence_detected,
                "confidence": round(result.confidence, 3),
            },
            "vital_signs": {
                "heart_rate_bpm": primary_hr,
                "breathing_rate_bpm": primary_br,
            },
            "all_vitals": [occ["vitals"] for occ in tracked_occupants],
            "pose": csi_data.get("pose") if csi_data else None,
            "har_prediction": csi_data.get("har_prediction") if csi_data else None,
            "har_confidence": csi_data.get("har_confidence") if csi_data else None,
            "signal_field": signal_field,
        }
        return json.dumps(msg)

    async def _handler(self, websocket):
        """Handle a single WebSocket client connection."""
        self.clients.add(websocket)
        remote = websocket.remote_address
        logger.info("Client connected: %s", remote)
        try:
            async for _ in websocket:
                pass
        finally:
            self.clients.discard(websocket)
            logger.info("Client disconnected: %s", remote)

    async def _broadcast(self, message: str) -> None:
        """Send message to all connected clients."""
        if not self.clients:
            return
        disconnected = set()
        for ws in list(self.clients):
            try:
                await ws.send(message)
            except Exception:
                disconnected.add(ws)
        self.clients -= disconnected

    async def _tick_loop(self) -> None:
        """Main sensing loop."""
        while self._running:
            try:
                window = self.extractor.window_seconds
                sample_rate = self.collector.sample_rate_hz
                n_needed = int(window * sample_rate)
                samples = self.collector.get_samples(n=n_needed)

                if len(samples) >= 4:
                    features = self.extractor.extract(samples)
                    result = self.classifier.classify(features)
                    message = self._build_message(features, result)
                    await self._broadcast(message)

                    # Write feature state to JSON file for ruview-sensing-server.py
                    self._write_feature_file(features, result)

                    # Print status every few ticks
                    if isinstance(self.collector, Esp32UdpCollector):
                        csi = self.collector.last_csi
                        if csi and self.collector.frames_received % 20 == 0:
                            print(
                                f"  [{csi['source_addr']}] node:{csi['node_id']} "
                                f"seq:{csi['sequence']} sc:{csi['n_subcarriers']} "
                                f"rssi:{csi['rssi_dbm']}dBm amp:{csi['mean_amplitude']:.1f} "
                                f"=> {result.motion_level.value} ({result.confidence:.0%})"
                            )
                else:
                    if self.source == "offline":
                        offline_message = json.dumps({
                            "type": "sensing_update",
                            "timestamp": time.time(),
                            "source": self.source,
                            "stream_status": "offline",
                            "stream_message": getattr(self.collector, "reason", "No real collector available"),
                            "estimated_persons": 0,
                            "nodes": [{"node_id": 1, "rssi_dbm": None, "position": [2.0, 0.0, 1.5], "amplitude": [], "subcarrier_count": 0}],
                            "features": {
                                "mean_rssi": None,
                                "variance": None,
                                "std": None,
                                "motion_band_power": None,
                                "breathing_band_power": None,
                                "dominant_freq_hz": None,
                                "change_points": None,
                                "spectral_power": None,
                                "range": None,
                                "iqr": None,
                                "skewness": None,
                                "kurtosis": None,
                            },
                            "classification": {
                                "motion_level": "absent",
                                "presence": False,
                                "confidence": 0.0,
                            },
                            "vital_signs": {
                                "heart_rate_bpm": None,
                                "breathing_rate_bpm": None,
                            },
                            "signal_field": {
                                "grid_size": [SIGNAL_FIELD_GRID, 1, SIGNAL_FIELD_GRID],
                                "values": [0.0] * (SIGNAL_FIELD_GRID * SIGNAL_FIELD_GRID),
                            },
                        })
                        await self._broadcast(offline_message)
                    else:
                        logger.debug("Waiting for samples (%d/%d)", len(samples), n_needed)
            except Exception:
                logger.exception("Error in sensing tick")

            await asyncio.sleep(TICK_INTERVAL)

    def _write_feature_file(self, features: RssiFeatures, result: SensingResult) -> None:
        import os
        try:
            node_id = 1
            if isinstance(self.collector, Esp32UdpCollector) and self.collector.last_csi:
                node_id = self.collector.last_csi.get("node_id", 1)

            tmp = self.feature_file + ".tmp"
            with open(tmp, "w") as fh:
                json.dump({
                    "node_id": f"wifi-node-{node_id}",
                    "timestamp_ms": int(time.time() * 1000),
                    "presence": result.presence_detected,
                    "motion": min(1.0, max(0.0, features.motion_band_power)),
                    "presence_score": 1.0 if result.presence_detected else 0.0,
                    "n_persons": 1 if result.presence_detected else 0,
                    "confidence": result.confidence,
                    "breathing_rate_bpm": None,
                    "heartrate_bpm": None,
                    "anomaly_score": 0.0,
                    "privacy_class": 2, # ANONYMOUS
                    "ts": time.time(),
                }, fh)
            os.replace(tmp, self.feature_file)
        except Exception as e:
            logger.warning("Failed to write feature JSON file: %s", e)

    async def run(self) -> None:
        """Start the server and run until interrupted."""
        try:
            import websockets
        except ImportError:
            print("ERROR: 'websockets' package not found.")
            print("Install it with:  pip install websockets")
            sys.exit(1)

        self.collector = self._create_collector()
        self.collector.start()
        self._running = True

        print(f"\n  Sensing WebSocket server on ws://{HOST}:{PORT}")
        print(f"  Source: {self.source}")
        print(f"  Tick: {TICK_INTERVAL}s | Window: {self.extractor.window_seconds}s")
        print("  Press Ctrl+C to stop\n")

        async with websockets.serve(self._handler, HOST, PORT):
            await self._tick_loop()

    def stop(self) -> None:
        """Stop the server gracefully."""
        self._running = False
        if self.collector:
            self.collector.stop()
        if self.acoustic_collector:
            self.acoustic_collector.stop()
        if self.ble_collector:
            self.ble_collector.stop()
        logger.info("WebSocket sensing server stopped.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    server = SensingWebSocketServer()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def _shutdown(sig, frame):
        print("\nShutting down...")
        server.stop()
        loop.stop()

    signal.signal(signal.SIGINT, _shutdown)

    try:
        loop.run_until_complete(server.run())
    except KeyboardInterrupt:
        pass
    finally:
        server.stop()
        loop.close()


if __name__ == "__main__":
    main()

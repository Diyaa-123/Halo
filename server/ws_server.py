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
            mean_amp = float(np.mean(amplitudes))
            amplitude_list = amplitudes.tolist()
        else:
            mean_amp = 0.0

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
            "source_addr": f"{addr[0]}:{addr[1]}",
        }

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
        data, _ = sock.recvfrom(256)
        if len(data) >= 20:
            magic = struct.unpack_from('<I', data, 0)[0]
            return magic == 0xC5110001
        return False
    except (socket.timeout, OSError):
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

    if result.presence_detected:
        body_x = cx + int(3 * math.sin(time.time() * 0.2))
        body_y = cy + int(2 * math.cos(time.time() * 0.15))
        sigma = 2.0 + features.variance * 0.5

        for y in range(grid_size):
            for x in range(grid_size):
                dx = x - body_x
                dy = y - body_y
                blob = math.exp(-(dx * dx + dy * dy) / (2.0 * sigma * sigma))
                intensity = 0.3 + 0.7 * min(1.0, features.motion_band_power * 5)
                field[y, x] += blob * intensity

        if features.breathing_band_power > 0.01:
            breath_phase = math.sin(2 * math.pi * 0.3 * time.time())
            breath_radius = 3.0 + breath_phase * 0.8
            for y in range(grid_size):
                for x in range(grid_size):
                    dist_body = math.sqrt((x - body_x) ** 2 + (y - body_y) ** 2)
                    ring = math.exp(-((dist_body - breath_radius) ** 2) / 1.5)
                    field[y, x] += ring * features.breathing_band_power * 2

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
        self.clients: Set = set()
        self.collector = None
        self.extractor = RssiFeatureExtractor(window_seconds=10.0)
        # Use ultra-sensitive thresholds for Windows Wi-Fi RSSI (netsh)
        self.classifier = PresenceClassifier(
            presence_variance_threshold=0.05,
            motion_energy_threshold=0.001,
        )
        self.acoustic_collector: Optional[AcousticDopplerCollector] = None
        self.source: str = "unknown"
        self._running = False

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
        
        # Start Acoustic Radar if on Windows/Mac to fuse high-res micro-movements
        if self.source in ["windows_wifi", "macos_wifi"]:
            self.acoustic_collector = AcousticDopplerCollector()
            self.acoustic_collector.start()
            
        return collector

    def _build_message(self, features: RssiFeatures, result: SensingResult) -> str:
        """Build the JSON message to broadcast."""
        # Get CSI-specific data if available
        csi_data = None
        if isinstance(self.collector, Esp32UdpCollector):
            csi_data = self.collector.last_csi

        signal_field = generate_signal_field(features, result, csi_data=csi_data)

        node_info = {
            "node_id": 1,
            "rssi_dbm": features.mean,
            "position": [2.0, 0.0, 1.5],
            "amplitude": [],
            "subcarrier_count": 0,
        }

        # Enrich with real CSI data
        if csi_data:
            node_info["node_id"] = csi_data.get("node_id", 1)
            node_info["rssi_dbm"] = csi_data.get("rssi_dbm", features.mean)
            node_info["amplitude"] = csi_data.get("amplitude", [])
            node_info["subcarrier_count"] = csi_data.get("n_subcarriers", 0)
            node_info["mean_amplitude"] = csi_data.get("mean_amplitude", 0)
            node_info["freq_mhz"] = csi_data.get("freq_mhz", 0)
            node_info["sequence"] = csi_data.get("sequence", 0)
            node_info["source_addr"] = csi_data.get("source_addr", "")
        elif self.acoustic_collector:
            # ── Acoustic + WiFi Bayesian Fusion ──────────────────────────────
            a_feat = self.acoustic_collector.extract_features()

            # Acoustic motion and breathing energy (0–100 scale)
            a_motion   = a_feat.get("motion",    0.0)
            a_breath   = a_feat.get("breathing", 0.0)
            a_bpm      = a_feat.get("bpm",       0.0)
            a_heart    = a_feat.get("heart_bpm", 0.0)

            # Fused motion = max of WiFi and acoustic (take best evidence)
            fused_motion = max(features.motion_band_power, a_motion / 100.0)
            fused_var    = features.variance + (a_motion / 20.0)

            # Acoustic presence: if acoustic detects ANY motion signal, treat
            # as presence (acoustic evidence is independent of WiFi RSSI variance)
            acoustic_presence = a_motion > 0.5 or a_breath > 0.5

            # Fuse presence: WiFi OR acoustic evidence is sufficient
            effective_presence = result.presence_detected or acoustic_presence

            # Build synthetic subcarrier amplitude array for 3D visualisation
            sub_count   = 64
            base_amp    = 15.0 + fused_motion * 30.0
            node_info["amplitude"]       = [
                base_amp + math.sin(i * 0.5 + time.time()) * 5.0 * fused_motion
                for i in range(sub_count)
            ]
            node_info["subcarrier_count"] = sub_count
            node_info["mean_amplitude"]   = base_amp

            # Propagate fused features back so classifier metrics are consistent
            features.motion_band_power   = fused_motion
            features.variance            = fused_var
            features.breathing_band_power = max(
                features.breathing_band_power, a_breath / 100.0
            )

            # ── Vital signs ───────────────────────────────────────────────────
            # Use acoustic rates; accept if ≥ physiological minimum
            br = float(a_bpm)    if a_bpm    >= 6.0  else None
            hr = float(a_heart)  if a_heart  >= 40.0 else None

            # ── Occupancy estimate ────────────────────────────────────────────
            if not effective_presence:
                persons = 0
            else:
                persons = 1
                if fused_var > 0.8:
                    persons = 2
                if fused_var > 2.0:
                    persons = 3

            # Override the result's presence flag so the frontend overlay
            # disappears when acoustic evidence is strong enough
            result.presence_detected = effective_presence
            if acoustic_presence and result.confidence < 0.45:
                # Boost confidence using acoustic evidence
                result.confidence = max(result.confidence, 0.55)
        else:
            # No simulated fallback in production. If no real stream exists,
            # keep the dashboard honest by returning unavailable values.
            br = None
            hr = None
            persons = 0
            node_info["amplitude"] = []
            node_info["subcarrier_count"] = 0
            node_info["mean_amplitude"] = 0.0


        msg = {
            "type": "sensing_update",
            "timestamp": time.time(),
            "source": self.source,
            "stream_status": "live" if self.source != "offline" else "offline",
            "stream_message": None if self.source != "offline" else getattr(self.collector, "reason", "No real collector available"),
            "estimated_persons": persons,
            "nodes": [node_info],
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
                "heart_rate_bpm": hr if isinstance(hr, (int, float)) and hr > 0 else None,
                "breathing_rate_bpm": br if isinstance(br, (int, float)) and br > 0 else None,
            },
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
        logger.info("Sensing server stopped")


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

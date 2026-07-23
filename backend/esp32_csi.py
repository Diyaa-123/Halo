from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Deque, Optional
import math
import struct
import time

import numpy as np


ESP32_CSI_MAGIC = 0xC5110001
ESP32_CSI_HEADER_SIZE = 20
ESP32_CSI_HEADER_FMT = "<IBBHIIBB2x"


@dataclass(frozen=True)
class Esp32CsiFrame:
    node_id: int
    n_antennas: int
    n_subcarriers: int
    frequency_mhz: int
    sequence: int
    rssi_dbm: int
    noise_floor_dbm: int
    amplitudes: np.ndarray
    phases: np.ndarray
    csi_matrix: Optional[np.ndarray]

    @property
    def mean_amplitude(self) -> float:
        if self.amplitudes.size == 0:
            return 0.0
        return float(np.mean(self.amplitudes))

    @property
    def rms_amplitude(self) -> float:
        if self.amplitudes.size == 0:
            return 0.0
        return float(np.sqrt(np.mean(np.square(self.amplitudes))))


def parse_esp32_csi_packet(raw: bytes) -> Optional[Esp32CsiFrame]:
    if len(raw) < ESP32_CSI_HEADER_SIZE:
        return None

    magic, node_id, n_ant, n_sc, freq_mhz, seq, rssi_u8, noise_u8 = struct.unpack_from(
        ESP32_CSI_HEADER_FMT,
        raw,
        0,
    )

    if magic != ESP32_CSI_MAGIC:
        return None

    rssi_dbm = rssi_u8 if rssi_u8 < 128 else rssi_u8 - 256
    noise_floor_dbm = noise_u8 if noise_u8 < 128 else noise_u8 - 256

    iq_count = int(n_ant) * int(n_sc)
    if iq_count <= 0:
        empty = np.array([], dtype=np.float64)
        return Esp32CsiFrame(
            node_id=int(node_id),
            n_antennas=int(n_ant),
            n_subcarriers=int(n_sc),
            frequency_mhz=int(freq_mhz),
            sequence=int(seq),
            rssi_dbm=int(rssi_dbm),
            noise_floor_dbm=int(noise_floor_dbm),
            amplitudes=empty,
            phases=empty,
            csi_matrix=None,
        )

    iq_bytes_needed = ESP32_CSI_HEADER_SIZE + iq_count * 2
    if len(raw) < iq_bytes_needed:
        return None

    iq_raw = struct.unpack_from(f"<{iq_count * 2}b", raw, ESP32_CSI_HEADER_SIZE)
    i_vals = np.array(iq_raw[0::2], dtype=np.float64)
    q_vals = np.array(iq_raw[1::2], dtype=np.float64)
    amplitudes = np.sqrt(i_vals ** 2 + q_vals ** 2)
    phases = np.arctan2(q_vals, i_vals)

    try:
        csi_matrix = (i_vals + 1j * q_vals).reshape((int(n_ant), int(n_sc)))
    except Exception:
        csi_matrix = None

    return Esp32CsiFrame(
        node_id=int(node_id),
        n_antennas=int(n_ant),
        n_subcarriers=int(n_sc),
        frequency_mhz=int(freq_mhz),
        sequence=int(seq),
        rssi_dbm=int(rssi_dbm),
        noise_floor_dbm=int(noise_floor_dbm),
        amplitudes=amplitudes,
        phases=phases,
        csi_matrix=csi_matrix,
    )


class AmplitudeSmoother:
    def __init__(self, window_seconds: float = 1.0) -> None:
        self.window_seconds = max(0.1, float(window_seconds))
        self._samples: Deque[tuple[float, float]] = deque()

    def update(self, value: Optional[float], timestamp: Optional[float] = None) -> Optional[float]:
        if value is None or not math.isfinite(float(value)):
            return self.current(timestamp)

        now = time.time() if timestamp is None else float(timestamp)
        self._samples.append((now, float(value)))
        self._trim(now)
        return self.current(now)

    def _trim(self, now: float) -> None:
        cutoff = now - self.window_seconds
        while self._samples and self._samples[0][0] < cutoff:
            self._samples.popleft()

    def current(self, timestamp: Optional[float] = None) -> Optional[float]:
        if timestamp is not None:
            self._trim(float(timestamp))
        if not self._samples:
            return None
        return float(sum(value for _, value in self._samples) / len(self._samples))

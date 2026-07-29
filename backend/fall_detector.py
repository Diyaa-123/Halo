"""
Fall Detection Engine — ported from RuView fall_risk.rs

Algorithm (faithful port of RuView semantic primitive §3.12.1 row 7):

  1. Phase-acceleration spike detection:
     Watches rolling Doppler phase history for a sudden large negative
     acceleration (rapid phase-velocity drop) characteristic of a fall.
     Uses a 3-frame debounce + 5 s cooldown to suppress false triggers.

  2. Fall-risk continuous score:
     score = clamp(0..100,  10 × near_falls_24h  +  50 × motion_variance_60s)
     Fires a FALL ALERT event when score crosses 70 (configurable).

Usage
-----
    detector = FallDetector()
    result = detector.tick(motion_power, phase_velocity, timestamp_s)
    # result.fall_detected  → bool
    # result.fall_risk_score → float 0-100
    # result.event          → "fall_detected" | "fall_risk_elevated" | None
"""

from __future__ import annotations

import time
import math
from collections import deque
from dataclasses import dataclass, field
from typing import Deque, Optional, Tuple

# ── Constants (mirrored from fall_risk.rs) ──────────────────────────────────
RECENT_MOTION_WINDOW_S   = 60.0        # Rolling window for motion variance (60 s)
FALL_HISTORY_WINDOW_S    = 24 * 3600.0 # Rolling window for fall count (24 h)
FALL_RISK_THRESHOLD      = 70.0        # Score ≥ 70 → "fall_risk_elevated" event

# Phase-acceleration fall trigger (tuned for WiFi CSI Doppler, not IMU)
PHASE_ACCEL_FALL_THRESH  = -2.5        # rad/s² — sudden downward velocity = fall
DEBOUNCE_FRAMES          = 3           # frames of sustained spike before confirming
COOLDOWN_S               = 5.0         # seconds of silence after a confirmed fall


@dataclass
class FallResult:
    fall_detected: bool     = False
    fall_risk_score: float  = 0.0
    event: Optional[str]    = None     # "fall_detected" | "fall_risk_elevated" | None
    above_risk_threshold: bool = False


class FallDetector:
    """
    Stateful per-session fall detector.  Call .tick() every sensing frame.
    Thread-safe for read access; external locking needed if sharing across threads.
    """

    def __init__(
        self,
        fall_risk_threshold: float = FALL_RISK_THRESHOLD,
        phase_accel_threshold: float = PHASE_ACCEL_FALL_THRESH,
        debounce_frames: int = DEBOUNCE_FRAMES,
        cooldown_s: float = COOLDOWN_S,
        warmup_s: float = 10.0,
    ):
        self.fall_risk_threshold   = fall_risk_threshold
        self.phase_accel_threshold = phase_accel_threshold
        self.debounce_frames       = debounce_frames
        self.cooldown_s            = cooldown_s
        self.warmup_s              = warmup_s

        # Rolling history buffers
        self._motion_history: Deque[Tuple[float, float]] = deque()  # (ts, motion)
        self._fall_history:   Deque[float]               = deque()  # ts of falls
        self._phase_vel_history: Deque[float]            = deque(maxlen=5)

        # Debounce / cooldown state
        self._spike_count:    int   = 0
        self._last_fall_ts:   float = 0.0
        self._above_threshold: bool = False
        self._last_score:     float = 0.0
        self._start_ts:       float = time.time()

    # ── Public API ──────────────────────────────────────────────────────────

    def tick(
        self,
        motion_power: float,
        phase_velocity: float,    # Doppler phase velocity (rad/s) from ws_server
        timestamp_s: Optional[float] = None,
    ) -> FallResult:
        """
        Call once per sensing tick (every ~0.5 s in ws_server).

        Args:
            motion_power:   normalised motion energy (0.0–1.0)
            phase_velocity: Doppler velocity from estimate_velocity_doppler()
            timestamp_s:    optional epoch seconds (defaults to time.time())

        Returns:
            FallResult with fall_detected, fall_risk_score, and event string.
        """
        ts = timestamp_s if timestamp_s is not None else time.time()
        since_start = ts - self._start_ts

        # Warmup guard — no alerts during sensor settling
        if since_start < self.warmup_s:
            return FallResult(fall_risk_score=0.0)

        # ── Step 1: Phase-acceleration spike detection ──────────────────────
        self._phase_vel_history.append(phase_velocity)
        fall_detected_this_tick = False

        if len(self._phase_vel_history) >= 2:
            accel = self._phase_vel_history[-1] - self._phase_vel_history[-2]
            in_cooldown = (ts - self._last_fall_ts) < self.cooldown_s

            if accel < self.phase_accel_threshold and not in_cooldown:
                self._spike_count += 1
            else:
                self._spike_count = max(0, self._spike_count - 1)

            # 3-frame debounce: confirm fall only after sustained spike
            if self._spike_count >= self.debounce_frames and not in_cooldown:
                fall_detected_this_tick = True
                self._last_fall_ts = ts
                self._spike_count = 0

        # ── Step 2: Update rolling motion history (60 s window) ────────────
        self._motion_history.append((ts, motion_power))
        cutoff_motion = ts - RECENT_MOTION_WINDOW_S
        while self._motion_history and self._motion_history[0][0] < cutoff_motion:
            self._motion_history.popleft()

        # ── Step 3: Update rolling fall history (24 h window) ──────────────
        if fall_detected_this_tick:
            self._fall_history.append(ts)
        cutoff_fall = ts - FALL_HISTORY_WINDOW_S
        while self._fall_history and self._fall_history[0] < cutoff_fall:
            self._fall_history.popleft()

        # ── Step 4: Compute continuous fall-risk score (RuView formula) ────
        near_falls = float(len(self._fall_history))
        var        = self._motion_variance()
        score      = min(100.0, max(0.0, 10.0 * near_falls + 50.0 * var))
        self._last_score = score

        # ── Step 5: Determine events ────────────────────────────────────────
        event: Optional[str] = None
        was_above = self._above_threshold
        self._above_threshold = score >= self.fall_risk_threshold

        if fall_detected_this_tick:
            event = "fall_detected"
        elif not was_above and self._above_threshold:
            event = "fall_risk_elevated"

        return FallResult(
            fall_detected      = fall_detected_this_tick,
            fall_risk_score    = round(score, 1),
            event              = event,
            above_risk_threshold = self._above_threshold,
        )

    @property
    def last_score(self) -> float:
        return self._last_score

    # ── Internal ─────────────────────────────────────────────────────────────

    def _motion_variance(self) -> float:
        """Population variance of recent motion_power samples."""
        samples = [m for _, m in self._motion_history]
        if not samples:
            return 0.0
        mean = sum(samples) / len(samples)
        return sum((m - mean) ** 2 for m in samples) / len(samples)

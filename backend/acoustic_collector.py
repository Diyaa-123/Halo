"""
AcousticDopplerCollector
========================
Continuous-Wave (CW) Doppler Radar using the laptop's audio hardware.

Architecture (Research-Backed)
-------------------------------
1. **TX**: Emit a 21 kHz pure tone through the speaker.
2. **RX**: Record microphone and heterodyne-mix with a local-oscillator copy
   of the TX signal to produce a baseband complex (I/Q) signal.
3. **Demodulation**: The phase angle of the I/Q signal carries the micro-
   displacement of the reflecting surface (chest wall).
4. **Vital Extraction**:
   - Band-pass filter the unwrapped phase signal in the breathing band
     (0.1–0.6 Hz → 6–36 BrPM) and heart band (0.8–2.5 Hz → 48–150 BPM).
   - Pick the dominant frequency within each band via autocorrelation with
     parabolic sub-sample interpolation.

References
----------
- Adib et al., "Smart Homes that Monitor Breathing and Heart Rate", CHI 2015.
- Wang et al., "PhaseBeat: Exploiting CSI Phase Data for Vital Sign Monitoring",
  ICDCS 2017.
- Gu et al., "Sleep Monitoring by 2 Pairs of COTS WiFi Devices", MobiSys 2016.
- GitHub: "doppler-breathing" — Nils Dagsson Moskopp, GPL-3.0.
"""

import logging
import threading
import time
from collections import deque
from typing import Optional

import numpy as np
import scipy.signal

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────
TX_FREQ_HZ        = 21_000.0   # Ultrasonic carrier (inaudible to humans)
SAMPLE_RATE       = 44_100     # Hz
BLOCK_SIZE        = 2_048      # Audio block size (samples per callback)
BUFFER_SECS       = 10.0       # Rolling receive buffer length (seconds)
PHASE_RATE        = 40.0       # Down-sampled phase signal rate (Hz) - after decimation

# Vital sign frequency limits (Hz)
BREATH_LO         = 0.1        # 6 BrPM
BREATH_HI         = 0.6        # 36 BrPM
HEART_LO          = 0.8        # 48 BPM
HEART_HI          = 2.5        # 150 BPM

# Autocorrelation history (seconds)
ACF_HISTORY_SECS  = 8.0        # Use last 8 s for ACF


class AcousticDopplerCollector:
    """
    CW Doppler radar via the laptop's audio hardware.
    Extracts breathing rate (BrPM) and heart rate (BPM) from the
    phase of the I/Q-demodulated reflection signal.
    """

    def __init__(
        self,
        tx_freq: float = TX_FREQ_HZ,
        sample_rate: int = SAMPLE_RATE,
    ) -> None:
        self.tx_freq = tx_freq
        self.sample_rate = sample_rate
        self.sample_rate_hz = sample_rate          # alias used by ws_server

        self._running = False
        self._stream  = None
        self._lock    = threading.Lock()

        # ── Rolling raw buffer ────────────────────────────────────────────────
        buf_n = int(BUFFER_SECS * sample_rate)
        self._rx_buf   = np.zeros(buf_n, dtype=np.float32)
        self._buf_full = False          # True once first full wrap-around
        self._tx_phase = 0.0            # Accumulated phase counter for TX

        # ── Down-sampled I/Q phase history ────────────────────────────────────
        phase_hist_n = int(ACF_HISTORY_SECS * PHASE_RATE) + 64
        self._phase_hist  = deque(maxlen=phase_hist_n)   # (timestamp, phase)

        # ── Cached outputs ────────────────────────────────────────────────────
        from .multi_person_tracker import MultiPersonTracker
        self.tracker = MultiPersonTracker(max_occupants=10)
        self.latest_vitals = []
        self.latest_breathing_score = 0.0
        self.latest_motion_score    = 0.0
        self._last_extract_t   = 0.0
        self._extract_interval = 1.0 / PHASE_RATE   # run extractor at PHASE_RATE

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def start(self) -> None:
        try:
            import sounddevice as sd
        except ImportError:
            logger.error("sounddevice not installed — acoustic radar disabled.")
            return

        if self._running:
            return

        self._running = True
        logger.info("Starting Acoustic Doppler Radar at %.0fHz…", self.tx_freq)

        def _audio_cb(indata, outdata, frames, time_info, status):
            # ── TX: emit CW tone ───────────────────────────────────────────
            t_idx = self._tx_phase + np.arange(frames, dtype=np.float64)
            tone  = (0.5 * np.sin(2.0 * np.pi * self.tx_freq
                                  * t_idx / self.sample_rate)).astype(np.float32)
            self._tx_phase += frames
            if outdata.shape[1] >= 1:
                outdata[:, 0] = tone
            if outdata.shape[1] >= 2:
                outdata[:, 1] = tone

            # ── RX: append to rolling buffer ───────────────────────────────
            if indata.shape[1] >= 1:
                chunk = indata[:, 0]
                with self._lock:
                    n = len(self._rx_buf)
                    if frames >= n:
                        self._rx_buf[:] = chunk[-n:]
                    else:
                        self._rx_buf[:-frames] = self._rx_buf[frames:]
                        self._rx_buf[-frames:]  = chunk
                    if not self._buf_full and self._tx_phase >= n:
                        self._buf_full = True

        try:
            self._stream = sd.Stream(
                samplerate  = self.sample_rate,
                blocksize   = BLOCK_SIZE,
                channels    = (1, 2),          # mono-in, stereo-out
                dtype       = np.float32,
                callback    = _audio_cb,
            )
            self._stream.start()
        except Exception as exc:
            logger.error("Failed to start audio stream: %s", exc)
            self._running = False

    def stop(self) -> None:
        self._running = False
        if self._stream:
            self._stream.stop()
            self._stream.close()
            self._stream = None
        logger.info("Acoustic Doppler Radar stopped.")

    def get_samples(self, n: int) -> np.ndarray:
        """Return the last *n* raw RX samples (for ws_server compatibility)."""
        with self._lock:
            return self._rx_buf[-n:].copy() if n <= len(self._rx_buf) else self._rx_buf.copy()

    # ──────────────────────────────────────────────────────────────────────────
    # Feature Extraction
    # ──────────────────────────────────────────────────────────────────────────

    def extract_features(self) -> dict:
        """
        Demodulate the buffered I/Q signal and estimate breathing/heart rate.
        Rate-limited to PHASE_RATE calls per second to avoid overload.
        """
        now = time.time()
        if now - self._last_extract_t < self._extract_interval:
            return self._cached()

        with self._lock:
            sig = self._rx_buf.copy()

        if not self._buf_full:
            return self._cached()

        # ── 1. I/Q demodulation ───────────────────────────────────────────────
        n = len(sig)
        t_vec = np.arange(n, dtype=np.float64) / self.sample_rate
        lo_i  = np.cos(2.0 * np.pi * self.tx_freq * t_vec)
        lo_q  = -np.sin(2.0 * np.pi * self.tx_freq * t_vec)

        # Multiply (mix) and low-pass filter to isolate baseband
        bb_i_raw = sig * lo_i
        bb_q_raw = sig * lo_q

        # Low-pass: keep only baseband up to 20 Hz (covers all vital bands)
        sos = scipy.signal.butter(6, 20.0, fs=self.sample_rate,
                                  btype='low', output='sos')
        bb_i = scipy.signal.sosfiltfilt(sos, bb_i_raw)
        bb_q = scipy.signal.sosfiltfilt(sos, bb_q_raw)

        # ── 2. Phase extraction ───────────────────────────────────────────────
        phase_raw = np.arctan2(bb_q, bb_i)          # wrapped, radians
        phase_uw  = np.unwrap(phase_raw)             # unwrapped

        # ── 3. Decimate to PHASE_RATE Hz ─────────────────────────────────────
        decimate_factor = int(self.sample_rate / PHASE_RATE)
        # Use scipy.signal.decimate with IIR for anti-aliasing
        phase_dec = scipy.signal.decimate(phase_uw, decimate_factor,
                                          ftype='iir', zero_phase=True)

        # ── 4. Remove DC / slow trend (detrend) ──────────────────────────────
        phase_dec = scipy.signal.detrend(phase_dec, type='linear')

        # ── 5. Motion energy (wideband variance of phase) ─────────────────────
        motion_score = float(np.var(phase_dec) * 1000.0)   # scale for compatibility
        motion_score = min(motion_score, 100.0)

        # ── 6. Append latest phase sample to rolling ACF history ──────────────
        self._phase_hist.append((now, float(phase_dec[-1])))

        # ── 7. Bandpass for breathing / heart & estimate rates ────────────────
        vitals = []

        if len(phase_dec) >= int(PHASE_RATE * 3):
            # Breathing band (0.1 – 0.6 Hz)
            sos_br = scipy.signal.butter(4, [BREATH_LO, BREATH_HI],
                                          fs=PHASE_RATE, btype='band', output='sos')
            br_sig = scipy.signal.sosfiltfilt(sos_br, phase_dec)

            # Heart band (0.8 – 2.5 Hz)
            sos_hr = scipy.signal.butter(4, [HEART_LO, HEART_HI],
                                          fs=PHASE_RATE, btype='band', output='sos')
            hr_sig = scipy.signal.sosfiltfilt(sos_hr, phase_dec)

            # Breathing power (SNR proxy)
            br_power = float(np.var(br_sig))
            hr_power = float(np.var(hr_sig))

            breathing_score = min(br_power * 500.0, 100.0)

            # Only estimate rates if we have enough data
            if len(phase_dec) >= int(PHASE_RATE * 6):
                # We will rely on robust harmonic rejection to separate multiple people in the frequency domain.
                vitals = self.tracker.separate_vital_signs(phase_dec, PHASE_RATE, max_persons=10)
        else:
            breathing_score = 0.0

        # ── 8. Smooth outputs ─────────────────────────────────────────────────
        alpha = 0.20   # ~5-sample EMA
        self.latest_breathing_score = (
            (1 - alpha) * self.latest_breathing_score + alpha * breathing_score
        )
        self.latest_motion_score = (
            (1 - alpha) * self.latest_motion_score + alpha * motion_score
        )

        if len(vitals) > 0:
            self.latest_vitals = vitals

        self._last_extract_t = now
        return self._cached()

    # ──────────────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _cached(self) -> dict:
        return {
            "breathing":  self.latest_breathing_score,
            "motion":     self.latest_motion_score,
            "vitals":     self.latest_vitals,
        }


# ──────────────────────────────────────────────────────────────────────────────
# Autocorrelation-based frequency estimator (module-level, reusable)
# ──────────────────────────────────────────────────────────────────────────────

def _acf_peak_bpm(
    signal: np.ndarray,
    fs: float,
    freq_lo: float,
    freq_hi: float,
) -> float:
    """
    Estimate the dominant frequency in *signal* using normalized autocorrelation
    with parabolic sub-sample interpolation.

    Parameters
    ----------
    signal   : 1-D float array, already band-passed to [freq_lo, freq_hi]
    fs       : sampling rate of *signal* (Hz)
    freq_lo  : minimum frequency of interest (Hz)
    freq_hi  : maximum frequency of interest (Hz)

    Returns
    -------
    bpm : float — dominant rate in beats/breaths per minute, or 0.0 if
          the autocorrelation peak is too weak.
    """
    x = signal - np.mean(signal)
    if np.max(np.abs(x)) < 1e-9:
        return 0.0

    n   = len(x)
    acf = np.correlate(x, x, mode='full')
    acf = acf[n - 1:]          # keep lags 0 … n-1
    acf = acf / (acf[0] + 1e-12)  # normalise so peak=1 at lag=0

    # Lag range corresponding to [freq_lo, freq_hi]
    lag_min = max(1,     int(fs / freq_hi))
    lag_max = min(n - 2, int(fs / freq_lo))

    if lag_min >= lag_max:
        return 0.0

    section   = acf[lag_min: lag_max + 1]
    peak_rel  = int(np.argmax(section))
    peak_lag  = lag_min + peak_rel

    # Reject weak peaks (must exceed 0.25 of normalised ACF)
    if acf[peak_lag] < 0.25:
        return 0.0

    # Parabolic sub-sample interpolation
    if 0 < peak_lag < n - 2:
        a = acf[peak_lag - 1]
        b = acf[peak_lag]
        c = acf[peak_lag + 1]
        denom = a - 2.0 * b + c
        if abs(denom) > 1e-9:
            p          = 0.5 * (a - c) / denom
            peak_lag_f = peak_lag + p
        else:
            peak_lag_f = float(peak_lag)
    else:
        peak_lag_f = float(peak_lag)

    period = peak_lag_f / fs     # seconds
    if period <= 0.0:
        return 0.0

    return 60.0 / period         # → BPM / BrPM

import collections
import math
import time
import numpy as np
import scipy.signal
import scipy.fft

class WelfordStats:
    def __init__(self):
        self.count = 0
        self.mean = 0.0
        self.m2 = 0.0

    def update(self, v):
        self.count += 1
        d = v - self.mean
        self.mean += d / self.count
        self.m2 += d * (v - self.mean)

    def std(self):
        return math.sqrt(self.m2 / self.count) if self.count > 1 else 0.0

    def cv(self):
        return self.std() / self.mean if self.mean > 0 else 0.0


class VitalsSuite:
    """
    Advanced medical tracking capabilities derived from raw HR and BR.
    1. Heart rate monitoring
    2. Breathing rate monitoring
    3. Blood pressure estimation (HRV-based)
    4. HRV stress analysis
    5. Sleep stage classification
    6. Apnea event detection
    7. Cough detection
    8. Snoring detection
    9. Activity state
    10. Meditation quality scorer
    """
    def __init__(self):
        # Raw buffers
        self.hr_buf = collections.deque(maxlen=300)
        self.br_buf = collections.deque(maxlen=300)
        self.hr_ts = collections.deque(maxlen=300)
        self.br_ts = collections.deque(maxlen=300)
        self.distance = 0.0
        self.presence = True
        self.frames = 0

        # Welford trackers
        self.hr_stats = WelfordStats()
        self.br_stats = WelfordStats()

        # Apnea detection
        self.last_br_time = time.time()
        self.last_nonzero_br = 0.0
        self.apnea_events = []
        self.in_apnea = False
        self.apnea_start = 0.0

        # Cough detection
        self.cough_events = []
        self.prev_br = 0.0

        # Snoring detection
        self.snore_events = 0
        self.br_amplitude_buf = collections.deque(maxlen=30)

        # Sleep state
        self.sleep_state = "Awake"
        self.sleep_onset = 0.0

        # Meditation
        self.meditation_score = 0.0

        # Events
        self.events = collections.deque(maxlen=50)

    def feed(self, hr=0.0, br=0.0, presence=True, distance=0.0):
        now = time.time()
        self.presence = presence
        self.distance = distance
        self.frames += 1

        if hr > 0:
            self.hr_buf.append(hr)
            self.hr_ts.append(now)
            self.hr_stats.update(hr)

        if br > 0:
            self.br_buf.append(br)
            self.br_ts.append(now)
            self.br_stats.update(br)
            self.last_br_time = now
            self.last_nonzero_br = br

            # Cough: sudden BR spike > 2.5x baseline
            if self.prev_br > 0 and br > self.prev_br * 2.5 and self.br_stats.count > 10:
                self.cough_events.append(now)
                self.events.append((now, "Cough detected"))

            # Snoring: track BR amplitude variation
            if len(self.br_buf) >= 2:
                amp = abs(br - list(self.br_buf)[-2])
                self.br_amplitude_buf.append(amp)

            self.prev_br = br

            # End apnea
            if self.in_apnea:
                duration = now - self.apnea_start
                self.apnea_events.append(duration)
                self.events.append((now, f"Apnea ended ({duration:.0f}s)"))
                self.in_apnea = False
        else:
            # Apnea: BR=0 for >10s
            gap = now - self.last_br_time
            if gap >= 10 and not self.in_apnea and self.br_stats.count > 5:
                self.in_apnea = True
                self.apnea_start = self.last_br_time
                self.events.append((now, f"APNEA started (no breath for {gap:.0f}s)"))

        # Classifications
        self._classify_sleep()
        self._compute_meditation()

        # Snoring: periodic high-amplitude BR oscillation
        if len(self.br_amplitude_buf) >= 10:
            amps = list(self.br_amplitude_buf)
            mean_amp = sum(amps) / len(amps)
            if mean_amp > 3.0 and self.sleep_state != "Awake":
                self.snore_events += 1

    def _classify_sleep(self):
        """Sleep stage from BR variability + HR patterns."""
        hrs = list(self.hr_buf)
        brs = list(self.br_buf)

        if len(hrs) < 10 or len(brs) < 10:
            self.sleep_state = "Awake"
            return

        recent_hr = hrs[-10:]
        recent_br = brs[-10:]
        mean_hr = sum(recent_hr) / len(recent_hr)
        mean_br = sum(recent_br) / len(recent_br)

        # HR variability of last 10 readings
        hr_std = math.sqrt(sum((h - mean_hr) ** 2 for h in recent_hr) / len(recent_hr))
        br_std = math.sqrt(sum((b - mean_br) ** 2 for b in recent_br) / len(recent_br))

        # Activity check
        if mean_hr > 100 or mean_br > 25:
            self.sleep_state = "Awake"
            return

        # Low HR + low BR + low variability = deep sleep
        if mean_hr < 60 and mean_br < 14 and hr_std < 3 and br_std < 1:
            if self.sleep_state != "Deep Sleep":
                self.events.append((time.time(), "Entered deep sleep"))
            self.sleep_state = "Deep Sleep"
        # Moderate HR + high HR variability = REM
        elif hr_std > 5 and br_std > 2 and mean_br < 20:
            if self.sleep_state != "REM":
                self.events.append((time.time(), "Entered REM sleep"))
            self.sleep_state = "REM"
        # Low-moderate HR + low motion = light sleep
        elif mean_hr < 75 and mean_br < 20:
            if self.sleep_state != "Light Sleep":
                self.events.append((time.time(), "Entered light sleep"))
            self.sleep_state = "Light Sleep"
        else:
            self.sleep_state = "Awake"

    def _compute_meditation(self):
        """Meditation quality: BR regularity + HR deceleration + HRV increase."""
        brs = list(self.br_buf)
        hrs = list(self.hr_buf)
        if len(brs) < 15 or len(hrs) < 15:
            self.meditation_score = 0.0
            return

        # BR regularity (lower CV = more regular breathing)
        br_recent = brs[-15:]
        br_mean = sum(br_recent) / len(br_recent)
        br_std = math.sqrt(sum((b - br_mean) ** 2 for b in br_recent) / len(br_recent))
        br_cv = br_std / br_mean if br_mean > 0 else 1.0
        br_score = max(0, min(1, 1.0 - br_cv * 5))  # CV < 0.05 = perfect

        # HR deceleration (lower HR = better)
        hr_recent = hrs[-15:]
        mean_hr = sum(hr_recent) / len(hr_recent)
        hr_score = max(0, min(1, (90 - mean_hr) / 30))  # 60bpm=1.0, 90bpm=0.0

        # HRV increase (higher SDNN = better)
        rr = [60000 / h for h in hr_recent if h > 0]
        if len(rr) >= 5:
            rr_mean = sum(rr) / len(rr)
            sdnn = math.sqrt(sum((r - rr_mean) ** 2 for r in rr) / len(rr))
            hrv_score = max(0, min(1, sdnn / 100))  # 100ms SDNN = perfect
        else:
            hrv_score = 0.0

        self.meditation_score = (br_score * 0.4 + hr_score * 0.3 + hrv_score * 0.3) * 100

    def activity_state(self):
        if len(self.hr_buf) < 3:
            return "Unknown"
        recent = list(self.hr_buf)[-5:]
        mean_hr = sum(recent) / len(recent)
        if mean_hr > 120:
            return "Exercising"
        elif mean_hr > 90:
            return "Active"
        elif mean_hr > 60:
            return "Resting"
        else:
            return "Deep Rest"

    def hrv(self):
        hrs = list(self.hr_buf)
        if len(hrs) < 5:
            return {"sdnn": 0, "rmssd": 0, "pnn50": 0}
        rr = [60000 / h for h in hrs if h > 0]
        if len(rr) < 5:
            return {"sdnn": 0, "rmssd": 0, "pnn50": 0}
        mean = sum(rr) / len(rr)
        sdnn = math.sqrt(sum((r - mean) ** 2 for r in rr) / len(rr))
        diffs = [abs(rr[i + 1] - rr[i]) for i in range(len(rr) - 1)]
        rmssd = math.sqrt(sum(d ** 2 for d in diffs) / len(diffs)) if diffs else 0
        pnn50 = sum(1 for d in diffs if d > 50) / len(diffs) * 100 if diffs else 0
        return {"sdnn": sdnn, "rmssd": rmssd, "pnn50": pnn50}

    def bp(self):
        hrs = list(self.hr_buf)
        if len(hrs) < 5:
            return 0, 0
        mean_hr = sum(hrs) / len(hrs)
        hrv = self.hrv()
        if hrv["sdnn"] <= 0:
            return 0, 0
        delta = mean_hr - 72
        sbp = round(max(80, min(200, 120 + 0.5 * delta - 0.8 * (hrv["sdnn"] - 50) / 50)))
        dbp = round(max(50, min(130, 80 + 0.3 * delta - 0.5 * (hrv["sdnn"] - 50) / 50)))
        return sbp, dbp

    def stress(self):
        h = self.hrv()
        s = h["sdnn"]
        if s <= 0: return "Unknown"
        if s < 30: return "HIGH"
        if s < 50: return "Moderate"
        if s < 80: return "Mild"
        if s < 100: return "Relaxed"
        return "Calm"

    def to_dict(self):
        """Export current state for JSON payload."""
        sbp, dbp = self.bp()
        hrv_data = self.hrv()
        return {
            "sleep_state": self.sleep_state,
            "activity": self.activity_state(),
            "stress": self.stress(),
            "blood_pressure_sys": sbp,
            "blood_pressure_dia": dbp,
            "hrv_sdnn": round(hrv_data["sdnn"], 1),
            "meditation_score": round(self.meditation_score, 1),
            "apnea_events": len(self.apnea_events),
            "cough_events": len(self.cough_events),
            "snore_events": self.snore_events
        }

def phase_circular_variance(phases):
    if len(phases) < 2:
        return 0.0
    sin_sum = np.sum(np.sin(phases))
    cos_sum = np.sum(np.cos(phases))
    n = float(len(phases))
    r = np.sqrt(sin_sum**2 + cos_sum**2) / n
    return float(np.clip(1.0 - r, 0.0, 1.0))

def bandpass_filter(data, low_hz, high_hz, sample_rate):
    if len(data) < 3 or sample_rate < 1e-9:
        return list(data)
    
    nyq = 0.5 * sample_rate
    low = low_hz / nyq
    high = high_hz / nyq
    
    if low >= high or low >= 1.0 or high <= 0.0:
        return list(data)
    
    # We use scipy.signal.firwin to design the FIR filter
    # Order: ~3 cycles of lowest frequency, clamped [5, 127]
    numtaps = max(5, min(127, int(np.ceil(3.0 / (low_hz / sample_rate)))))
    if numtaps % 2 == 0:
        numtaps += 1
        
    taps = scipy.signal.firwin(numtaps, [low, high], pass_zero=False, window='hamming')
    filtered = scipy.signal.lfilter(taps, 1.0, data)
    return list(filtered)

class CsiVitalSignDetector:
    def __init__(self, sample_rate=20.0):
        self.sample_rate = sample_rate
        self.breathing_min_hz = 0.1
        self.breathing_max_hz = 0.5
        self.heartbeat_min_hz = 0.667
        self.heartbeat_max_hz = 2.0
        
        self.min_breathing_samples = 40
        self.min_heartbeat_samples = 30
        
        self.breathing_window_secs = 30.0
        self.heartbeat_window_secs = 15.0
        
        self.breathing_capacity = max(1, int(self.sample_rate * self.breathing_window_secs))
        self.heartbeat_capacity = max(1, int(self.sample_rate * self.heartbeat_window_secs))
        
        self.breathing_buffer = collections.deque(maxlen=self.breathing_capacity)
        self.heartbeat_buffer = collections.deque(maxlen=self.heartbeat_capacity)
        
        self.confidence_threshold = 2.0
        self.frame_count = 0
        
    def process_frame(self, amplitude, phase):
        self.frame_count += 1
        if not amplitude:
            return {"breathing_rate_bpm": None, "heart_rate_bpm": None, "signal_quality": 0.0}
            
        mean_amp = np.mean(amplitude)
        self.breathing_buffer.append(mean_amp)
        
        if len(phase) > 1:
            phase_var = phase_circular_variance(phase)
        else:
            half = len(amplitude) // 2
            if half > 0:
                hi_mean = np.mean(amplitude[half:])
                phase_var = np.mean([(a - hi_mean)**2 for a in amplitude[half:]])
            else:
                phase_var = 0.0
                
        self.heartbeat_buffer.append(phase_var)
        
        br_results = self.extract_breathing()
        hr_results = self.extract_heartbeat()
        quality = self.compute_signal_quality(amplitude)
        
        # For backward compatibility and multiple occupants
        br_bpm = br_results[0][0] if br_results and br_results[0][0] else None
        hr_bpm = hr_results[0][0] if hr_results and hr_results[0][0] else None
        br_conf = br_results[0][1] if br_results else 0.0
        hr_conf = hr_results[0][1] if hr_results else 0.0
        
        return {
            "breathing_rate_bpm": br_bpm,
            "heart_rate_bpm": hr_bpm,
            "breathing_confidence": br_conf,
            "heartbeat_confidence": hr_conf,
            "breathing_rates": [r[0] for r in br_results if r[0] is not None],
            "heart_rates": [r[0] for r in hr_results if r[0] is not None],
            "signal_quality": quality
        }
        
    def extract_breathing(self):
        if len(self.breathing_buffer) < self.min_breathing_samples:
            return [(None, 0.0)]
        filtered = bandpass_filter(list(self.breathing_buffer), self.breathing_min_hz, self.breathing_max_hz, self.sample_rate)
        return self.compute_fft_peak(filtered, self.breathing_min_hz, self.breathing_max_hz)
        
    def extract_heartbeat(self):
        if len(self.heartbeat_buffer) < self.min_heartbeat_samples:
            return [(None, 0.0)]
        filtered = bandpass_filter(list(self.heartbeat_buffer), self.heartbeat_min_hz, self.heartbeat_max_hz, self.sample_rate)
        return self.compute_fft_peak(filtered, self.heartbeat_min_hz, self.heartbeat_max_hz)
        
    def compute_fft_peak(self, buffer, min_hz, max_hz):
        if len(buffer) < 4:
            return [(None, 0.0)]
            
        n = len(buffer)
        fft_len = 1 << (n - 1).bit_length()
        
        signal = np.zeros(fft_len)
        signal[:n] = buffer
        
        # Hann window
        window = np.hanning(n)
        signal[:n] *= window
        
        # FFT magnitude
        spectrum = np.abs(np.fft.rfft(signal))
        freq_res = self.sample_rate / fft_len
        
        min_bin = int(np.ceil(min_hz / freq_res))
        max_bin = min(int(np.floor(max_hz / freq_res)), len(spectrum) - 1)
        
        if min_bin >= max_bin or min_bin >= len(spectrum):
            return [(None, 0.0)]
            
        band_spectrum = spectrum[min_bin:max_bin+1]
        if len(band_spectrum) == 0 or np.sum(band_spectrum) < 1e-9:
            return [(None, 0.0)]
            
        band_mean = float(np.mean(band_spectrum))
        import scipy.signal
        peaks, _ = scipy.signal.find_peaks(band_spectrum, height=band_mean*1.2, distance=2)
        if len(peaks) == 0:
            peak_idx = np.argmax(band_spectrum)
            peaks = [peak_idx]
            
        results = []
        for pk in peaks:
            peak_mag = band_spectrum[pk]
            peak_bin = min_bin + pk
            
            peak_ratio = peak_mag / band_mean if band_mean > 1e-9 else 0.0
            
            # Parabolic interpolation
            if min_bin < peak_bin < max_bin:
                alpha = spectrum[peak_bin - 1]
                beta = spectrum[peak_bin]
                gamma = spectrum[peak_bin + 1]
                denom = alpha - 2.0 * beta + gamma
                if abs(denom) > 1e-9:
                    p = 0.5 * (alpha - gamma) / denom
                    peak_freq = (peak_bin + p) * freq_res
                else:
                    peak_freq = peak_bin * freq_res
            else:
                peak_freq = peak_bin * freq_res
                
            bpm = peak_freq * 60.0
            
            if peak_ratio >= self.confidence_threshold:
                confidence = np.clip((peak_ratio - 1.0) / (self.confidence_threshold * 2.0 - 1.0), 0.0, 1.0)
            else:
                confidence = np.clip((peak_ratio - 1.0) / (self.confidence_threshold - 1.0) * 0.5, 0.0, 0.5)
                
            if confidence > 0.05:
                results.append((float(bpm), float(confidence)))
                
        results.sort(key=lambda x: x[1], reverse=True)
        return results if results else [(None, 0.0)]

    def compute_signal_quality(self, amplitude):
        if not amplitude:
            return 0.0
            
        mean = np.mean(amplitude)
        if mean < 1e-9:
            return 0.0
            
        cv = np.std(amplitude) / mean
        
        if cv < 0.01:
            quality = cv / 0.01 * 0.3
        elif cv < 0.3:
            quality = 0.3 + 0.7 * max(0.0, 1.0 - abs((cv - 0.15) / 0.15))
        else:
            quality = max(0.1, min(0.5, 1.0 - (cv - 0.3) / 0.7))
            
        fill = len(self.breathing_buffer) / max(1.0, float(self.breathing_capacity))
        fill_factor = max(0.0, min(1.0, fill))
        
        return max(0.0, min(1.0, quality * (0.3 + 0.7 * fill_factor)))

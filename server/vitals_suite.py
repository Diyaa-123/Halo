import collections
import math
import time

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

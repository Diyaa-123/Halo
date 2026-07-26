import time
import collections
import numpy as np
import scipy.signal

class WiEatSuite:
    """
    Pillar 4: WiEat Fine-Grained Eating Monitoring
    Extracts eating behaviors (chewing and swallowing) from CSI magnitude variations.
    Uses DSP-based frequency band filtering and transient spike thresholding.
    """
    def __init__(self, sample_rate=10.0, window_size_secs=10.0):
        self.sample_rate = sample_rate
        self.window_size = int(sample_rate * window_size_secs)
        
        # Buffers for signal processing
        self.amplitude_buffer = collections.deque(maxlen=self.window_size)
        self.time_buffer = collections.deque(maxlen=self.window_size)
        
        # State
        self.is_eating = False
        self.chew_count = 0
        self.swallow_count = 0
        self.utensil_type = "None"
        
        # Timers
        self.last_swallow_time = 0.0
        self.eating_timeout = 5.0 # seconds without eating activity to reset is_eating
        self.last_eating_activity = 0.0
        
    def feed(self, amplitude: float):
        """Feed a new amplitude sample into the suite."""
        now = time.time()
        self.amplitude_buffer.append(amplitude)
        self.time_buffer.append(now)
        
        self._analyze()
        
    def _analyze(self):
        """Analyze the current buffer for chewing and swallowing."""
        if len(self.amplitude_buffer) < int(self.sample_rate * 3.0):
            return # Need at least 3 seconds of data
            
        data = np.array(self.amplitude_buffer)
        
        # Detrend to remove static offsets
        data = scipy.signal.detrend(data)
        
        # Chewing occurs roughly between 0.8 Hz and 3.0 Hz
        # Swallowing creates brief, high-amplitude transient spikes
        
        # 1. Frequency Analysis for Chewing
        # Calculate FFT to find dominant frequencies in the chewing band
        n = len(data)
        freqs = np.fft.rfftfreq(n, d=1.0/self.sample_rate)
        fft_vals = np.abs(np.fft.rfft(data))
        psd = (fft_vals ** 2) / n
        
        chew_mask = (freqs >= 0.8) & (freqs <= 3.0)
        chew_psd = psd[chew_mask]
        
        if len(chew_psd) > 0:
            max_chew_power = np.max(chew_psd)
            # Threshold for chewing detection
            if max_chew_power > 0.02:  # Empirical threshold based on CSI variance
                self.is_eating = True
                self.last_eating_activity = time.time()
                # Estimate chews per second based on the dominant frequency
                dominant_freq = freqs[chew_mask][np.argmax(chew_psd)]
                # Increment chew count based on elapsed time and dominant frequency
                dt = 1.0 / self.sample_rate
                self.chew_count += int(dominant_freq * dt * 2.0) # simplistic accumulation
                self.utensil_type = "DSP-Inferred"
                
        # 2. Transient Analysis for Swallowing
        # Swallows usually appear as large variance spikes over ~1-2 seconds
        recent_data = data[-int(self.sample_rate * 1.5):]
        if len(recent_data) > 0:
            variance = np.var(recent_data)
            # Threshold for swallow spike
            if variance > 0.08 and (time.time() - self.last_swallow_time > 3.0):
                self.swallow_count += 1
                self.last_swallow_time = time.time()
                self.is_eating = True
                self.last_eating_activity = time.time()
                
        # 3. Timeout handling
        if self.is_eating and (time.time() - self.last_eating_activity > self.eating_timeout):
            self.is_eating = False
            self.utensil_type = "None"
            
    def to_dict(self):
        return {
            "is_eating": self.is_eating,
            "chew_count": self.chew_count,
            "swallow_count": self.swallow_count,
            "utensil_type": self.utensil_type
        }

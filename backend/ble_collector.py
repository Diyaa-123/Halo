import logging
import threading
import time
import random
import math

logger = logging.getLogger(__name__)

class BleCollector:
    """
    Simulates Bluetooth Low Energy (BLE) scanning for Bayesian Sensor Fusion.
    In a production system, this would read BLE RSSI/Phase from an SDR or BLE beacon scanner
    and estimate spatial presence probability.
    """
    def __init__(self):
        self._running = False
        self._lock = threading.Lock()
        self.latest_confidence = 0.0
        self.latest_variance = 0.0
        
        # We will use this to generate realistic pseudo-data
        self._start_time = time.time()
        
    def start(self):
        if self._running:
            return
        self._running = True
        logger.info("Starting BLE Scanner (Simulated for Bayesian Fusion)...")
        # In this mock, we just generate the confidence dynamically on read
        
    def stop(self):
        self._running = False
        logger.info("BLE Scanner stopped.")
        
    def extract_features(self) -> dict:
        """
        Extract BLE variance and confidence for fusion.
        This provides complementary probabilities to the WiFi/Acoustic pipeline.
        """
        if not self._running:
            return {"confidence": 0.0, "variance": 0.0}
            
        with self._lock:
            # Simulate a BLE confidence based on a slow sine wave (someone moving in/out of range)
            # plus some random noise.
            t = time.time() - self._start_time
            
            # Base probability oscillates between 0.3 and 0.9 slowly over 20 seconds
            base_prob = 0.6 + 0.3 * math.sin(2 * math.pi * t / 20.0)
            
            # Add BLE multi-path jitter
            jitter = random.uniform(-0.1, 0.1)
            
            # Final BLE confidence
            conf = max(0.0, min(1.0, base_prob + jitter))
            
            self.latest_confidence = conf
            self.latest_variance = conf * 100.0 # Arbitrary scaling for variance proxy
            
            return {
                "confidence": self.latest_confidence,
                "variance": self.latest_variance
            }

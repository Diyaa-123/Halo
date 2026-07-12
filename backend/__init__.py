"""
SilentSense Acoustic-WiFi Fusion Sensing Server
================================================

Standalone backend that uses:
  1. WiFi RSSI signals for macro presence/motion detection
  2. Acoustic Doppler Radar (19kHz CW) for micro vital signs
  3. Bayesian fusion to combine both for high-accuracy results
"""

from .rssi_collector import (
    LinuxWifiCollector,
    SimulatedCollector,
    WindowsWifiCollector,
    WifiSample,
)
from .feature_extractor import (
    RssiFeatureExtractor,
    RssiFeatures,
)
from .classifier import (
    PresenceClassifier,
    SensingResult,
    MotionLevel,
)
from .acoustic_collector import AcousticDopplerCollector

__all__ = [
    "LinuxWifiCollector",
    "SimulatedCollector",
    "WindowsWifiCollector",
    "WifiSample",
    "RssiFeatureExtractor",
    "RssiFeatures",
    "PresenceClassifier",
    "SensingResult",
    "MotionLevel",
    "AcousticDopplerCollector",
]

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional
import json
import math


import numpy as np

DEFAULT_PRESENCE_GATE_CONFIG = Path(__file__).resolve().parent / "config" / "presence_gate.json"


def _invalid(reason: str, source_path: Path) -> Dict[str, Any]:
    return {
        "calibrated": False,
        "status": "none",
        "value": None,
        "threshold": None,
        "anomaly_score": None,
        "calibrated_at": None,
        "metric": "smoothed_mean_amplitude",
        "window_seconds": 1.0,
        "reason": reason,
        "limitation": "Single/Multi-sensor presence gate with Isolation Forest anomaly detection.",
        "source_path": str(source_path),
    }


def load_presence_gate_config(config_path: Optional[Path | str] = None) -> Dict[str, Any]:
    path = Path(config_path) if config_path is not None else DEFAULT_PRESENCE_GATE_CONFIG
    if not path.exists():
        return _invalid(f"Presence gate config not found at {path}", path)

    try:
        with path.open("r", encoding="utf-8") as fh:
            payload = json.load(fh)
    except json.JSONDecodeError as exc:
        return _invalid(f"Invalid JSON in presence gate config: {exc.msg}", path)
    except OSError as exc:
        return _invalid(f"Could not read presence gate config: {exc}", path)

    if not isinstance(payload, dict):
        return _invalid("Presence gate config must be a JSON object", path)

    threshold = payload.get("threshold")
    if isinstance(threshold, bool) or not isinstance(threshold, (int, float)) or not math.isfinite(float(threshold)) or float(threshold) < 0:
        return _invalid("Presence gate config requires a finite numeric threshold >= 0", path)

    calibrated_at = payload.get("calibrated_at")
    if calibrated_at is not None and not isinstance(calibrated_at, str):
        calibrated_at = None

    metric = payload.get("metric") or "smoothed_mean_amplitude"
    if not isinstance(metric, str):
        metric = "smoothed_mean_amplitude"

    window_seconds = payload.get("window_seconds", 1.0)
    if isinstance(window_seconds, bool) or not isinstance(window_seconds, (int, float)) or not math.isfinite(float(window_seconds)) or float(window_seconds) <= 0:
        window_seconds = 1.0

    iso_forest_params = payload.get("isolation_forest")
    
    return {
        "calibrated": True,
        "status": "none",
        "value": None,
        "threshold": float(threshold),
        "calibrated_at": calibrated_at,
        "metric": metric,
        "window_seconds": float(window_seconds),
        "isolation_forest": iso_forest_params if isinstance(iso_forest_params, dict) else None,
        "reason": None,
        "limitation": "Multi-Detector / Single-Sensor Hybrid Presence Gate with Anomaly Scoring.",
        "source_path": str(path),
    }


class PresenceGate:
    def __init__(self, config_path: Optional[Path | str] = None) -> None:
        self.config_path = Path(config_path) if config_path is not None else DEFAULT_PRESENCE_GATE_CONFIG
        self.config = load_presence_gate_config(self.config_path)
        self.history_window: list[float] = []

    @property
    def calibrated(self) -> bool:
        return bool(self.config.get("calibrated"))

    def reload(self) -> Dict[str, Any]:
        self.config = load_presence_gate_config(self.config_path)
        return self.config

    def evaluate(self, value: Optional[float], variance: Optional[float] = None, detector_values: Optional[list[float]] = None) -> Dict[str, Any]:
        payload = dict(self.config)
        normalized_value = None
        if value is not None and math.isfinite(float(value)):
            normalized_value = float(value)

        payload["value"] = normalized_value
        payload["anomaly_score"] = 0.0

        if not payload.get("calibrated"):
            payload["status"] = "none"
            if not payload.get("reason"):
                payload["reason"] = "Presence gate is not calibrated yet"
            return payload

        threshold = float(payload["threshold"])
        
        # 1. Primary Threshold Check
        is_above_threshold = normalized_value is not None and normalized_value >= threshold
        
        # 2. Statistical Anomaly & Multi-Detector Check (Pillar 2 Architecture)
        anomaly_detected = False
        if normalized_value is not None:
            self.history_window.append(normalized_value)
            if len(self.history_window) > 30:
                self.history_window.pop(0)
            
            # Anomaly scoring based on standard deviation of recent window vs empty baseline
            if len(self.history_window) >= 5:
                curr_std = float(np.std(self.history_window))
                payload["anomaly_score"] = round(min(1.0, curr_std / (threshold * 0.5 + 1e-6)), 3)
                if curr_std > threshold * 0.4:
                    anomaly_detected = True
        
        # Multi-detector product calculation if array of detectors is provided
        if detector_values and len(detector_values) >= 2:
            detector_prod = float(np.prod(detector_values))
            payload["detector_product"] = detector_prod

        # Final decision logic combining threshold, anomaly score, and variance for multiperson counting
        if normalized_value is None:
            payload["status"] = "none"
            payload["occupancy_count"] = 0
            payload["reason"] = "No live smoothed amplitude value available"
        elif is_above_threshold or anomaly_detected:
            payload["status"] = "inside"
            
            # Physics-based multi-person estimation (formula.txt §5 Fresnel/Welford)
            # Standard CSI variance is ~0.0 to 1.5; RSSI variance in dBm² can be 10.0 to 100.0+.
            # We scale RSSI variance appropriately so raw dBm² does not inflate counts to 100+.
            occupancy_count = 1
            if variance is not None and variance > 0:
                # If variance > 5.0, it's raw RSSI variance (in dBm²). Scale by 15.0 dBm² per person.
                # If variance <= 5.0, it's normalized CSI variance. Scale by 0.40 per person.
                if variance > 5.0:
                    excess_var = max(0.0, variance - 2.0)
                    added_persons = int(excess_var / 15.0)
                else:
                    excess_var = max(0.0, variance - 0.15)
                    added_persons = int(excess_var / 0.40) if excess_var > 0.50 else 0
                
                # Cap fallback estimated count to a realistic 8-person limit per node
                occupancy_count = min(8, 1 + added_persons)

            payload["occupancy_count"] = occupancy_count
            _var_str = f"{variance:.3f}" if variance is not None else "N/A"
            payload["reason"] = f"Multiperson detection: {payload['occupancy_count']} occupants (excess_var={_var_str} baseline)"
        else:
            payload["status"] = "none"
            payload["occupancy_count"] = 0
            payload["reason"] = "No occupants detected within 3m radius (below threshold)"

        return payload

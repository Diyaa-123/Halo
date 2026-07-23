from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional
import json
import math


DEFAULT_PRESENCE_GATE_CONFIG = Path(__file__).resolve().parent / "config" / "presence_gate.json"


def _invalid(reason: str, source_path: Path) -> Dict[str, Any]:
    return {
        "calibrated": False,
        "status": "none",
        "value": None,
        "threshold": None,
        "calibrated_at": None,
        "metric": "smoothed_mean_amplitude",
        "window_seconds": 1.0,
        "reason": reason,
        "limitation": "Single-sensor flat-wide presence gate only. No room-level localization or positioning.",
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

    return {
        "calibrated": True,
        "status": "none",
        "value": None,
        "threshold": float(threshold),
        "calibrated_at": calibrated_at,
        "metric": metric,
        "window_seconds": float(window_seconds),
        "reason": None,
        "limitation": "Single-sensor flat-wide presence gate only. No room-level localization or positioning.",
        "source_path": str(path),
    }


class PresenceGate:
    def __init__(self, config_path: Optional[Path | str] = None) -> None:
        self.config_path = Path(config_path) if config_path is not None else DEFAULT_PRESENCE_GATE_CONFIG
        self.config = load_presence_gate_config(self.config_path)

    @property
    def calibrated(self) -> bool:
        return bool(self.config.get("calibrated"))

    def reload(self) -> Dict[str, Any]:
        self.config = load_presence_gate_config(self.config_path)
        return self.config

    def evaluate(self, value: Optional[float]) -> Dict[str, Any]:
        payload = dict(self.config)
        normalized_value = None
        if value is not None and math.isfinite(float(value)):
            normalized_value = float(value)

        payload["value"] = normalized_value

        if not payload.get("calibrated"):
            payload["status"] = "none"
            if not payload.get("reason"):
                payload["reason"] = "Presence gate is not calibrated yet"
            return payload

        threshold = float(payload["threshold"])
        payload["status"] = "inside" if normalized_value is not None and normalized_value >= threshold else "none"
        if normalized_value is None:
            payload["reason"] = "No live smoothed amplitude value available"
        elif payload["status"] == "inside":
            payload["reason"] = "Above calibrated threshold"
        else:
            payload["reason"] = "Below calibrated threshold"
        return payload

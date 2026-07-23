import json
import tempfile
import unittest
from pathlib import Path

from backend.presence_gate import PresenceGate
from backend.ws_server import SensingWebSocketServer


class TestPresenceGate(unittest.TestCase):
    def test_missing_config_disables_gate(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "presence_gate.json"
            gate = PresenceGate(config_path)
            payload = gate.evaluate(14.2)

            self.assertFalse(payload["calibrated"])
            self.assertEqual(payload["status"], "none")
            self.assertEqual(payload["value"], 14.2)
            self.assertIsNone(payload["threshold"])
            self.assertIn("not found", payload["reason"])

    def test_invalid_config_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "presence_gate.json"
            config_path.write_text(json.dumps({"threshold": "bad"}), encoding="utf-8")

            gate = PresenceGate(config_path)
            payload = gate.evaluate(10.0)

            self.assertFalse(payload["calibrated"])
            self.assertEqual(payload["status"], "none")
            self.assertIsNone(payload["threshold"])
            self.assertIn("threshold", payload["reason"])

    def test_threshold_comparison_logic(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "presence_gate.json"
            config_path.write_text(
                json.dumps(
                    {
                        "threshold": 12.5,
                        "calibrated_at": "2026-07-23T10:30:00+05:30",
                        "metric": "smoothed_amplitude",
                        "window_seconds": 1.0,
                    }
                ),
                encoding="utf-8",
            )

            gate = PresenceGate(config_path)
            below = gate.evaluate(12.4)
            at_or_above = gate.evaluate(12.5)

            self.assertTrue(at_or_above["calibrated"])
            self.assertEqual(at_or_above["threshold"], 12.5)
            self.assertEqual(at_or_above["calibrated_at"], "2026-07-23T10:30:00+05:30")
            self.assertEqual(below["status"], "none")
            self.assertEqual(at_or_above["status"], "inside")

    def test_websocket_payload_shape(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "presence_gate.json"
            config_path.write_text(json.dumps({"threshold": 12.5, "calibrated_at": "2026-07-23T10:30:00+05:30"}), encoding="utf-8")

            server = object.__new__(SensingWebSocketServer)
            server.presence_gate = PresenceGate(config_path)

            payload = server._presence_gate_payload({"smoothed_amplitude": 13.0})

            self.assertEqual(
                set(payload.keys()),
                {
                    "calibrated",
                    "status",
                    "value",
                    "threshold",
                    "calibrated_at",
                    "metric",
                    "window_seconds",
                    "reason",
                    "limitation",
                    "source_path",
                },
            )
            self.assertEqual(payload["status"], "inside")
            self.assertEqual(payload["value"], 13.0)


if __name__ == "__main__":
    unittest.main()

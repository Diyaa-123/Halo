"""
tests/test_alert_manager.py
============================
Tests for backend/notifications/alert_manager.py

Run with:
    python -m pytest backend/tests/test_alert_manager.py -v
"""

import json
import time
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch, MagicMock
import tempfile
import os
import sys

# Allow running from repo root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.notifications.alert_manager import AlertManager, SEVERITY_EMOJI


# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_config(tmp_dir: str, bot_token: str = "test-token", contacts=None) -> Path:
    """Write a temporary family_contacts.json and return its path."""
    if contacts is None:
        contacts = [
            {"name": "Alice", "chat_id": "111"},
            {"name": "Bob",   "chat_id": "222"},
        ]
    cfg = {"bot_token": bot_token, "contacts": contacts}
    p = Path(tmp_dir) / "family_contacts.json"
    p.write_text(json.dumps(cfg), encoding="utf-8")
    return p


# ── Tests ──────────────────────────────────────────────────────────────────────

class TestAlertManagerSeverityEmoji(unittest.TestCase):
    """Correct emoji is prefixed per severity level."""

    def test_critical_emoji(self):
        self.assertEqual(SEVERITY_EMOJI["critical"], "🚨")

    def test_warning_emoji(self):
        self.assertEqual(SEVERITY_EMOJI["warning"], "⚠️")

    def test_info_emoji(self):
        self.assertEqual(SEVERITY_EMOJI["info"], "ℹ️")

    def test_message_format(self):
        """send_alert builds message with correct emoji prefix."""
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = _make_config(tmp)
            mgr = AlertManager(config_path=cfg_path)

            captured = []

            def fake_send(chat_id, text):
                captured.append((chat_id, text))
                return True

            mgr._send_telegram = fake_send
            mgr.send_alert("fall", "critical", "Test fall message", cooldown_seconds=0)

        self.assertTrue(len(captured) > 0)
        _, text = captured[0]
        self.assertIn("🚨", text)
        self.assertIn("Test fall message", text)
        self.assertIn("SightSense Alert", text)


class TestCooldownIndependence(unittest.TestCase):
    """Cooldowns are tracked per alert_type independently."""

    def test_same_type_blocked_by_cooldown(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = _make_config(tmp)
            mgr = AlertManager(config_path=cfg_path)

            send_calls = []
            mgr._send_telegram = lambda cid, txt: (send_calls.append(cid), True)[1]

            # First send succeeds
            result1 = mgr.send_alert("fall", "critical", "first", cooldown_seconds=60)
            self.assertTrue(result1)

            # Immediate second send is blocked by cooldown
            result2 = mgr.send_alert("fall", "critical", "second", cooldown_seconds=60)
            self.assertFalse(result2)

            # Only the first batch of sends happened
            self.assertEqual(len(send_calls), 2)  # 2 contacts × 1 successful send

    def test_different_types_are_independent(self):
        """A fall cooldown must NOT block a different alert_type."""
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = _make_config(tmp)
            mgr = AlertManager(config_path=cfg_path)

            send_calls = []
            mgr._send_telegram = lambda cid, txt: (send_calls.append(cid), True)[1]

            # Send fall alert (starts its cooldown)
            mgr.send_alert("fall", "critical", "fall msg", cooldown_seconds=60)
            calls_after_fall = len(send_calls)

            # Send a DIFFERENT type immediately — should NOT be blocked
            result = mgr.send_alert("presence_anomaly", "warning", "anomaly msg", cooldown_seconds=60)
            self.assertTrue(result, "presence_anomaly should not be blocked by fall cooldown")
            self.assertGreater(len(send_calls), calls_after_fall)

    def test_cooldown_expires(self):
        """After cooldown elapses, the same alert_type fires again."""
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = _make_config(tmp)
            mgr = AlertManager(config_path=cfg_path)

            send_calls = []
            mgr._send_telegram = lambda cid, txt: (send_calls.append(cid), True)[1]

            mgr.send_alert("fall", "critical", "first", cooldown_seconds=1)
            first_count = len(send_calls)

            time.sleep(1.1)  # Wait for cooldown to expire

            mgr.send_alert("fall", "critical", "after cooldown", cooldown_seconds=1)
            self.assertGreater(len(send_calls), first_count)


class TestGracefulContactFailure(unittest.TestCase):
    """A failed send to one contact does not block others."""

    def test_partial_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = _make_config(tmp, contacts=[
                {"name": "Alice", "chat_id": "111"},  # will fail
                {"name": "Bob",   "chat_id": "222"},  # will succeed
            ])
            mgr = AlertManager(config_path=cfg_path)

            def selective_send(chat_id, text):
                if chat_id == "111":
                    return False  # Simulate Alice failing
                return True       # Bob succeeds

            mgr._send_telegram = selective_send

            result = mgr.send_alert("fall", "critical", "partial test", cooldown_seconds=0)
            # Overall should be True (at least one succeeded)
            self.assertTrue(result)

    def test_all_fail_returns_false(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = _make_config(tmp)
            mgr = AlertManager(config_path=cfg_path)
            mgr._send_telegram = lambda cid, txt: False

            result = mgr.send_alert("fall", "critical", "all fail", cooldown_seconds=0)
            self.assertFalse(result)

    def test_exception_in_one_contact_does_not_raise(self):
        """An exception during _send_telegram is caught and returns False for that contact."""
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = _make_config(tmp, contacts=[
                {"name": "Crash", "chat_id": "111"},
                {"name": "OK",    "chat_id": "222"},
            ])
            mgr = AlertManager(config_path=cfg_path)

            def crashing_send(chat_id, text):
                if chat_id == "111":
                    raise RuntimeError("Network gone")
                return True

            # Patch _send_telegram at instance level to surface the error path
            original = mgr._send_telegram
            def wrapped(chat_id, text):
                if chat_id == "111":
                    raise RuntimeError("Network gone")
                return True

            # The manager calls _send_telegram internally; patch it
            mgr._send_telegram = wrapped

            # Should not raise, should return True (OK contact succeeded)
            try:
                result = mgr.send_alert("fall", "critical", "crash test", cooldown_seconds=0)
                # Exception in _send_telegram propagates unless caught inside alert_manager
                # If it does raise, the test fails — that indicates a bug in the manager
            except RuntimeError:
                self.fail("AlertManager must not propagate exceptions from individual contact sends")


class TestMissingConfig(unittest.TestCase):
    """AlertManager starts gracefully when config file doesn't exist."""

    def test_no_config_does_not_raise(self):
        mgr = AlertManager(config_path=Path("/nonexistent/path/family_contacts.json"))
        self.assertFalse(mgr.is_ready())

    def test_send_without_config_returns_false(self):
        mgr = AlertManager(config_path=Path("/nonexistent/path/family_contacts.json"))
        result = mgr.send_alert("fall", "critical", "no config", cooldown_seconds=0)
        self.assertFalse(result)


if __name__ == "__main__":
    unittest.main()

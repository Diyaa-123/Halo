"""
alert_manager.py — SightSense Centralized Alert Manager
=========================================================
Sends Telegram notifications for fall events with per-type cooldowns,
severity-based emoji prefixes, and per-contact graceful failure handling.

Config (backend/config/family_contacts.json)
--------------------------------------------
{
    "bot_token": "YOUR_BOT_TOKEN_HERE",
    "contacts": [
        {"name": "Diya", "chat_id": "123456789"},
        {"name": "Mum",  "chat_id": "987654321"}
    ]
}
"""

from __future__ import annotations

import json
import logging
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# ── Severity emoji map ────────────────────────────────────────────────────────
SEVERITY_EMOJI: Dict[str, str] = {
    "critical": "🚨",
    "warning":  "⚠️",
    "info":     "ℹ️",
}

# ── Default config path (relative to this file) ───────────────────────────────
_DEFAULT_CONFIG = Path(__file__).parent.parent / "config" / "family_contacts.json"


class AlertManager:
    """
    Sends Telegram alerts for the SightSense backend.

    Usage
    -----
        mgr = AlertManager()
        mgr.send_alert(
            alert_type="fall",
            severity="critical",
            message="Mrs. Lakshmi Rao — fall detected (score 91%)",
            cooldown_seconds=60,
        )

    Cooldowns are tracked *per alert_type* so that a fall cooldown never
    blocks a separate alert type from firing.
    """

    def __init__(self, config_path: Optional[Path] = None) -> None:
        self._config_path = Path(config_path) if config_path else _DEFAULT_CONFIG
        self._bot_token: Optional[str] = None
        self._contacts: list = []
        self._cooldowns: Dict[str, float] = {}   # alert_type -> last_sent epoch

        self._load_config()

    # ── Config ──────────────────────────────────────────────────────────────

    def _load_config(self) -> None:
        """Load bot_token and contacts from family_contacts.json."""
        if not self._config_path.exists():
            logger.warning(
                "[AlertManager] Config not found at %s — alerts disabled. "
                "Create family_contacts.json to enable Telegram notifications.",
                self._config_path,
            )
            return

        try:
            with open(self._config_path, encoding="utf-8") as fh:
                cfg = json.load(fh)
        except Exception as exc:
            logger.error("[AlertManager] Failed to parse config: %s", exc)
            return

        self._bot_token = cfg.get("bot_token") or None
        self._contacts  = cfg.get("contacts", [])

        if not self._bot_token:
            logger.warning(
                "[AlertManager] bot_token is empty in %s — Telegram alerts disabled.",
                self._config_path,
            )
        else:
            logger.info(
                "[AlertManager] Loaded %d contact(s) from %s",
                len(self._contacts),
                self._config_path,
            )

    # ── Public API ───────────────────────────────────────────────────────────

    def send_alert(
        self,
        alert_type: str,
        severity: str,
        message: str,
        cooldown_seconds: int = 60,
    ) -> bool:
        """
        Send an alert to all configured Telegram contacts.

        Parameters
        ----------
        alert_type:
            Unique key for this class of alert (e.g. "fall", "presence_anomaly").
            Cooldowns are tracked per type independently.
        severity:
            One of "critical", "warning", or "info".
        message:
            Human-readable alert body (without the emoji prefix).
        cooldown_seconds:
            Minimum seconds between successive sends of the *same* alert_type.
            Defaults to 60 s. Set to 0 to always send.

        Returns
        -------
        bool
            True if at least one contact received the message, False otherwise.
        """
        if not self._bot_token:
            logger.debug(
                "[AlertManager] No bot_token — skipping %s alert.", alert_type
            )
            return False

        # ── Cooldown check ────────────────────────────────────────────────────
        now = time.monotonic()
        last_sent = self._cooldowns.get(alert_type, 0.0)
        if (now - last_sent) < cooldown_seconds:
            remaining = cooldown_seconds - (now - last_sent)
            logger.debug(
                "[AlertManager] %s alert suppressed by cooldown (%.0fs remaining).",
                alert_type,
                remaining,
            )
            return False

        # ── Format message ───────────────────────────────────────────────────
        emoji = SEVERITY_EMOJI.get(severity.lower(), "🔔")
        full_text = f"{emoji} *Halo Alert*\n\n{message}"

        # ── Send to each contact ─────────────────────────────────────────────
        any_success = False
        for contact in self._contacts:
            chat_id = contact.get("chat_id")
            name    = contact.get("name", str(chat_id))
            if not chat_id:
                logger.warning("[AlertManager] Contact missing chat_id: %s", contact)
                continue

            try:
                success = self._send_telegram(chat_id, full_text)
            except Exception as exc:
                logger.error(
                    "[AlertManager] Unexpected exception sending to %s (chat_id=%s): %s",
                    name, chat_id, exc,
                )
                success = False
            if success:
                logger.info(
                    "[AlertManager] %s alert sent to %s (type=%s).",
                    severity.upper(),
                    name,
                    alert_type,
                )
                any_success = True
            else:
                # Failure for this contact — log and continue to next
                logger.error(
                    "[AlertManager] Failed to send %s alert to %s (chat_id=%s).",
                    severity.upper(),
                    name,
                    chat_id,
                )

        # Only update cooldown if at least one send succeeded
        if any_success:
            self._cooldowns[alert_type] = now

        return any_success

    # ── Telegram HTTP helper ─────────────────────────────────────────────────

    def _send_telegram(self, chat_id: str, text: str) -> bool:
        """
        POST a message to the Telegram Bot API using only stdlib (no httpx/requests).

        Returns True on HTTP 200, False on any error.
        """
        url = f"https://api.telegram.org/bot{self._bot_token}/sendMessage"
        payload = json.dumps({
            "chat_id":    str(chat_id),
            "text":       text,
            "parse_mode": "Markdown",
        }).encode("utf-8")

        try:
            req = urllib.request.Request(
                url,
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                if status == 200:
                    return True
                body = resp.read().decode("utf-8", errors="replace")
                logger.error(
                    "[AlertManager] Telegram API returned HTTP %d: %s", status, body
                )
                return False

        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace") if exc.fp else ""
            logger.error(
                "[AlertManager] Telegram HTTP error %d for chat_id=%s: %s",
                exc.code,
                chat_id,
                body,
            )
            return False

        except urllib.error.URLError as exc:
            logger.error(
                "[AlertManager] Network error sending to chat_id=%s: %s",
                chat_id,
                exc.reason,
            )
            return False

        except Exception as exc:
            logger.error(
                "[AlertManager] Unexpected error sending to chat_id=%s: %s",
                chat_id,
                exc,
            )
            return False

    # ── Inspection helpers ───────────────────────────────────────────────────

    def is_ready(self) -> bool:
        """Return True if the manager has a valid token and at least one contact."""
        return bool(self._bot_token and self._contacts)

    def cooldown_remaining(self, alert_type: str, cooldown_seconds: int) -> float:
        """Return seconds remaining on the cooldown for *alert_type* (0 if clear)."""
        elapsed = time.monotonic() - self._cooldowns.get(alert_type, 0.0)
        return max(0.0, cooldown_seconds - elapsed)

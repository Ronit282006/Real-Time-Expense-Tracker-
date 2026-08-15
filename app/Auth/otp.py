"""
OTP (One-Time Password) engine for email verification.

Shared by both registration and email-change flows.
Uses in-memory storage with TTL — fine for single-server setups.
"""

import random
import string
import threading
import time
from typing import Any


# ── In-memory store ──────────────────────────────────────────────
# Key: (email, purpose)
# Value: {"otp": str, "payload": Any, "expires_at": float}
_otp_store: dict[tuple[str, str], dict] = {}
_store_lock = threading.Lock()

OTP_LENGTH = 6
OTP_TTL_SECONDS = 10 * 60  # 10 minutes


def generate_otp() -> str:
    """Generate a random 6-digit numeric OTP."""
    return "".join(random.choices(string.digits, k=OTP_LENGTH))


def store_otp(email: str, otp: str, purpose: str, payload: Any = None) -> None:
    """
    Store an OTP for a given email and purpose.

    Args:
        email: The email address the OTP was sent to.
        otp: The generated OTP code.
        purpose: Either "registration" or "email_change".
        payload: Arbitrary data to stash alongside the OTP
                 (e.g. registration form data, or new email address).
    """
    key = (email.lower(), purpose)
    with _store_lock:
        _otp_store[key] = {
            "otp": otp,
            "payload": payload,
            "expires_at": time.time() + OTP_TTL_SECONDS,
        }


def verify_otp(email: str, otp: str, purpose: str) -> Any:
    """
    Validate an OTP and return the stored payload.

    Returns the payload on success.
    Raises ValueError with a user-friendly message on failure.
    The entry is deleted after a successful verification.
    """
    key = (email.lower(), purpose)
    with _store_lock:
        entry = _otp_store.get(key)
        if entry is None:
            raise ValueError("No OTP found for this email. Please request a new one.")
        if time.time() > entry["expires_at"]:
            del _otp_store[key]
            raise ValueError("OTP has expired. Please request a new one.")
        if entry["otp"] != otp:
            raise ValueError("Invalid OTP. Please try again.")
        # Success — pop and return payload
        payload = entry["payload"]
        del _otp_store[key]
        return payload


def has_pending_otp(email: str, purpose: str) -> bool:
    """Check if there is a non-expired pending OTP for an email + purpose."""
    key = (email.lower(), purpose)
    with _store_lock:
        entry = _otp_store.get(key)
        if entry is None:
            return False
        if time.time() > entry["expires_at"]:
            del _otp_store[key]
            return False
        return True


# ── Background cleanup of expired entries ────────────────────────
def _cleanup_expired():
    """Periodically remove expired OTP entries (runs every 60 seconds)."""
    while True:
        time.sleep(60)
        now = time.time()
        with _store_lock:
            expired_keys = [k for k, v in _otp_store.items() if now > v["expires_at"]]
            for k in expired_keys:
                del _otp_store[k]


_cleanup_thread = threading.Thread(target=_cleanup_expired, daemon=True)
_cleanup_thread.start()

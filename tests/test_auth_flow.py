import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

from app.config import settings
from app.main import app


def db_reachable() -> bool:
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


requires_db = pytest.mark.skipif(
    not db_reachable(), reason="Database is not reachable"
)


@requires_db
def test_full_auth_flow(monkeypatch):
    # Prevent real SMTP calls during the test.
    async def fake_send_email(to: str, subject: str, html_body: str):
        return None

    monkeypatch.setattr("app.Account.routes.send_email", fake_send_email)

    email = f"ci-{uuid.uuid4().hex[:10]}@example.com"
    password = "Str0ng-Pass!"

    with TestClient(app) as client:
        # Step 1: request registration OTP
        r = client.post(
            "/account/create-account",
            json={
                "name": "CI Tester",
                "email": email,
                "password": password,
                "mobile_number": "1234567890",
                "re_enter_password": password,
            },
        )
        assert r.status_code == 200, r.text

        # Step 2: read the in-memory OTP and verify
        from app.Auth.otp import _otp_store

        key = (email.lower(), "registration")
        assert key in _otp_store
        otp = _otp_store[key]["otp"]

        r = client.post(
            "/account/verify-registration-otp",
            json={"email": email, "otp": otp},
        )
        assert r.status_code == 200, r.text
        profile = r.json()
        assert profile["email"] == email

        # Step 3: log in
        r = client.post(
            "/account/token",
            data={"username": email, "password": password},
        )
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]

        # Step 4: fetch profile with the token
        r = client.get("/account/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200, r.text
        assert r.json()["email"] == email

        # Step 5: create a transaction
        r = client.post(
            "/transactions/",
            json={
                "amount": 500,
                "type": "expense",
                "category": "Food",
                "note": "Lunch",
                "transaction_datetime": "2026-08-15T12:00:00",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 201, r.text
        assert r.json()["amount"] == 500

        # Step 6: list transactions
        r = client.get(
            "/transactions/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        assert len(r.json()) >= 1

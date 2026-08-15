"""
Google OAuth2 token verification.

Receives a Google ID token (credential) from the frontend,
verifies it against Google's tokeninfo endpoint, and returns
the user's profile information.
"""

import httpx
from fastapi import HTTPException


GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


async def verify_google_token(credential: str, expected_client_id: str) -> dict:
    """
    Verify a Google ID token and return user info.

    Args:
        credential: The ID token string from Google Sign-In.
        expected_client_id: Your app's Google Client ID (to prevent token misuse).

    Returns:
        dict with keys: email, name, sub (Google user ID), picture, email_verified

    Raises:
        HTTPException on invalid/expired token or client ID mismatch.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GOOGLE_TOKENINFO_URL,
            params={"id_token": credential},
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    payload = resp.json()

    # Verify the token was issued for our app
    if payload.get("aud") != expected_client_id:
        raise HTTPException(
            status_code=401,
            detail="Google token was not issued for this application",
        )

    # Verify email is verified by Google
    if payload.get("email_verified") != "true":
        raise HTTPException(
            status_code=401,
            detail="Google email is not verified",
        )

    return {
        "email": payload["email"],
        "name": payload.get("name", payload["email"].split("@")[0]),
        "sub": payload["sub"],  # Google's unique user ID
        "picture": payload.get("picture"),
    }

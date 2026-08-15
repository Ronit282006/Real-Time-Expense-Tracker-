from pathlib import Path

import httpx

from app.config import settings

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"

RESEND_API_URL = "https://api.resend.com/emails"
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def load_template(template_name: str, **kwargs) -> str:
    """Load an HTML email template and replace {{key}} placeholders with values."""
    template_path = TEMPLATES_DIR / template_name
    html = template_path.read_text(encoding="utf-8")
    for key, value in kwargs.items():
        html = html.replace(f"{{{{{key}}}}}", str(value))
    return html


async def _send_via_resend(to: str, subject: str, html_body: str) -> None:
    """Send email through the Resend HTTP API."""
    api_key = settings.RESEND_API_KEY.strip()
    sender = settings.MAIL_FROM.strip()
    if not api_key:
        raise RuntimeError("RESEND_API_KEY is not configured.")
    if not sender:
        raise RuntimeError("MAIL_FROM is required when sending via Resend.")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "from": sender,
                "to": [to],
                "subject": subject,
                "html": html_body,
            },
        )
    if resp.status_code >= 400:
        raise RuntimeError(f"Resend API error {resp.status_code}: {resp.text[:300]}")


async def _send_via_brevo(to: str, subject: str, html_body: str) -> None:
    """Send email through the Brevo (Sendinblue) v3 HTTP API."""
    api_key = settings.BREVO_API_KEY.strip()
    sender = settings.MAIL_FROM.strip()
    if not api_key:
        raise RuntimeError("BREVO_API_KEY is not configured.")
    if not sender:
        raise RuntimeError("MAIL_FROM is required when sending via Brevo.")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            BREVO_API_URL,
            headers={
                "api-key": api_key,
                "accept": "application/json",
            },
            json={
                "sender": {"email": sender},
                "to": [{"email": to}],
                "subject": subject,
                "htmlContent": html_body,
            },
        )
    if resp.status_code >= 400:
        raise RuntimeError(f"Brevo API error {resp.status_code}: {resp.text[:300]}")


async def send_email(to: str, subject: str, html_body: str):
    if settings.BREVO_API_KEY.strip():
        await _send_via_brevo(to, subject, html_body)
        return

    if settings.RESEND_API_KEY.strip():
        await _send_via_resend(to, subject, html_body)
        return

    from fastapi_mail import FastMail, MessageSchema, MessageType
    from app.email.email_config import conf

    message = MessageSchema(
        subject=subject,
        recipients=[to],
        body=html_body,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)

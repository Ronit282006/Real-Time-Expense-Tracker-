from pathlib import Path
from fastapi_mail import FastMail, MessageSchema, MessageType
from app.email.email_config import conf

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def load_template(template_name: str, **kwargs) -> str:
    """Load an HTML email template and replace {{key}} placeholders with values."""
    template_path = TEMPLATES_DIR / template_name
    html = template_path.read_text(encoding="utf-8")
    for key, value in kwargs.items():
        html = html.replace(f"{{{{{key}}}}}", str(value))
    return html


async def send_email(to: str, subject: str, html_body: str):
    message = MessageSchema(
        subject=subject,
        recipients=[to],
        body=html_body,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    await fm.send_message(message)
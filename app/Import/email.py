import asyncio

from app.email.email import load_template, send_email
from app.Import.schema import ImportSummary


def send_import_summary_email(
    to: str,
    user_name: str,
    summary: ImportSummary,
    status: str = "Completed",
) -> None:
    html_body = load_template(
        "import_summary.html",
        user_name=user_name,
        total_rows=str(summary.total_rows),
        imported_rows=str(summary.imported_rows),
        failed_rows=str(summary.failed_rows),
        status=status,
    )

    subject = "Finance Import Completed"
    asyncio.run(
        send_email(
            to=to,
            subject=subject,
            html_body=html_body,
        )
    )

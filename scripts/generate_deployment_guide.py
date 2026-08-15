"""Generate a step-by-step deployment guide PDF for the Expense Management API.

Run:
    python scripts/generate_deployment_guide.py

Output:
    docs/Deployment_Guide.pdf
"""
import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "docs",
    "Deployment_Guide.pdf",
)

BODY = getSampleStyleSheet()["Normal"]
BODY.fontName = "Helvetica"
BODY.fontSize = 9.5
BODY.leading = 14
BODY.spaceAfter = 6

CODE = ParagraphStyle(
    "Code",
    parent=BODY,
    fontName="Courier",
    fontSize=8,
    leading=11,
    backColor=colors.HexColor("#F5F5F5"),
    borderColor=colors.HexColor("#DDDDDD"),
    borderWidth=0.5,
    borderPadding=6,
    spaceBefore=2,
    spaceAfter=10,
)

H1 = getSampleStyleSheet()["Heading1"]
H1.fontSize = 20
H1.spaceBefore = 0
H1.spaceAfter = 10

H2 = getSampleStyleSheet()["Heading2"]
H2.fontName = "Helvetica-Bold"
H2.fontSize = 14
H2.textColor = colors.HexColor("#1F3864")
H2.spaceBefore = 16
H2.spaceAfter = 6

H3 = getSampleStyleSheet()["Heading3"]
H3.fontName = "Helvetica-Bold"
H3.fontSize = 11
H3.textColor = colors.HexColor("#2E5395")
H3.spaceBefore = 12
H3.spaceAfter = 4

BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=12, bulletIndent=2, spaceAfter=3)

TITLE = ParagraphStyle(
    "Title",
    parent=BODY,
    fontName="Helvetica-Bold",
    fontSize=24,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#1F3864"),
    spaceAfter=4,
)

SUBTITLE = ParagraphStyle(
    "Subtitle",
    parent=BODY,
    fontSize=11,
    alignment=TA_CENTER,
    textColor=colors.HexColor("#555555"),
    spaceAfter=18,
)

NOTE = ParagraphStyle(
    "Note",
    parent=BODY,
    backColor=colors.HexColor("#FFF3CD"),
    borderColor=colors.HexColor("#FFC107"),
    borderWidth=0.5,
    borderPadding=6,
    spaceBefore=2,
    spaceAfter=10,
)


def code(text: str) -> Preformatted:
    return Preformatted(text, CODE)


def bullet(text: str) -> Paragraph:
    return Paragraph(text, BULLET, bulletText="\u2022")


def check(text: str) -> Paragraph:
    return Paragraph(text, BULLET, bulletText="\u2610")


def steps(items) -> list:
    out = []
    for i, item in enumerate(items, 1):
        out.append(Paragraph(f"<b>Step {i}.</b> {item}", BULLET, bulletText=str(i) + "."))
        out.append(Spacer(1, 2))
    return out


def table(headers, rows) -> Table:
    data = [headers] + rows
    t = Table(data, colWidths=[46 * mm, 128 * mm], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F3864")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("FONTNAME", (0, 1), (-1, -1), "Courier"),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#BBBBBB")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0F4FA")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def build():
    doc = SimpleDocTemplate(
        OUT_PATH,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Expense Management API - Deployment Guide",
        author="Expense Management API",
    )

    story = []

    story.append(Paragraph("Expense Management API", TITLE))
    story.append(Paragraph("Deployment Guide & Change Checklist (Free Hosting)", SUBTITLE))

    # ----------------------------- Overview -----------------------------
    story.append(Paragraph("1. What you are building", H2))
    story.append(
        Paragraph(
            "This guide deploys the stack on free tiers of three services: "
            "<b>Neon</b> for the PostgreSQL database, <b>Render</b> for the FastAPI backend, "
            "and <b>Vercel</b> for the React frontend. All three have free tiers that never "
            "require a credit card."
        )
    )
    story.append(bullet("<b>Neon</b> - free Postgres database (connection string becomes DATABASE_URL)"))
    story.append(bullet("<b>Render</b> - free web service running FastAPI + Alembic migrations"))
    story.append(bullet("<b>Vercel</b> - free static hosting for the built React app"))
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            "<b>Good news:</b> the codebase has already been made deployment-ready. "
            "Configuration is environment-variable driven, the schema is managed by Alembic "
            "migrations, a health check endpoint exists, and the dashboard works without Redis. "
            "You mostly need to fill in real values, not rewrite code.",
            NOTE,
        )
    )

    # ----------------------------- Prepare -----------------------------
    story.append(Paragraph("2. Prepare the code", H2))
    for item in steps(
        [
            "Open a terminal in the project folder (Expense-managment-API).",
            "Create a GitHub repository (or push to the existing one) and upload this project. "
            "All new files (Dockerfile, alembic/, tests/, .env.example, .github/) must be committed.",
            "Generate a strong secret key with:",
        ]
    ):
        story.append(item)
    story.append(code('python -c "import secrets; print(secrets.token_urlsafe(64))"'))
    story.append(Paragraph("Copy the output - you will paste it into Render's environment variables.", BODY))

    # ----------------------------- Database -----------------------------
    story.append(Paragraph("3. Database - create a free Postgres on Neon", H2))
    for item in steps(
        [
            "Go to <link href='https://neon.tech'>neon.tech</link> and sign up with GitHub or Google.",
            "Click <b>Create a project</b> (region closest to you, PostgreSQL 16 or newer).",
            "Copy the connection string shown. Use the one labelled <b>psycopg</b>/<b>SQLAlchemy</b> "
            "(starts with postgresql://). Example:",
        ]
    ):
        story.append(item)
    story.append(code("postgresql://user:password@ep-something.region.aws.neon.tech/finance_db?sslmode=require"))
    story.append(Paragraph("Keep this string safe. It replaces the current localhost value.", BODY))

    # ----------------------------- Backend -----------------------------
    story.append(Paragraph("4. Backend - deploy the API on Render", H2))
    for item in steps(
        [
            "Go to <link href='https://render.com'>render.com</link> and sign up (GitHub sign-in).",
            "Click <b>New +</b> -&gt; <b>Web Service</b> -&gt; connect your GitHub repository.",
            "Render detects the repo. For Build Command set:",
            "For Start Command set (single worker - free tier has ~512 MB RAM):",
            "Create the service, then open the <b>Environment</b> tab and add the variables below.",
        ]
    ):
        story.append(item)
    story.append(code("pip install -r requirements.txt"))
    story.append(code("alembic upgrade head && gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 1 --bind 0.0.0.0:$PORT"))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Required environment variables (must be set):", H3))
    story.append(
        table(
            ["Variable", "Value"],
            [
                ["APP_ENV", "production"],
                ["DATABASE_URL", "Your Neon connection string from step 3"],
                ["SECRET_KEY", "The 64-character secret you generated in step 2"],
                ["CORS_ORIGINS", "Your Vercel frontend URL, e.g. https://your-app.vercel.app (set after step 5)"],
            ],
        )
    )
    story.append(Paragraph("Optional environment variables (set if you use these features):", H3))
    story.append(
        table(
            ["Variable", "Value"],
            [
                ["GOOGLE_CLIENT_ID", "Google OAuth client ID (if using Google sign-in)"],
                ["MAIL_USERNAME", "Gmail address used for sending emails"],
                ["MAIL_PASSWORD", "Gmail App Password (not your Gmail password)"],
                ["MAIL_FROM", "The same Gmail address"],
                ["REDIS_URL", "Leave empty - dashboard falls back to direct DB reads"],
            ],
        )
    )
    story.append(Paragraph("Skip Redis on the free tier: the dashboard already degrades gracefully when Redis is unavailable.", NOTE))

    # ----------------------------- Frontend -----------------------------
    story.append(Paragraph("5. Frontend - deploy on Vercel", H2))
    for item in steps(
        [
            "Go to <link href='https://vercel.com'>vercel.com</link> and sign in with GitHub.",
            "Click <b>Add New</b> -&gt; <b>Project</b> -&gt; select the repo.",
            "Set <b>Root Directory</b> to <b>frontend</b> (the React app lives there).",
            "Framework auto-detects as Vite. Build command <b>npm run build</b>, output <b>dist</b>.",
            "Add an environment variable VITE_GOOGLE_CLIENT_ID (if using Google sign-in).",
            "Deploy, then note your URL: https://your-app.vercel.app",
        ]
    ):
        story.append(item)
    story.append(Spacer(1, 4))
    story.append(Paragraph("Connect the frontend to the API", H3))
    story.append(
        Paragraph(
            "The frontend calls the API through the relative path /api. On Vercel, add a "
            "<b>vercel.json</b> file in the frontend/ folder so /api/* requests are forwarded to "
            "Render. Create frontend/vercel.json with:",
        )
    )
    story.append(
        code(
            '{\n'
            '  "rewrites": [\n'
            '    {\n'
            '      "source": "/api/:path*",\n'
            '      "destination": "https://YOUR-RENDER-URL.onrender.com/:path*"\n'
            '    }\n'
            '  ]\n'
            '}'
        )
    )
    story.append(
        Paragraph(
            "Replace YOUR-RENDER-URL with your actual Render service URL. "
            "After adding this file, push the change - Vercel redeploys automatically.",
        )
    )

    # ----------------------------- Google OAuth -----------------------------
    story.append(Paragraph("6. Google OAuth (only if you use Google sign-in)", H2))
    for item in steps(
        [
            "Go to <link href='https://console.cloud.google.com'>console.cloud.google.com</link> -&gt; your project -&gt; APIs &amp; Services -&gt; Credentials.",
            "Edit your OAuth 2.0 Client ID.",
            "Under <b>Authorized JavaScript origins</b> add: https://your-app.vercel.app",
            "Under <b>Authorized redirect URIs</b> add: https://your-render-service.onrender.com",
            "Make sure GOOGLE_CLIENT_ID is set in both Render (backend) and Vercel (frontend) env vars.",
        ]
    ):
        story.append(item)

    # ----------------------------- Verify -----------------------------
    story.append(Paragraph("7. Verify the deployment", H2))
    for item in steps(
        [
            "Open https://your-render-service.onrender.com/health - you should see:",
            "Open your Vercel URL and complete a full registration + login + add a transaction.",
            "Check the Render logs tab - the migration should have run (alembic upgrade head).",
        ]
    ):
        story.append(item)
    story.append(
        code(
            '{\n'
            '  "status": "ok",\n'
            '  "app": "Finance API",\n'
            '  "env": "production",\n'
            '  "database": "ok"\n'
            '}'
        )
    )

    # ----------------------------- Caveats -----------------------------
    story.append(Paragraph("8. Free-tier limitations (important)", H2))
    story.append(bullet("Render free web services <b>sleep after 15 minutes</b> of inactivity; the first request after sleep is slow."))
    story.append(bullet("Neon free databases pause when idle; unpause happens on the first connection."))
    story.append(bullet("Vercel has no cold start but inherits the backend's cold start on the first API call."))
    story.append(bullet("Google sign-in emails (OTP/welcome) use Gmail SMTP - requires a Gmail App Password."))

    # ----------------------------- Checklist -----------------------------
    story.append(Paragraph("9. What YOU must change - full checklist", H2))
    story.append(check("<b>SECRET_KEY</b> - generate a real 64-char value (Render env var)."))
    story.append(check("<b>DATABASE_URL</b> - replace the localhost Postgres URL with your Neon URL."))
    story.append(check("<b>APP_ENV=production</b> and <b>DEBUG=false</b> on Render."))
    story.append(check("<b>CORS_ORIGINS</b> - set to your real Vercel frontend URL."))
    story.append(check("<b>frontend/vercel.json</b> - create it with your Render URL in the rewrite."))
    story.append(check("<b>VITE_GOOGLE_CLIENT_ID</b> - set on Vercel if using Google sign-in."))
    story.append(check("<b>Google Cloud</b> - add the Vercel origin and Render redirect to your OAuth client."))
    story.append(check("<b>Gmail App Password</b> - create one for MAIL_PASSWORD (do not paste your normal password)."))
    story.append(check("<b>Start command</b> - use -w 1 on Render's free tier (512 MB RAM)."))
    story.append(check("<b>Port</b> - gunicorn must bind to 0.0.0.0:$PORT (Render injects $PORT)."))
    story.append(check("<b>Test data</b> - the local dev DB stays local; Neon starts empty, so register a fresh account."))

    story.append(Spacer(1, 10))

    # ----------------------------- Alternative -----------------------------
    story.append(Paragraph("10. Alternative - run everything on one free VM (Oracle Cloud)", H2))
    story.append(
        Paragraph(
            "If you prefer not to split across three platforms, Oracle Cloud Free Tier provides an "
            "always-free ARM VM (4 vCPUs / 24 GB RAM). On that VM you run the project as-is with "
            "docker compose - no sleeping, no expiry. It needs a credit card to verify your account, "
            "a VM setup, and a domain or IP-based HTTPS, which is more work."
        )
    )
    story.append(code("cp .env.example .env   # edit .env with real values\ndocker compose up -d --build"))

    story.append(Spacer(1, 10))
    story.append(Paragraph("End of guide.", BODY))

    doc.build(story)
    print(f"PDF written to: {OUT_PATH}")


if __name__ == "__main__":
    build()

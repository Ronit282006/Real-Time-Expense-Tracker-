from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.Account.routes import router as account_router
from app.admin.routes import router as admin_router
from app.Dashboard.routes import router as dashboard_router
from app.Import.routes import router as import_router
from app.config import settings
from app.database.database import engine, session_local
from app.routers.transaction import router as transactions_router
from app.Transation.transation import router as transation_router


def seed_default_categories():
    """Idempotently seed default categories if the table is empty."""
    from app.models.tables import Category

    db = session_local()
    try:
        if db.query(Category).count() == 0:
            default_categories = [
                "Food", "Transport", "Housing", "Utilities", "Shopping",
                "Entertainment", "Health", "Salary", "Freelance", "Other",
            ]
            for name in default_categories:
                db.add(Category(name=name))
            db.commit()
    except Exception:
        # DB schema may not be migrated yet; /health will surface the issue.
        pass
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema is managed by Alembic migrations (alembic upgrade head).
    # Seeding is data-only and safe to run on every startup.
    seed_default_categories()
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/health")
async def health_check():
    """Readiness probe: verifies the app is up and the database is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "unavailable"
    status_code = 200 if db_status == "ok" else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if db_status == "ok" else "degraded",
            "app": settings.APP_NAME,
            "env": settings.APP_ENV,
            "database": db_status,
        },
    )


app.include_router(account_router, prefix="/account")

app.include_router(transation_router)
app.include_router(transactions_router)
app.include_router(dashboard_router)
app.include_router(import_router)
app.include_router(admin_router)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_ENV == "development",
    )

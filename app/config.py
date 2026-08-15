import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Finance API"
    APP_ENV: str = "development"
    DEBUG: bool = False
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    EXPIRE_TIME: int = 30
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    GOOGLE_CLIENT_ID: str = ""

    # Comma-separated list of allowed origins, e.g. "http://localhost:5173,https://app.example.com"
    CORS_ORIGINS: str = "http://localhost:5173"

    # Database connection pool
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # SMTP / Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def validate_production(self) -> None:
        if self.APP_ENV != "production":
            return
        if not self.SECRET_KEY or self.SECRET_KEY == "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY":
            raise RuntimeError(
                "SECRET_KEY must be set to a strong random value in production. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\""
            )
        if "postgresql+psycopg://postgres:123@" in self.DATABASE_URL:
            raise RuntimeError("DATABASE_URL is using the default development credentials. Set real credentials in production.")
        if self.DEBUG:
            raise RuntimeError("DEBUG must be False in production.")


settings = Settings()
settings.validate_production()

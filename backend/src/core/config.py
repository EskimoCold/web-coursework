from pathlib import Path  # noqa: I001

from pydantic_settings import BaseSettings, SettingsConfigDict  # noqa: I001


# Определяем путь к .env файлу относительно расположения этого файла
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    debug: bool = True

    database_url: str

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://158.160.205.61,http://158.160.205.61:5173"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        # Важно: env_ignore_empty=True позволяет игнорировать пустые значения
        # и env_nested_delimiter для вложенных переменных
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

# Логирование для отладки (можно удалить после проверки)
if __debug__:
    import logging  # noqa: I001

    logger = logging.getLogger(__name__)
    logger.info(f"Loading .env from: {ENV_FILE}")
    DB_URL_PREVIEW_LENGTH = 30
    db_url_preview = (
        f"{settings.database_url[:DB_URL_PREVIEW_LENGTH]}..."
        if len(settings.database_url) > DB_URL_PREVIEW_LENGTH
        else settings.database_url
    )
    logger.info(f"DATABASE_URL loaded: {db_url_preview}")

import logging
import os
import sys
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from src.api.v1 import (
    auth_router,
    categories_router,
    currency_router,
    transactions_router,
    users_router,
)
from src.core.config import settings
from src.core.database import Base, engine
from src.models import Category, RefreshToken, Transaction, User  # noqa: F401

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Логирование загруженных настроек (для отладки)
LOG_SEPARATOR_LENGTH = 60
DB_URL_PREVIEW_LENGTH = 50
logger.info("=" * LOG_SEPARATOR_LENGTH)
logger.info("Application Configuration:")
db_url_preview = (
    f"{settings.database_url[:DB_URL_PREVIEW_LENGTH]}..."
    if len(settings.database_url) > DB_URL_PREVIEW_LENGTH
    else settings.database_url
)
logger.info(f"  DATABASE_URL: {db_url_preview}")
logger.info(f"  Debug mode: {settings.debug}")
logger.info("=" * LOG_SEPARATOR_LENGTH)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Попытка подключения к базе данных и создания таблиц
    db_connected = False
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✓ Database connection established and tables created")
        db_connected = True
    except Exception as e:
        error_msg = str(e)
        # Выводим предупреждение, но не завершаем приложение
        separator = "=" * LOG_SEPARATOR_LENGTH
        print(f"\n{separator}", file=sys.stderr)
        print("WARNING: Cannot connect to PostgreSQL database!", file=sys.stderr)
        print(f"Database URL: {settings.database_url}", file=sys.stderr)
        print("", file=sys.stderr)
        print("Please ensure PostgreSQL is running and accessible.", file=sys.stderr)
        print("Options:", file=sys.stderr)
        print("  1. Start PostgreSQL locally", file=sys.stderr)
        print("  2. Run: docker-compose up db -d", file=sys.stderr)
        print("  3. Check DATABASE_URL in .env file", file=sys.stderr)
        print(separator, file=sys.stderr)
        print("Application will start, but database operations will fail.\n", file=sys.stderr)
        logger.warning(f"Database connection failed: {error_msg}")
    
    # Приложение продолжит работу даже без БД
    yield
    
    # Cleanup при завершении
    if db_connected:
        await engine.dispose()


sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("SENTRY_ENV", "development"),
    release=os.getenv("RELEASE"),  # e.g. commit SHA
    integrations=[
        FastApiIntegration(),  # framework integration
        LoggingIntegration(level=None, event_level=None),
    ],
    traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.0")),
    # optional: drop noisy client errors (keep server 5xx)
    ignore_errors=[HTTPException],  # simple, coarse filter
)


app = FastAPI(
    title=settings.app_name if hasattr(settings, "app_name") else "Finance Tracker API",
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(currency_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "healthy"}

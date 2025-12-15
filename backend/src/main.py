from contextlib import asynccontextmanager
import logging
import os
import sys

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


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✓ Database connected")
    except Exception as err:
        logger.warning(f"Database connection failed: {err}")

    yield

    await engine.dispose()


sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("SENTRY_ENV", "development"),
    release=os.getenv("RELEASE"),
    integrations=[
        FastApiIntegration(),
        LoggingIntegration(level=None, event_level=None),
    ],
    traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.0")),
    ignore_errors=[HTTPException],
)

app = FastAPI(
    title="Finance Tracker API",
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

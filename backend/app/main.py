"""FastAPI application entry point."""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from importlib.metadata import PackageNotFoundError
from importlib.metadata import version as _pkg_version

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_all_tables, engine, migrate_schema
from app.routers import (
    cashflows,
    holdings,
    income,
    overview,
    performance,
    timeseries,
    trades,
    upload,
)
from app.services.watcher import ingest_existing, start_watcher

logging.basicConfig(level=logging.INFO)

try:
    _VERSION = _pkg_version("ledger-lens-backend")
except PackageNotFoundError:
    _VERSION = "dev"


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    migrate_schema(engine)
    create_all_tables()
    ingest_existing(settings.data_dir)
    observer = start_watcher(settings.data_dir)
    yield
    observer.stop()
    observer.join()


app = FastAPI(title="Ledger Lens", version=_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api")
app.include_router(overview.router, prefix="/api")
app.include_router(holdings.router, prefix="/api")
app.include_router(trades.router, prefix="/api")
app.include_router(income.router, prefix="/api")
app.include_router(cashflows.router, prefix="/api")
app.include_router(performance.router, prefix="/api")
app.include_router(timeseries.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/version")
def get_version() -> dict[str, str]:
    return {"version": _VERSION}

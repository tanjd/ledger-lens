"""Application settings loaded from environment variables."""

from __future__ import annotations

from pathlib import Path
from typing import ClassVar

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_prefix="LEDGER_",
        case_sensitive=False,
        # Allow comma-separated strings for list fields
        env_parse_none_str="null",
    )

    # Path where CSV files are dropped and ledger_lens.db is stored.
    # Default: the `data/` directory at the repository root (works for local dev).
    # Docker: override via ENV LEDGER_DATA_DIR=/app/data (see Dockerfile).
    data_dir: str = str(Path(__file__).parent.parent.parent / "data")

    # SQLite URL — derived from data_dir if not explicitly set.
    database_url: str = ""

    # CORS origins accepted by the FastAPI backend.
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def db_url(self) -> str:
        return self.database_url or f"sqlite:///{self.data_dir}/ledger_lens.db"


settings = Settings()

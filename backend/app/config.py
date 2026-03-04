"""Application settings loaded from environment variables."""

from __future__ import annotations

from pathlib import Path
from typing import ClassVar

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_prefix="LEDGER_",
        case_sensitive=False,
        env_parse_none_str="null",
    )

    # Path where CSV files are dropped and ledger_lens.db is stored.
    # Default: the `data/` directory at the repository root (works for local dev).
    # Docker: override via ENV LEDGER_DATA_DIR=/app/data (see Dockerfile).
    data_dir: str = str(Path(__file__).parent.parent.parent / "data")

    # SQLite URL — derived from data_dir if not explicitly set.
    database_url: str = ""

    # CORS origins accepted by the FastAPI backend.
    # Accepts a comma-separated string (e.g. http://localhost:3000,http://nas:3000)
    # or a JSON array (e.g. ["http://localhost:3000"]).
    cors_origins: list[str] = ["http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> object:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def db_url(self) -> str:
        return self.database_url or f"sqlite:///{self.data_dir}/ledger_lens.db"


settings = Settings()

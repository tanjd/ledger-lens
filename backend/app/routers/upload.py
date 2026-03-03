"""Upload + preview routes for IBKR CSV statements.

POST /api/preview  — parse CSV, return summary; no DB writes
POST /api/upload   — parse CSV, save to data/, persist to DB
"""

from __future__ import annotations

import re
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.models.api import PreviewResponse, UploadResponse
from app.models.db import Statement
from app.parser.base import parse_ibkr_csv
from app.parser.sections.cash import parse_deposits
from app.parser.sections.income import parse_dividends
from app.parser.sections.instruments import parse_instruments
from app.parser.sections.nav import parse_nav
from app.parser.sections.positions import parse_positions
from app.parser.sections.statement import parse_statement_meta
from app.parser.sections.trades import parse_trades
from app.services.ingestor import ingest_file

router = APIRouter()

# IBKR filename format — two variants:
#   Annual:  <AccountID>_<YYYY>_<YYYY>.csv           e.g. U11111111_2025_2025.csv
#   YTD:     <AccountID>_<YYYYMMDD>_<YYYYMMDD>.csv   e.g. U11111111_20260101_20260302.csv
_IBKR_FILENAME_RE = re.compile(r"^[A-Z]\d+_\d{4}(?:\d{4})?_\d{4}(?:\d{4})?\.csv$")


def _validate_filename(filename: str | None) -> str:
    name = filename or ""
    if not _IBKR_FILENAME_RE.match(name):
        raise HTTPException(
            status_code=400,
            detail=(
                "Filename must match IBKR format:"
                " <AccountID>_<Year>_<Year>.csv (e.g. U11111111_2025_2025.csv)"
                " or <AccountID>_<YYYYMMDD>_<YYYYMMDD>.csv (e.g. U11111111_20260101_20260302.csv)"
            ),
        )
    return name


@router.post("/preview", response_model=PreviewResponse)
async def preview_statement(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> PreviewResponse:
    """Parse a CSV and return a summary without writing to the database."""
    _validate_filename(file.filename)

    content = await file.read()

    # Write to a temp file so the parser can read it from disk
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        raw = parse_ibkr_csv(tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to parse CSV: {exc}") from exc
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    stmt_meta = parse_statement_meta(raw)
    nav_data = parse_nav(raw)
    alias_map = parse_instruments(raw)

    account_id: str = stmt_meta["account_id"]
    year: int = stmt_meta["year"]

    positions = parse_positions(raw, alias_map)
    stock_trades = [t for t in parse_trades(raw, alias_map) if t["asset_category"] != "Forex"]
    deposits = parse_deposits(raw)
    dividends = parse_dividends(raw)

    already_imported = (
        session.exec(
            select(Statement).where(Statement.account_id == account_id, Statement.year == year)
        ).first()
        is not None
    )

    period_end = stmt_meta.get("period_end")
    period_end_label = period_end.strftime("%B %-d, %Y") if period_end else str(year)

    return PreviewResponse(
        account_id=account_id,
        account_name=stmt_meta["account_name"],
        year=year,
        period=stmt_meta["period"],
        period_end_label=period_end_label,
        base_currency=stmt_meta["base_currency"],
        nav_current=nav_data["nav_current"],
        twr_pct=nav_data["twr_pct"],
        position_count=len(positions),
        trade_count=len(stock_trades),
        deposit_count=len(deposits),
        dividend_count=len(dividends),
        already_imported=already_imported,
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_statement(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> UploadResponse:
    """Save a CSV to data/ and ingest it into the database."""
    _validate_filename(file.filename)

    data_dir = Path(settings.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    dest = data_dir / (file.filename or "upload.csv")

    content = await file.read()
    dest.write_bytes(content)

    try:
        statement = ingest_file(str(dest), session)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    end_label = (
        statement.period_end.strftime("%B %-d, %Y") if statement.period_end else str(statement.year)
    )
    return UploadResponse(
        year=statement.year,
        period=statement.period,
        period_end_label=end_label,
        account_id=statement.account_id,
    )

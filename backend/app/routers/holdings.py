"""GET /api/holdings."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.api import HoldingsResponse, HoldingsTotals, PositionItem
from app.models.db import Position, Statement

router = APIRouter()


@router.get("/holdings", response_model=HoldingsResponse)
def get_holdings(
    year: int | None = None,
    session: Session = Depends(get_session),
) -> HoldingsResponse:
    stmt = _get_statement(year, session)
    assert stmt.id is not None

    positions = session.exec(
        select(Position)
        .where(Position.statement_id == stmt.id)
        .order_by(Position.current_value.desc())  # type: ignore
    ).all()

    items = [
        PositionItem(
            symbol=p.symbol,
            description=p.description,
            isin=p.isin,
            quantity=p.quantity,
            cost_price=p.cost_price,
            cost_basis=p.cost_basis,
            close_price=p.close_price,
            current_value=p.current_value,
            unrealized_pnl=p.unrealized_pnl,
        )
        for p in positions
    ]

    totals = HoldingsTotals(
        cost_basis=sum(p.cost_basis for p in positions),
        current_value=sum(p.current_value for p in positions),
        unrealized_pnl=sum(p.unrealized_pnl for p in positions),
    )

    return HoldingsResponse(year=stmt.year, positions=items, totals=totals)


def _get_statement(year: int | None, session: Session) -> Statement:
    if year is not None:
        s = session.exec(select(Statement).where(Statement.year == year)).first()
    else:
        s = session.exec(
            select(Statement).order_by(Statement.year.desc())  # type: ignore
        ).first()
    if s is None:
        raise HTTPException(status_code=404, detail="No data found for the requested year")
    return s

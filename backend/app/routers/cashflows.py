"""GET /api/cashflows."""

from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.api import CashflowsResponse, DepositItem, MonthlyCashflow
from app.models.db import Deposit, Statement

router = APIRouter()


@router.get("/cashflows", response_model=CashflowsResponse)
def get_cashflows(
    year: int | None = None,
    session: Session = Depends(get_session),
) -> CashflowsResponse:
    stmt = _get_statement(year, session)
    assert stmt.id is not None

    deposits = session.exec(
        select(Deposit).where(Deposit.statement_id == stmt.id).order_by(Deposit.settle_date)  # type: ignore
    ).all()

    by_currency: dict[str, float] = defaultdict(float)
    monthly_raw: dict[str, dict[str, float]] = defaultdict(lambda: {"sgd": 0.0, "usd": 0.0})

    for d in deposits:
        by_currency[d.currency] += d.amount
        month_key = d.settle_date.strftime("%Y-%m")
        if d.currency == "SGD":
            monthly_raw[month_key]["sgd"] += d.amount
        elif d.currency == "USD":
            monthly_raw[month_key]["usd"] += d.amount

    monthly = [
        MonthlyCashflow(month=month, sgd=vals["sgd"], usd=vals["usd"])
        for month, vals in sorted(monthly_raw.items())
    ]

    return CashflowsResponse(
        year=stmt.year,
        deposits=[
            DepositItem(
                settle_date=d.settle_date,
                currency=d.currency,
                description=d.description,
                amount=d.amount,
            )
            for d in deposits
        ],
        by_currency=dict(by_currency),
        total_usd=stmt.deposits_withdrawals,
        monthly=monthly,
    )


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

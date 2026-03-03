"""GET /api/years and GET /api/overview."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.api import AssetAllocation, ChangeInNav, NavSummary, OverviewResponse
from app.models.db import Statement

router = APIRouter()


@router.get("/years", response_model=list[int])
def get_years(session: Session = Depends(get_session)) -> list[int]:
    statements = session.exec(select(Statement).order_by(Statement.year)).all()  # type: ignore
    return [s.year for s in statements]


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    year: int | None = None,
    session: Session = Depends(get_session),
) -> OverviewResponse:
    stmt = _get_statement(year, session)

    asset_allocation = []
    if stmt.nav_stock:
        asset_allocation.append(AssetAllocation(asset_class="Stock", value=stmt.nav_stock))
    if stmt.nav_cash:
        asset_allocation.append(AssetAllocation(asset_class="Cash", value=stmt.nav_cash))

    return OverviewResponse(
        year=stmt.year,
        period=stmt.period,
        account_id=stmt.account_id,
        account_name=stmt.account_name,
        nav=NavSummary(
            prior_total=stmt.nav_prior,
            current_total=stmt.nav_current,
            change=stmt.nav_change,
            twr_pct=stmt.twr_pct,
        ),
        change_in_nav=ChangeInNav(
            starting_value=stmt.starting_value,
            ending_value=stmt.ending_value,
            deposits_withdrawals=stmt.deposits_withdrawals,
            mark_to_market=stmt.mark_to_market,
            dividends=stmt.dividends,
            withholding_tax=stmt.withholding_tax,
            commissions=stmt.commissions,
            other_fees=stmt.other_fees,
            sales_tax=stmt.sales_tax,
        ),
        asset_allocation=asset_allocation,
    )


def _get_statement(year: int | None, session: Session) -> Statement:
    if year is not None:
        stmt = session.exec(select(Statement).where(Statement.year == year)).first()
    else:
        stmt = session.exec(
            select(Statement).order_by(Statement.year.desc())  # type: ignore
        ).first()
    if stmt is None:
        raise HTTPException(status_code=404, detail="No data found for the requested year")
    return stmt

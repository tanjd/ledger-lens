"""GET /api/performance."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models.api import (
    CorporateActionItem,
    MtmItem,
    PerformanceResponse,
    PnlItem,
    PnlSummary,
)
from app.models.db import CorporateAction, MtmRecord, PnlRecord, Statement

router = APIRouter()


@router.get("/performance", response_model=PerformanceResponse)
def get_performance(
    year: int | None = None,
    session: Session = Depends(get_session),
) -> PerformanceResponse:
    stmt = _get_statement(year, session)
    assert stmt.id is not None

    pnl_records = session.exec(select(PnlRecord).where(PnlRecord.statement_id == stmt.id)).all()

    mtm_records = session.exec(select(MtmRecord).where(MtmRecord.statement_id == stmt.id)).all()

    corp_actions = session.exec(
        select(CorporateAction)
        .where(CorporateAction.statement_id == stmt.id)
        .order_by(CorporateAction.action_date)  # type: ignore
    ).all()

    realized_st = sum(r.realized_st_profit + r.realized_st_loss for r in pnl_records)
    realized_lt = sum(r.realized_lt_profit + r.realized_lt_loss for r in pnl_records)
    realized_total = sum(r.realized_total for r in pnl_records)
    unrealized_total = sum(r.unrealized_total for r in pnl_records)

    return PerformanceResponse(
        year=stmt.year,
        pnl_records=[
            PnlItem(
                symbol=r.symbol,
                asset_category=r.asset_category,
                realized_st_profit=r.realized_st_profit,
                realized_st_loss=r.realized_st_loss,
                realized_lt_profit=r.realized_lt_profit,
                realized_lt_loss=r.realized_lt_loss,
                realized_total=r.realized_total,
                unrealized_st_profit=r.unrealized_st_profit,
                unrealized_st_loss=r.unrealized_st_loss,
                unrealized_lt_profit=r.unrealized_lt_profit,
                unrealized_lt_loss=r.unrealized_lt_loss,
                unrealized_total=r.unrealized_total,
                total=r.total,
            )
            for r in pnl_records
        ],
        summary=PnlSummary(
            realized_st=realized_st,
            realized_lt=realized_lt,
            realized_total=realized_total,
            unrealized_total=unrealized_total,
            total=realized_total + unrealized_total,
        ),
        mtm_summary=[
            MtmItem(
                symbol=m.symbol,
                asset_category=m.asset_category,
                prior_qty=m.prior_qty,
                current_qty=m.current_qty,
                prior_price=m.prior_price,
                current_price=m.current_price,
                mtm_position=m.mtm_position,
                mtm_transaction=m.mtm_transaction,
                mtm_commissions=m.mtm_commissions,
                mtm_other=m.mtm_other,
                mtm_total=m.mtm_total,
            )
            for m in mtm_records
        ],
        corporate_actions=[
            CorporateActionItem(
                action_date=ca.action_date,
                symbol=ca.symbol,
                description=ca.description,
                quantity=ca.quantity,
                proceeds=ca.proceeds,
                value=ca.value,
                realized_pnl=ca.realized_pnl,
            )
            for ca in corp_actions
        ],
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

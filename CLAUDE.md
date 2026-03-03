# Ledger Lens — Claude Context

## Project Overview
Personal portfolio analysis dashboard for Interactive Brokers (IBKR) annual activity statement CSV files. Ingests one CSV per year, persists data, and surfaces multi-year time series insights.

## Architecture
- **Backend**: Python 3.13 + FastAPI + SQLModel (SQLite) — in `backend/`
- **Frontend**: Next.js (App Router) + Tailwind CSS + shadcn/ui + Recharts — in `frontend/`
- **Data**: `data/` directory — watched for new CSV files, also holds `ledger_lens.db`
- **Docker**: `Dockerfile` (backend) + `Dockerfile.frontend` + `docker-compose.yml`

## Key Directories
```
ledger-lens/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app entry point
│       ├── config.py            # pydantic-settings
│       ├── database.py          # SQLModel engine + create_all_tables
│       ├── parser/
│       │   ├── base.py          # IBKR CSV section-splitting reader (CRITICAL)
│       │   ├── normalizers.py   # shared: parse numbers, dates, aliases
│       │   └── sections/        # one module per CSV section
│       ├── models/
│       │   ├── db.py            # SQLModel table definitions
│       │   └── api.py           # Pydantic response schemas
│       ├── services/
│       │   ├── ingestor.py      # parse → upsert; called by watcher + upload
│       │   └── watcher.py       # watchdog FileSystemEventHandler for data/
│       └── routers/             # one router per endpoint group
└── frontend/
    └── src/
        ├── app/                 # Next.js App Router pages (7 tabs)
        ├── components/          # per-tab component folders + shadcn/ui
        ├── lib/
        │   ├── api.ts           # typed fetch wrappers
        │   ├── types.ts         # TS interfaces = API contract
        │   └── formatters.ts
        └── hooks/
            └── useStatement.ts  # SWR hooks per endpoint
```

## IBKR CSV Format (Critical)
NOT a flat CSV — embeds ~15 named tables. Format:
```
SectionName,Header,col1,col2,...
SectionName,Data,val1,val2,...
```
Parsing gotchas:
- Quoted comma-numbers: `"3,154.99"` → strip quotes, remove comma, cast float
- Quoted datetimes: `"2025-01-02, 11:22:01"` → `strptime(..., "%Y-%m-%d, %H:%M:%S")`
- `--` = N/A sentinel → `None`
- **Trades section has TWO Header rows** (stocks then forex) — must route forex rows separately
- SubTotal rows appear as Data rows — filter by `DataDiscriminator == "Order"` for actual trades
- `CSSPXz` = alias for `CSPX` — normalized via `Financial Instrument Information` section

## API Endpoints
- `POST /api/upload` — upload new CSV, triggers ingest
- `GET /api/years` — list all ingested years
- `GET /api/overview?year=N` — NAV, TWR, asset allocation
- `GET /api/holdings?year=N` — open positions
- `GET /api/trades?year=N` — trade history
- `GET /api/income?year=N` — dividends, withholding tax, fees
- `GET /api/cashflows?year=N` — deposits/withdrawals
- `GET /api/performance?year=N` — realized/unrealized P&L, MTM
- `GET /api/timeseries/*` — multi-year aggregates

## Dashboard Tabs
1. **Overview** — NAV, TWR, asset allocation donut
2. **Holdings** — sortable open positions table
3. **Trades** — stock/forex dual-tab with code badges
4. **Income** — dividends, withholding tax by symbol
5. **Cash Flows** — deposits timeline + bar chart
6. **P&L Analysis** — realized/unrealized, MTM, corporate actions
7. **Trends** — multi-year portfolio growth, dividend growth, DCA pattern

## Dev Commands
```bash
make setup          # install backend + frontend deps + pre-commit hooks
make dev            # run backend (:8000) + frontend (:3000) concurrently
make backend-run    # FastAPI only
make frontend-run   # Next.js only
make check          # lint + format + typecheck + test
make check-ci       # pre-commit + all checks (used in CI)
make docker-build   # build both Docker images
```

## Tech Stack
- **Backend**: `uv`, `fastapi`, `uvicorn`, `sqlmodel`, `pydantic-settings`, `watchdog`, `python-multipart`
- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui (New York style, Zinc), Recharts, SWR, Sonner
- **Dev tools**: Ruff (lint+format), basedpyright (typecheck), pytest, pre-commit, conventional commits
- **CI/CD**: GitHub Actions → semantic-release → Docker Hub push

## Code Style
- Python: Ruff with `line-length = 100`, target `py312`
- TypeScript: Prettier (via shadcn/ui defaults)
- Commits: Conventional Commits (enforced by pre-commit hook)
- Python type checking: basedpyright in `standard` mode

## Data Ingestion Flow
1. CSV dropped in `data/` (or uploaded via UI)
2. `watcher.py` (watchdog) detects file → calls `ingestor.py`
3. `ingestor.py` calls `parser/base.py` → section parsers → upserts to SQLite
4. Re-uploading the same year is safe (upsert by `account_id + year`)
5. Frontend refreshes via SWR `mutate()` after upload

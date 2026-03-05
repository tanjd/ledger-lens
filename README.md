# Ledger Lens

Personal portfolio analysis dashboard for Interactive Brokers (IBKR) annual activity statement CSV files. Upload one CSV per year and get a multi-year view of your portfolio's NAV, P&L, dividends, trades, and cash flows.

The sidebar footer displays the current frontend and backend versions, fetched live from `GET /api/version`.

## Features

- **Overview** — NAV history, time-weighted return, asset allocation, year-over-year summary
- **Holdings** — open positions with cost basis, unrealized P&L, and portfolio allocation chart
- **Trades** — stock and forex trade history with direction badges and commission breakdown
- **Income** — dividends and withholding tax by symbol, with yield-on-cost and multi-year growth chart
- **Cash Flows** — deposit/withdrawal timeline with monthly bar chart and cumulative NAV vs invested chart
- **P&L Analysis** — realized/unrealized P&L (short-term + long-term), mark-to-market, corporate actions
- **Trends** — multi-year portfolio growth, TWR by year, deposit vs growth breakdown
- **Privacy mode** — blur all monetary values with a single toggle
- **Upload dialog** — 2-step preview → import flow with duplicate detection

## Tech Stack

| Layer    | Stack                                                             |
| -------- | ----------------------------------------------------------------- |
| Backend  | Python 3.14 · FastAPI · SQLModel · SQLite · Watchdog              |
| Frontend | Next.js 15 · React 19 · Tailwind CSS · shadcn/ui · Recharts · SWR |
| Tooling  | uv · Ruff · basedpyright · pytest · pre-commit                    |
| CI/CD    | GitHub Actions · semantic-release · Docker Hub                    |

## Quick Start

### With Docker (recommended)

```bash
cp docker-compose.example.yml docker-compose.yml
# Edit docker-compose.yml to set DATA_DIR to your local statements folder
docker compose up
```

Open [http://localhost:3000](http://localhost:3000), then upload your IBKR CSV via the upload button.

### Local Development

**Prerequisites:** [uv](https://docs.astral.sh/uv/), Node.js 22+

```bash
git clone https://github.com/tanjd/ledger-lens.git
cd ledger-lens
make setup          # install backend + frontend deps + pre-commit hooks
make dev            # backend on :8000 and frontend on :3000
```

Drop your IBKR CSV files into the `data/` directory — the backend picks them up automatically.

## IBKR CSV Format

Export from IBKR: **Reports → Tax Documents / Activity → Annual Activity Statement → CSV**.

The expected filename pattern is `<AccountID>_<Year>_<Year>.csv` (e.g. `U1234567_2024_2024.csv`). Re-uploading the same year is safe — the ingestor fully replaces the previous data.

## Dev Commands

```bash
make setup          # install all deps and pre-commit hooks
make dev            # run backend (:8000) + frontend (:3000) concurrently
make check          # lint + format + typecheck + test
make docker-build   # build backend and frontend Docker images
make docker-push    # build, tag, and push images to Docker Hub
```

## License

MIT

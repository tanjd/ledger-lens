# Ledger Lens

[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)
[![Dev Containers](https://img.shields.io/badge/Dev%20Containers-open-blue?logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/tanjd/ledger-lens)

Multi-broker portfolio analysis dashboard supporting Interactive Brokers (IBKR) and Moomoo. Upload CSV statements per year per broker and get a multi-year view of your portfolio's NAV, P&L, dividends, trades, and cash flows.

## Features

- **Overview** — NAV history, time-weighted return, asset allocation, year-over-year summary; broker-aware in multi-broker mode
- **Holdings** — open positions with cost basis, unrealized P&L, and portfolio allocation chart; Combined/IBKR/Moomoo tabs in multi-broker mode
- **Trades** — stock and forex trade history with direction badges, commission breakdown, and broker badges
- **Income** — dividends and withholding tax by symbol (IBKR)
- **Cash Flows** — deposit/withdrawal timeline with monthly bar chart and cumulative NAV vs invested chart (IBKR)
- **P&L Analysis** — realized/unrealized P&L (short-term + long-term), mark-to-market, corporate actions (IBKR)
- **Trends** — multi-year portfolio growth, TWR by year, deposit vs growth breakdown (IBKR)
- **Upload History** — persistent log of every import (manual upload or file-drop), with per-file counts and status
- **Privacy mode** — blur all monetary values with a single toggle
- **Upload dialog** — 2-step preview → import flow with duplicate detection and inline result summary

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

### Dev Container (recommended for development)

The repo ships with a fully configured Dev Container. Open it in VS Code or GitHub Codespaces and everything is set up automatically — Python 3.14 + uv, Node.js, pre-commit hooks, Docker-in-Docker, and all VS Code extensions.

**VS Code:**

1. Install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension
2. Clone the repo and open it in VS Code
3. When prompted, click **Reopen in Container** (or run `Dev Containers: Reopen in Container` from the command palette)
4. Wait for `make setup` to complete — deps and hooks are installed automatically
5. Run `make dev` to start the backend and frontend

**GitHub Codespaces:** click **Code → Codespaces → Create codespace on main**.

### Local Development

**Prerequisites:** [uv](https://docs.astral.sh/uv/), Node.js 22+

```bash
git clone https://github.com/tanjd/ledger-lens.git
cd ledger-lens
make setup          # install backend + frontend deps + pre-commit hooks
make dev            # backend on :8000 and frontend on :3000
```

Drop CSV files into the `data/` directory — the backend picks them up automatically.

## Supported CSV Formats

| Broker | File type | Filename pattern |
|--------|-----------|-----------------|
| IBKR | Annual activity statement | `U1234567_2024_2024.csv` |
| IBKR | YTD statement | `U1234567_20240101_20240930.csv` |
| Moomoo | Trade history | `History-Margin Account(123456)-20240101-120000.csv` |
| Moomoo | Positions snapshot | `Positions-Margin Account(123456)-20240101-120000.csv` |

Export from IBKR: **Reports → Tax Documents / Activity → Annual Activity Statement → CSV**.

Re-uploading the same year is safe — the ingestor fully replaces the previous data. Every import is recorded in the Upload History page.

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

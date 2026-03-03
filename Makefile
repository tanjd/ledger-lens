PROJECT_NAME ?= ledger-lens
DOCKER_BACKEND ?= tanjd/$(PROJECT_NAME)-backend:latest
DOCKER_FRONTEND ?= tanjd/$(PROJECT_NAME)-frontend:latest

MAKEFLAGS += --no-print-directory

.PHONY: help setup sync upgrade \
        backend-run frontend-run dev \
        test lint format typecheck check check-ci \
        docker-build docker-run docker-push

.DEFAULT_GOAL := help

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(PROJECT_NAME) — Available Commands:\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Development

setup: ## Install all deps (backend + frontend) and pre-commit hooks
	cd backend && uv sync
	cd frontend && npm install
	uv run --directory backend pre-commit install

sync: ## Sync backend dependencies with uv
	cd backend && uv sync

upgrade: ## Upgrade backend dependencies
	cd backend && uv lock --upgrade

backend-run: ## Run FastAPI backend (port 8000)
	cd backend && PYTHONUNBUFFERED=1 uv run uvicorn app.main:app --reload --port 8000

frontend-run: ## Run Next.js frontend (port 3000)
	cd frontend && npm run dev

dev: ## Run backend and frontend concurrently
	@echo "Starting backend on :8000 and frontend on :3000 ..."
	@trap 'kill 0' INT; \
	  $(MAKE) backend-run & \
	  $(MAKE) frontend-run & \
	  wait

##@ Testing & Quality

test: ## Run pytest (backend)
	cd backend && uv run pytest

lint: ## Lint Python code with Ruff
	cd backend && uv run ruff check .

format: ## Format Python code with Ruff
	cd backend && uv run ruff format .

typecheck: ## Type-check backend with Basedpyright
	cd backend && uv run basedpyright app

check: lint format typecheck test ## Run all checks (lint, format, typecheck, test)

check-ci: ## Run pre-commit and all checks (for CI)
	cd backend && uv run pre-commit run --all-files
	$(MAKE) check

##@ Docker

docker-build: ## Build backend and frontend Docker images
	docker build -t ledger-lens-backend -f Dockerfile .
	docker build -t ledger-lens-frontend -f Dockerfile.frontend .

docker-run: ## Run via docker compose (requires docker-compose.yml)
	docker compose up

docker-push: docker-build ## Build, tag, and push both images to Docker Hub
	docker tag ledger-lens-backend:latest $(DOCKER_BACKEND)
	docker tag ledger-lens-frontend:latest $(DOCKER_FRONTEND)
	docker push $(DOCKER_BACKEND)
	docker push $(DOCKER_FRONTEND)

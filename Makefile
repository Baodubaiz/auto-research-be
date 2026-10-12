.PHONY: help up down restart restart-be logs ps build db-push db-push-host sh prod-build prod-up prod-down prod-restart prod-logs prod-ps

APP_PORT ?= 3001
API_PREFIX ?= api/v1
DATABASE_URL_HOST ?= postgresql://postgres:postgres@localhost:5432/autoresearch?schema=public
LOCAL_COMPOSE_FILE ?= docker-compose.local.yml
LOCAL_PROJECT ?= auto-research-be-local
PROD_COMPOSE_FILE ?= docker-compose.prod.yml
PROD_PROJECT ?= auto-research-be
IMAGE_NAME ?= auto-research-be
BUILD_NUMBER ?= latest
ENV_FILE_PATH ?= .env.production

help:
	@echo "Available commands:"
	@echo ""
	@echo "Local / Dev (Docker Hot-Reload):"
	@echo "  make up          - Build & start PostgreSQL + Backend (Hot Reload) with Docker Compose"
	@echo "  make down        - Stop all local Docker Compose services"
	@echo "  make restart     - Restart all local Docker Compose services"
	@echo "  make restart-be  - Restart only the backend container"
	@echo "  make logs        - Follow backend container logs"
	@echo "  make ps          - Show running Compose services"
	@echo "  make build       - Rebuild the local backend Docker image"
	@echo "  make db-push     - Push Prisma schema using Docker container (no host Node needed)"
	@echo "  make db-push-host- Push Prisma schema from host (requires Node & Prisma on host)"
	@echo "  make sh          - Open a shell inside the backend container"
	@echo ""
	@echo "Production / Linux server:"
	@echo "  make prod-build  - Build the production Docker image"
	@echo "  make prod-up     - Start production Compose services"
	@echo "  make prod-down   - Stop production Compose services"
	@echo "  make prod-restart- Restart production Compose services"
	@echo "  make prod-logs   - Follow production backend logs"
	@echo "  make prod-ps     - Show production Compose services"

up:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) up -d --build

down:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) down

restart: down up

restart-be:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) restart auto-research-be

logs:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) logs -f auto-research-be

ps:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) ps

build:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) build auto-research-be

db-push:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) exec auto-research-be npx prisma db push

db-push-host:
	DATABASE_URL='$(DATABASE_URL_HOST)' npx prisma db push

sh:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) exec auto-research-be sh

prod-build:
	docker build -t $(IMAGE_NAME):$(BUILD_NUMBER) -t $(IMAGE_NAME):latest .

prod-up: prod-build
	IMAGE_NAME=$(IMAGE_NAME) BUILD_NUMBER=$(BUILD_NUMBER) ENV_FILE_PATH=$(ENV_FILE_PATH) docker compose -p $(PROD_PROJECT) -f $(PROD_COMPOSE_FILE) --env-file $(ENV_FILE_PATH) up -d --no-build

prod-down:
	IMAGE_NAME=$(IMAGE_NAME) BUILD_NUMBER=$(BUILD_NUMBER) ENV_FILE_PATH=$(ENV_FILE_PATH) docker compose -p $(PROD_PROJECT) -f $(PROD_COMPOSE_FILE) --env-file $(ENV_FILE_PATH) down

prod-restart: prod-down prod-up

prod-logs:
	IMAGE_NAME=$(IMAGE_NAME) BUILD_NUMBER=$(BUILD_NUMBER) ENV_FILE_PATH=$(ENV_FILE_PATH) docker compose -p $(PROD_PROJECT) -f $(PROD_COMPOSE_FILE) --env-file $(ENV_FILE_PATH) logs -f auto-research-be

prod-ps:
	IMAGE_NAME=$(IMAGE_NAME) BUILD_NUMBER=$(BUILD_NUMBER) ENV_FILE_PATH=$(ENV_FILE_PATH) docker compose -p $(PROD_PROJECT) -f $(PROD_COMPOSE_FILE) --env-file $(ENV_FILE_PATH) ps

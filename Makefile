.PHONY: help up down restart logs ps build db-push tunnel prod-build prod-up prod-down prod-restart prod-logs prod-ps

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
	@echo "Local/dev:"
	@echo "  make up       - Build and start PostgreSQL + backend with Docker Compose"
	@echo "  make down     - Stop Docker Compose services"
	@echo "  make restart  - Restart all Docker Compose services"
	@echo "  make logs     - Follow backend logs"
	@echo "  make ps       - Show running Compose services"
	@echo "  make build    - Build the backend Docker image"
	@echo "  make db-push  - Push Prisma schema to local Compose PostgreSQL"
	@echo "  make tunnel   - Start Docker services, then expose the backend with ngrok"
	@echo ""
	@echo "Production/Linux server:"
	@echo "  make prod-build    - Build the production Docker image"
	@echo "  make prod-up       - Build image, then start production Compose services"
	@echo "  make prod-down     - Stop production Compose services"
	@echo "  make prod-restart  - Restart production Compose services"
	@echo "  make prod-logs     - Follow production backend logs"
	@echo "  make prod-ps       - Show production Compose services"

up:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) up -d --build

down:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) down

restart: down up

logs:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) logs -f auto-research-be

ps:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) ps

build:
	docker compose -p $(LOCAL_PROJECT) -f $(LOCAL_COMPOSE_FILE) build auto-research-be

db-push:
	powershell -NoProfile -Command "$$env:DATABASE_URL='$(DATABASE_URL_HOST)'; npx prisma db push"

tunnel:
	powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-tunnel.ps1 -Port $(APP_PORT) -ApiPrefix "$(API_PREFIX)" -ComposeFile "$(LOCAL_COMPOSE_FILE)" -ProjectName "$(LOCAL_PROJECT)"

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

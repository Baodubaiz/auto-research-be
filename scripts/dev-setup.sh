#!/usr/bin/env bash

# ==============================================================================
# AUTO-RESEARCH-BE: Docker Development Automated Setup Script (Linux/macOS)
# ==============================================================================

set -e

# ANSI Color codes for clean output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.local.yml"
PROJECT_NAME="auto-research-be-local"
BE_CONTAINER="auto-research-be-local"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE} 🚀 AUTO-RESEARCH-BE : DOCKER DEV ENVIRONMENT SETUP   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Check Docker Installation
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}❌ Lỗi: Docker chưa được cài đặt trên máy của bạn.${NC}"
  echo "Vui lòng cài đặt Docker trước khi tiếp tục: https://docs.docker.com/engine/install/"
  exit 1
fi

# 2. Check Docker Daemon Status
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}❌ Lỗi: Docker Daemon chưa khởi động hoặc người dùng không có quyền truy cập.${NC}"
  echo "Vui lòng khởi động Docker (ví dụ: sudo systemctl start docker hoặc bật Docker Desktop)."
  exit 1
fi

echo -e "${GREEN}✓ Docker Daemon đang hoạt động tốt.${NC}"

# 3. Check & Auto-create .env file if missing
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo -e "${YELLOW}⚠️  Chưa tìm thấy file .env. Đang tự động tạo từ .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Đã tạo file .env thành công.${NC}"
  else
    echo -e "${RED}❌ Lỗi: Không tìm thấy cả .env lẫn .env.example.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ File .env đã tồn tại.${NC}"
fi

# 4. Check & Auto-create docker-compose.local.yml if missing
if [ ! -f "${COMPOSE_FILE}" ]; then
  if [ -f "docker-compose.local.example.yml" ]; then
    echo -e "${YELLOW}⚠️  Chưa tìm thấy ${COMPOSE_FILE}. Đang tự động tạo từ docker-compose.local.example.yml...${NC}"
    cp docker-compose.local.example.yml "${COMPOSE_FILE}"
    echo -e "${GREEN}✓ Đã tạo ${COMPOSE_FILE} thành công.${NC}"
  else
    echo -e "${RED}❌ Lỗi: Không tìm thấy ${COMPOSE_FILE} hoặc docker-compose.local.example.yml.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ File ${COMPOSE_FILE} đã sẵn sàng.${NC}"
fi

# 5. Check if backend container is ALREADY running
RUNNING_CONTAINER=$(docker ps --filter "name=${BE_CONTAINER}" --filter "status=running" -q)

if [ -n "$RUNNING_CONTAINER" ]; then
  echo -e "${YELLOW}------------------------------------------------------${NC}"
  echo -e "${GREEN}⚡ Container backend '${BE_CONTAINER}' ĐANG CHẠY BÌNH THƯỜNG!${NC}"
  echo -e "${YELLOW}Không khởi tạo lại Docker để tránh xung đột hoặc gián đoạn.${NC}"
  echo -e "${BLUE}Backend URL : http://localhost:3001/api/v1${NC}"
  echo -e "${BLUE}Tự động mở logs theo dõi Hot Reload (Nhấn Ctrl + C để thoát xem logs)...${NC}"
  echo -e "${YELLOW}------------------------------------------------------${NC}"
  docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" logs -f auto-research-be
  exit 0
fi

# 6. Container is NOT running -> Proceed with build & start
echo -e "${BLUE}------------------------------------------------------${NC}"
echo -e "${BLUE}📦 Đang tiến hành build image và khởi động PostgreSQL + Backend...${NC}"
echo -e "${BLUE}------------------------------------------------------${NC}"

docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" up -d --build

# 7. Wait for PostgreSQL and Backend to be ready
echo -e "${YELLOW}⏳ Đang chờ PostgreSQL và Backend khởi động hoàn tất (khoảng 8-10 giây)...${NC}"
sleep 8

# 8. Push Prisma Database Schema inside container
echo -e "${BLUE}🔄 Đang đồng bộ cơ sở dữ liệu Prisma (db push)...${NC}"
if docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" exec -T auto-research-be npx prisma db push; then
  echo -e "${GREEN}✓ Đồng bộ Database schema Prisma thành công!${NC}"
else
  echo -e "${YELLOW}⚠️  Lưu ý: Không thể đồng bộ schema ngay lập tức (có thể container DB đang khởi động tiếp tục). Bạn có thể chạy lại 'make db-push' sau.${NC}"
fi

echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}🎉 TẤT CẢ ĐÃ SẴN SÀNG ĐỂ PHÁT TRIỂN!                  ${NC}"
echo -e "${GREEN}👉 Backend API URL : http://localhost:3001/api/v1      ${NC}"
echo -e "${GREEN}👉 Tính năng Hot Reload đã kích hoạt theo thời gian thực.${NC}"
echo -e "${GREEN}👉 Đang mở Logs server (Nhấn Ctrl + C để thoát logs)...${NC}"
echo -e "${GREEN}======================================================${NC}"

# 9. Follow logs
docker compose -p "${PROJECT_NAME}" -f "${COMPOSE_FILE}" logs -f auto-research-be

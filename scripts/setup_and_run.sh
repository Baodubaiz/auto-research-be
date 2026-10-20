#!/usr/bin/env bash
set -e

# ==============================================================================
# setup_and_run.sh — Docker-First Initializer
# Theo chuẩn: rules/rule-docker.md
# ==============================================================================

echo "🔍 Kiểm tra môi trường Docker..."

# 1. Kiểm tra Docker CLI
if ! command -v docker &> /dev/null; then
    echo "❌ Lỗi: Docker chưa được cài đặt trên hệ thống."
    exit 1
fi

# 2. Kiểm tra Docker daemon đang chạy
if ! docker info &> /dev/null; then
    echo "❌ Lỗi: Docker daemon chưa được khởi động."
    exit 1
fi

echo "✅ Docker daemon đã sẵn sàng."

# 3. Chuẩn bị file .env nếu chưa tồn tại
if [ ! -f .env ]; then
    echo "⚠️  Chưa tìm thấy .env, tiến hành sao chép từ .env.example..."
    cp .env.example .env
    echo "✅ Đã tạo file .env thành công."
else
    echo "✅ File .env đã tồn tại."
fi

# 4. Khởi động các dịch vụ bằng Docker Compose
echo "🚀 Đang khởi động services với Docker Compose..."
docker compose up --build -d

echo "--------------------------------------------------------"
echo "✅ Tất cả services đã được khởi chạy thành công!"
echo "📡 Backend API: http://localhost:3001/api/v1"
echo "📋 Để theo dõi logs: docker compose logs -f"
echo "🛑 Để dừng hệ thống: docker compose down"
echo "--------------------------------------------------------"

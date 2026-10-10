# ==============================================================================
# AUTO-RESEARCH-BE: Docker Development Automated Setup Script (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

$ComposeFile = "docker-compose.local.yml"
$ProjectName = "auto-research-be-local"
$BeContainer = "auto-research-be-local"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " 🚀 AUTO-RESEARCH-BE : DOCKER DEV ENVIRONMENT SETUP   " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Check Docker Installation
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Lỗi: Docker chưa được cài đặt trên máy của bạn." -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Docker Desktop trước: https://docs.docker.com/desktop/setup/install/windows-install/"
    exit 1
}

# 2. Check Docker Daemon Status
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Lỗi: Docker Desktop chưa được khởi động." -ForegroundColor Red
        Write-Host "Vui lòng bật Docker Desktop và đợi đến khi Docker Engine sẵn sàng."
        exit 1
    }
} catch {
    Write-Host "❌ Lỗi: Không thể kết nối tới Docker Daemon." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker Daemon đang hoạt động tốt." -ForegroundColor Green

# 3. Check & Auto-create .env file if missing
if (-not (Test-Path .env)) {
    if (Test-Path .env.example) {
        Write-Host "⚠️  Chưa tìm thấy file .env. Đang tự động tạo từ .env.example..." -ForegroundColor Yellow
        Copy-Item .env.example .env
        Write-Host "✓ Đã tạo file .env thành công." -ForegroundColor Green
    } else {
        Write-Host "❌ Lỗi: Không tìm thấy cả .env lẫn .env.example." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ File .env đã tồn tại." -ForegroundColor Green
}

# 4. Check & Auto-create external network if missing
$networkExists = docker network ls --filter "name=^autoresearching-net$" -q
if (-not $networkExists) {
    Write-Host "⚠️  Chưa tìm thấy Docker network 'autoresearching-net'. Đang tự động tạo..." -ForegroundColor Yellow
    docker network create autoresearching-net
    Write-Host "✓ Đã tạo network 'autoresearching-net'." -ForegroundColor Green
} else {
    Write-Host "✓ Docker network 'autoresearching-net' đã sẵn sàng." -ForegroundColor Green
}

# 5. Check if backend container is ALREADY running
$runningContainer = docker ps --filter "name=$BeContainer" --filter "status=running" -q

if ($runningContainer) {
    Write-Host "------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "⚡ Container backend '$BeContainer' ĐANG CHẠY BÌNH THƯỜNG!" -ForegroundColor Green
    Write-Host "Không khởi tạo lại Docker để tránh xung đột hoặc gián đoạn." -ForegroundColor Yellow
    Write-Host "Backend URL : http://localhost:3001/api/v1" -ForegroundColor Cyan
    Write-Host "Tự động mở logs theo dõi Hot Reload (Nhấn Ctrl + C để thoát xem logs)..." -ForegroundColor Cyan
    Write-Host "------------------------------------------------------" -ForegroundColor Yellow
    docker compose -p $ProjectName -f $ComposeFile logs -f auto-research-be
    exit 0
}

# 6. Container is NOT running -> Proceed with build & start
Write-Host "------------------------------------------------------" -ForegroundColor Cyan
Write-Host "📦 Đang tiến hành build image và khởi động PostgreSQL + Backend..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------" -ForegroundColor Cyan

docker compose -p $ProjectName -f $ComposeFile up -d --build

# 7. Wait for PostgreSQL and Backend to be ready
Write-Host "⏳ Đang chờ PostgreSQL và Backend khởi động hoàn tất (khoảng 8-10 giây)..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 8. Push Prisma Database Schema inside container
Write-Host "🔄 Đang đồng bộ cơ sở dữ liệu Prisma (db push)..." -ForegroundColor Cyan
docker compose -p $ProjectName -f $ComposeFile exec -T auto-research-be npx prisma db push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Đồng bộ Database schema Prisma thành công!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Lưu ý: Không thể đồng bộ schema ngay lập tức. Bạn có thể chạy lại 'make db-push' sau." -ForegroundColor Yellow
}

Write-Host "======================================================" -ForegroundColor Green
Write-Host "🎉 TẤT CẢ ĐÃ SẴN SÀNG ĐỂ PHÁT TRIỂN!" -ForegroundColor Green
Write-Host "👉 Backend API URL : http://localhost:3001/api/v1" -ForegroundColor Green
Write-Host "👉 Tính năng Hot Reload đã kích hoạt theo thời gian thực." -ForegroundColor Green
Write-Host "👉 Đang mở Logs server (Nhấn Ctrl + C để thoát logs)..." -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

# 9. Follow logs
docker compose -p $ProjectName -f $ComposeFile logs -f auto-research-be
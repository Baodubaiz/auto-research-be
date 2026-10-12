param(
  [int]$Port = 3001,
  [string]$ApiPrefix = "api/v1",
  [string]$ComposeFile = "docker-compose.local.yml",
  [string]$ProjectName = "auto-research-be-local"
)

$ErrorActionPreference = "Stop"

function Assert-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

Assert-Command "docker"
Assert-Command "ngrok"

Write-Host "Starting Docker Compose services..."
docker compose -p $ProjectName -f $ComposeFile up -d --build

Write-Host ""
Write-Host "Backend local URL:"
Write-Host "  http://localhost:$Port/$ApiPrefix"
Write-Host ""
Write-Host "Starting ngrok tunnel..."
Write-Host "Public API URL will be:"
Write-Host "  https://<ngrok-domain>/$ApiPrefix"
Write-Host ""

ngrok http $Port

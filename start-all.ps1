# start-all.ps1 - MiniPaaS 1-Click Launcher (Vite Live Frontend + Docker Backend)

$ErrorActionPreference = "Stop"

# Ensure script runs from the project root directory
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$ProjectRoot\compose.yaml")) {
    $ProjectRoot = (Get-Location).Path
}
Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "       MiniPaaS System Launcher         " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Working Directory: $ProjectRoot" -ForegroundColor DarkGray

# 1. Check Docker Desktop
Write-Host "`n[1/4] Checking Docker Desktop..." -ForegroundColor Cyan
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Docker Desktop is not running! Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Docker Engine is active." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not available in PATH or not running." -ForegroundColor Red
    exit 1
}

# 2. Check or start GitHub Actions Runner
Write-Host "`n[2/4] Checking GitHub Actions Self-Hosted Runner..." -ForegroundColor Cyan
$runner = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
if ($runner) {
    Write-Host "[OK] GitHub Runner is already running (PID: $($runner.Id))." -ForegroundColor Green
} else {
    $runnerPath = "E:\actions-runner\run.cmd"
    if (Test-Path $runnerPath) {
        Write-Host "Starting runner in a new window..." -ForegroundColor Yellow
        Start-Process cmd.exe -ArgumentList "/k", "title MiniPaaS GitHub Runner && cd /d E:\actions-runner && .\run.cmd"
        Start-Sleep -Seconds 2
        Write-Host "[OK] GitHub Runner launched in background window." -ForegroundColor Green
    } else {
        Write-Host "[WARN] $runnerPath not found. Please start your runner manually." -ForegroundColor Yellow
    }
}

# 3. Start Backend via Docker Compose & Stop stale port 3000 container
Write-Host "`n[3/4] Starting Backend Container on port 5000..." -ForegroundColor Cyan
# Stop stale container on port 3000 so it doesn't serve the old build
$null = docker stop minipaas-frontend 2>&1
docker compose up -d backend
Write-Host "[OK] Backend container is active." -ForegroundColor Green

# 4. Start Vite Frontend Dev Server on port 5173
Write-Host "`n[4/4] Starting Vite Frontend on port 5173..." -ForegroundColor Cyan
$vitePort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($vitePort) {
    Write-Host "[OK] Vite Dev Server is already running on http://localhost:5173." -ForegroundColor Green
} else {
    Write-Host "Launching Vite dev server in a new window..." -ForegroundColor Yellow
    $frontendDir = Join-Path $ProjectRoot "apps\frontend"
    Start-Process cmd.exe -ArgumentList "/k", "title MiniPaaS Vite Frontend && cd /d `"$frontendDir`" && npm run dev"
    Start-Sleep -Seconds 3
    Write-Host "[OK] Vite Frontend launched." -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "[OK] MiniPaaS is ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Dashboard (Vite Live): http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API:          http://localhost:5000" -ForegroundColor White
Write-Host "Deployed User Apps:   http://localhost:8080" -ForegroundColor White

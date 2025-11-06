# Start API Server Script
Write-Host "🚀 Starting ROWDB API Server..." -ForegroundColor Green
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiServerPath = Join-Path $scriptPath "api-server"

if (-not (Test-Path $apiServerPath)) {
    Write-Host "❌ Error: api-server directory not found!" -ForegroundColor Red
    exit 1
}

# Check if .env exists
$envFile = Join-Path $apiServerPath ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Please create .env file from env.example" -ForegroundColor Yellow
    Write-Host ""
}

# Check if node_modules exists
$nodeModulesPath = Join-Path $apiServerPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    Set-Location $apiServerPath
    npm install
    Write-Host ""
}

# Start the server
Write-Host "🚀 Starting server on http://localhost:3001" -ForegroundColor Green
Write-Host ""
Set-Location $apiServerPath
npm start






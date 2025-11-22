# PowerShell script to setup Uniswap V4 Core dependency

Write-Host "Setting up Uniswap V4 Core..." -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Creating node_modules directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "node_modules\@uniswap" -Force | Out-Null
}

# Check if already installed
if (Test-Path "node_modules\@uniswap\v4-core") {
    Write-Host "Uniswap V4 Core already installed at node_modules\@uniswap\v4-core" -ForegroundColor Yellow
    Write-Host "Remove it first if you want to reinstall" -ForegroundColor Yellow
    exit 0
}

# Clone Uniswap V4 Core
Write-Host "Cloning Uniswap V4 Core from GitHub..." -ForegroundColor Cyan
Set-Location "node_modules\@uniswap"
git clone https://github.com/Uniswap/v4-core.git v4-core
Set-Location v4-core

# Install dependencies
Write-Host "Installing Uniswap V4 Core dependencies..." -ForegroundColor Cyan
npm install

# Return to contracts directory
Set-Location ..\..\..

Write-Host "✅ Uniswap V4 Core setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run compile"
Write-Host "2. Run: npm test"


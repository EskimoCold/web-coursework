# Скрипт для проверки переменных окружения DATABASE_URL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking DATABASE_URL environment variables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка системной переменной (User)
$userEnv = [Environment]::GetEnvironmentVariable("DATABASE_URL", "User")
if ($userEnv) {
    Write-Host "⚠ Found DATABASE_URL in User environment variables:" -ForegroundColor Yellow
    Write-Host "  $userEnv" -ForegroundColor Gray
    Write-Host ""
    $remove = Read-Host "Do you want to remove it? (y/n)"
    if ($remove -eq "y" -or $remove -eq "Y") {
        [Environment]::SetEnvironmentVariable("DATABASE_URL", $null, "User")
        Write-Host "✓ Removed DATABASE_URL from User environment variables" -ForegroundColor Green
        Write-Host "  You may need to restart your terminal/PowerShell for changes to take effect" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ No DATABASE_URL in User environment variables" -ForegroundColor Green
}

Write-Host ""

# Проверка системной переменной (Machine)
$machineEnv = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Machine")
if ($machineEnv) {
    Write-Host "⚠ Found DATABASE_URL in Machine (System) environment variables:" -ForegroundColor Yellow
    Write-Host "  $machineEnv" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: Removing system-wide variables requires administrator privileges" -ForegroundColor Yellow
    $remove = Read-Host "Do you want to remove it? (y/n)"
    if ($remove -eq "y" -or $remove -eq "Y") {
        try {
            [Environment]::SetEnvironmentVariable("DATABASE_URL", $null, "Machine")
            Write-Host "✓ Removed DATABASE_URL from Machine environment variables" -ForegroundColor Green
            Write-Host "  You may need to restart your terminal/PowerShell for changes to take effect" -ForegroundColor Yellow
        } catch {
            Write-Host "✗ Failed to remove. Run PowerShell as Administrator and try again." -ForegroundColor Red
        }
    }
} else {
    Write-Host "✓ No DATABASE_URL in Machine environment variables" -ForegroundColor Green
}

Write-Host ""

# Проверка переменной в текущей сессии
$sessionEnv = $env:DATABASE_URL
if ($sessionEnv) {
    Write-Host "⚠ Found DATABASE_URL in current PowerShell session:" -ForegroundColor Yellow
    Write-Host "  $sessionEnv" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To remove it from current session, run:" -ForegroundColor Cyan
    Write-Host "  Remove-Item Env:\DATABASE_URL" -ForegroundColor White
    Write-Host ""
    $remove = Read-Host "Do you want to remove it now? (y/n)"
    if ($remove -eq "y" -or $remove -eq "Y") {
        Remove-Item Env:\DATABASE_URL
        Write-Host "✓ Removed DATABASE_URL from current session" -ForegroundColor Green
    }
} else {
    Write-Host "✓ No DATABASE_URL in current PowerShell session" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking .env file" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "✓ Found .env file: $envFile" -ForegroundColor Green
    $content = Get-Content $envFile -Raw
    if ($content -match "DATABASE_URL\s*=\s*(.+)") {
        $dbUrl = $matches[1].Trim()
        Write-Host "  DATABASE_URL in .env: $dbUrl" -ForegroundColor Gray
    } else {
        Write-Host "⚠ DATABASE_URL not found in .env file" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env file not found: $envFile" -ForegroundColor Red
    Write-Host "  Create .env file in backend/ directory" -ForegroundColor Yellow
}

Write-Host ""


# Скрипт запуска бэкенда с гарантированным использованием .env файла

Write-Host "Removing DATABASE_URL from current session to use .env file..." -ForegroundColor Yellow
Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue

Write-Host "Starting backend server..." -ForegroundColor Green
Write-Host ""

# Активация виртуального окружения
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
}

# Запуск сервера
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload


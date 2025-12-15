# Скрипт для создания базы данных PostgreSQL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating PostgreSQL database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Запрос пароля
$password = Read-Host "Enter PostgreSQL password for user 'postgres'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $plainPassword

# Проверка наличия psql
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "✗ psql not found. Please add PostgreSQL bin directory to PATH." -ForegroundColor Red
    Write-Host "  Usually: C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Yellow
    exit 1
}

# Создание базы данных
Write-Host "Creating database 'finance_tracker'..." -ForegroundColor Yellow
$result = psql -U postgres -c "CREATE DATABASE finance_tracker;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Database 'finance_tracker' created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update backend/.env file with your PostgreSQL password"
    Write-Host "2. Run: cd backend; venv\Scripts\activate; uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload"
} else {
    Write-Host ""
    Write-Host "✗ Failed to create database. Possible reasons:" -ForegroundColor Red
    Write-Host "  - PostgreSQL is not installed or not running" -ForegroundColor Yellow
    Write-Host "  - Wrong password" -ForegroundColor Yellow
    Write-Host "  - Database already exists" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try creating database manually:" -ForegroundColor Cyan
    Write-Host "  psql -U postgres" -ForegroundColor White
    Write-Host "  CREATE DATABASE finance_tracker;" -ForegroundColor White
    Write-Host "  \q" -ForegroundColor White
}

# Очистка пароля из памяти
Remove-Variable password, plainPassword, BSTR -ErrorAction SilentlyContinue
$env:PGPASSWORD = ""


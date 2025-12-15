@echo off
echo ========================================
echo Creating PostgreSQL database
echo ========================================
echo.

REM Запрос пароля
set /p PGPASSWORD="Enter PostgreSQL password for user 'postgres': "

REM Создание базы данных
psql -U postgres -c "CREATE DATABASE finance_tracker;" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Database 'finance_tracker' created successfully!
    echo.
    echo Next steps:
    echo 1. Update backend/.env file with your PostgreSQL password
    echo 2. Run: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
) else (
    echo.
    echo ✗ Failed to create database. Possible reasons:
    echo   - PostgreSQL is not installed or not running
    echo   - Wrong password
    echo   - Database already exists
    echo.
    echo Try creating database manually:
    echo   psql -U postgres
    echo   CREATE DATABASE finance_tracker;
    echo   \q
)

pause


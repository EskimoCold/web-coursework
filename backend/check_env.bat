@echo off
echo ========================================
echo Checking DATABASE_URL environment variables
echo ========================================
echo.

REM Проверка переменной в текущей сессии
if defined DATABASE_URL (
    echo WARNING: Found DATABASE_URL in current session:
    echo   %DATABASE_URL%
    echo.
    echo To remove it from current session, run:
    echo   set DATABASE_URL=
    echo.
) else (
    echo OK: No DATABASE_URL in current session
)

echo.
echo ========================================
echo Checking .env file
echo ========================================
echo.

if exist .env (
    echo OK: Found .env file
    findstr /C:"DATABASE_URL" .env
) else (
    echo ERROR: .env file not found
    echo   Create .env file in backend/ directory
)

echo.
pause


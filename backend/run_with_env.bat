@echo off
echo Removing DATABASE_URL from current session to use .env file...
set DATABASE_URL=

echo Starting backend server...
echo.

REM Активация виртуального окружения
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Запуск сервера
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload


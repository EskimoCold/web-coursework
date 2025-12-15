@echo off
REM Активация виртуального окружения (если оно существует)
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Запуск сервера
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload


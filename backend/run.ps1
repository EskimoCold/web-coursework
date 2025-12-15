# Активация виртуального окружения (если оно существует)
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
}

# Запуск сервера
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload


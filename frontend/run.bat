@echo off
REM Проверка наличия node_modules
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

REM Запуск dev сервера
npm run dev


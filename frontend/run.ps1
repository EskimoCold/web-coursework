# Проверка наличия node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Запуск dev сервера
npm run dev


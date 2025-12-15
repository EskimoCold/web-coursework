# Web coursework

## Запуск бэкенда

### Способ 1: Через Docker Compose (рекомендуется)

1. Создайте файл `.env` в корне проекта со следующим содержимым:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=finance_tracker

# Backend Configuration
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/finance_tracker

# Sentry Configuration (optional)
SENTRY_DSN=
SENTRY_ENV=development
RELEASE=local
SENTRY_TRACES_SAMPLE_RATE=0.05

# Frontend Configuration
VITE_SENTRY_DSN=
VITE_ENV=development
VITE_SENTRY_ENABLED=false
VITE_GA_MEASUREMENT_ID=
VITE_API_URL=http://localhost:8000
```

2. Запустите бэкенд и базу данных:

```bash
docker-compose up db backend
```

Или запустите все сервисы (бэкенд, фронтенд и базу данных):

```bash
docker-compose up
```

Бэкенд будет доступен по адресу: http://localhost:8000
API документация: http://localhost:8000/docs

### Способ 2: Локальный запуск (без Docker)

1. **Запустите PostgreSQL:**

   **Вариант A: Только PostgreSQL через Docker (рекомендуется)**
   ```bash
   docker-compose up db -d
   ```
   Это запустит только базу данных в фоновом режиме.

   **Вариант B: Установите PostgreSQL локально**
   
   **Подробная инструкция:** См. файл [POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md)
   
   Кратко:
   1. Скачайте и установите PostgreSQL с https://www.postgresql.org/download/windows/
   2. Запомните пароль, который вы зададите для пользователя `postgres`
   3. Создайте базу данных одним из способов:
      - Запустите скрипт: `create_db.bat` (или `create_db.ps1` для PowerShell)
      - Или вручную через psql:
        ```sql
        psql -U postgres
        CREATE DATABASE finance_tracker;
        \q
        ```
   4. Обновите файл `backend/.env` с вашим паролем PostgreSQL

2. Создайте виртуальное окружение:

```bash
cd backend
python -m venv venv
```

3. Активируйте виртуальное окружение:

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

4. Установите зависимости:

```bash
pip install -r requirements.txt
```

5. Создайте файл `.env` в папке `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/finance_tracker
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=true
```

6. Запустите сервер:

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Бэкенд будет доступен по адресу: http://localhost:8000

## Запуск фронтенда

### Локальный запуск (без Docker)

1. Перейдите в папку фронтенда:

```bash
cd frontend
```

2. Установите зависимости (если еще не установлены):

```bash
npm install
```

3. Запустите dev сервер:

```bash
npm run dev
```

**Или используйте готовый скрипт:**
- Для CMD: `run.bat`
- Для PowerShell: `.\run.ps1`

Фронтенд будет доступен по адресу: http://localhost:5173

**Примечание:** Убедитесь, что бэкенд запущен и доступен по адресу, указанному в переменной окружения `VITE_API_URL` (по умолчанию `http://localhost:8000`).
# Исправление проблемы с DATABASE_URL

## Проблема

FastAPI не использует `DATABASE_URL` из `.env` файла, а берет старое значение из переменных окружения системы.

## Решение

### Шаг 1: Проверьте глобальные переменные окружения

Запустите скрипт проверки:

**PowerShell:**

```powershell
cd backend
.\check_env.ps1
```

**CMD:**

```cmd
cd backend
check_env.bat
```

Скрипт покажет:

- Есть ли `DATABASE_URL` в системных переменных (User/Machine)
- Есть ли `DATABASE_URL` в текущей сессии PowerShell/CMD
- Содержимое `.env` файла

### Шаг 2: Удалите глобальную переменную DATABASE_URL (если найдена)

#### Вариант A: Через скрипт (рекомендуется)

Скрипт `check_env.ps1` предложит удалить переменную автоматически.

#### Вариант B: Вручную через PowerShell

```powershell
# Удалить из User переменных
[Environment]::SetEnvironmentVariable("DATABASE_URL", $null, "User")

# Удалить из Machine переменных (требует прав администратора)
[Environment]::SetEnvironmentVariable("DATABASE_URL", $null, "Machine")

# Удалить из текущей сессии
Remove-Item Env:\DATABASE_URL
```

#### Вариант C: Через GUI Windows

1. Откройте "Переменные среды" (Environment Variables):
   - Нажмите `Win + R`
   - Введите `sysdm.cpl` и нажмите Enter
   - Вкладка "Дополнительно" → "Переменные среды"
2. Найдите `DATABASE_URL` в списке "Переменные пользователя" или "Системные переменные"
3. Выделите и нажмите "Удалить"

### Шаг 3: Проверьте .env файл

Убедитесь, что файл `backend/.env` существует и содержит правильное значение:

```env
DATABASE_URL=postgresql+asyncpg://postgres:314159@127.0.0.1:5432/finance_tracker
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=true
```

**Важно:**

- Файл должен называться `.env` (с точкой в начале)
- Файл должен быть в папке `backend/`
- Не должно быть пробелов вокруг `=`
- Значение не должно быть в кавычках

### Шаг 4: Перезапустите терминал

После удаления глобальной переменной окружения:

1. Закройте текущий терминал/PowerShell
2. Откройте новый терминал
3. Перейдите в папку `backend/`

### Шаг 5: Запустите приложение

```cmd
cd backend
venv\Scripts\activate
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

При запуске вы должны увидеть в логах:

```
Application Configuration:
  DATABASE_URL: postgresql+asyncpg://postgres:314159@127.0.0.1:5432/finance_tracker
  Debug mode: True
```

### Шаг 6: Проверка

Если все правильно настроено, вы увидите:

```
✓ Database connection established and tables created
```

## Что было исправлено в коде

1. **Исправлен путь к .env файлу** в `config.py`:
   - Теперь `.env` ищется относительно расположения `config.py`
   - Путь: `backend/.env`

2. **Добавлено логирование**:
   - При запуске приложения выводится загруженное значение `DATABASE_URL`
   - Это помогает отладить проблему

## Приоритет чтения переменных (pydantic-settings)

Pydantic Settings читает переменные в следующем порядке приоритета:

1. **Переменные окружения системы** (высший приоритет)
2. **Файл .env**
3. **Значения по умолчанию в коде**

Поэтому, если `DATABASE_URL` установлена в системе, она будет использоваться вместо значения из `.env`.

## Альтернативное решение: Использовать только .env

Если вы хотите, чтобы `.env` всегда имел приоритет, можно временно удалить переменную из текущей сессии перед запуском:

```powershell
# Удалить из текущей сессии
Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue

# Запустить приложение
cd backend
venv\Scripts\activate
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Или создать скрипт запуска:

```powershell
# run_with_env.ps1
Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
cd backend
venv\Scripts\activate
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

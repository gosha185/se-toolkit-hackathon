# 🐳 Запуск через Docker

## Быстрый старт

### 1. Установка Docker

**Windows:**
- Скачайте [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Установите и перезагрузите компьютер

**Linux (Ubuntu/Debian):**
```bash
# Установка
sudo apt update
sudo apt install -y docker.io docker-compose

# Запуск
sudo systemctl start docker
sudo systemctl enable docker

# Добавление пользователя в группу docker (опционально)
sudo usermod -aG docker $USER
```

**macOS:**
- Скачайте [Docker Desktop для Mac](https://www.docker.com/products/docker-desktop/)

---

### 2. Настройка

Создайте файл `.env` в корневой директории:

```env
# Секретный ключ для JWT (обязательно измените!)
JWT_SECRET=my-super-secret-key-change-this

# Qwen API ключ (опционально, для AI агента)
QWEN_API_KEY=sk-your-qwen-api-key

# Настройки Qwen (опционально)
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
```

**Генерация безопасного JWT ключа:**
```bash
# Linux/macOS
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

### 3. Запуск

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Проверка статуса
docker-compose ps
```

---

### 4. Доступ к приложению

Откройте браузер:
- **http://localhost:5000**

---

### 5. Остановка

```bash
# Остановка
docker-compose down

# Остановка с удалением данных БД
docker-compose down -v
```

---

## Обновление приложения

```bash
# Остановка
docker-compose down

# Пересборка образа
docker-compose build --no-cache

# Запуск
docker-compose up -d
```

---

## Полезные команды

```bash
# Логи контейнера
docker-compose logs -f app

# Подключение к контейнеру (bash)
docker exec -it decision-maker sh

# Перезапуск
docker-compose restart

# Пересборка без кэша
docker-compose build --no-cache

# Просмотр статуса
docker-compose ps

# Остановка и удаление
docker-compose down

# Обновление (pull + build + up)
docker-compose pull
docker-compose up -d --build
```

---

## Настройка порта

Если порт 5000 занят, измените в `docker-compose.yml`:

```yaml
ports:
  - "8080:5000"  # Внешний порт 8080 -> внутренний 5000
```

---

## Сохранение базы данных

База данных хранится в Docker volume `db-data`. Данные сохраняются между перезапусками.

**Бэкап:**
```bash
docker run --rm \
  -v decision-maker_db-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz /data
```

**Восстановление:**
```bash
docker run --rm \
  -v decision-maker_db-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/db-backup.tar.gz -C /
```

---

## Docker без docker-compose

**Сборка образа:**
```bash
docker build -t decision-maker .
```

**Запуск:**
```bash
docker run -d \
  --name decision-maker \
  -p 5000:5000 \
  --env-file .env \
  -v db-data:/app/data \
  decision-maker
```

**Остановка:**
```bash
docker stop decision-maker
docker rm decision-maker
```

---

## Запуск на удалённом сервере (VPS/VM)

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Клонирование репозитория
git clone <repo-url> ~/decision-maker
cd ~/decision-maker

# Настройка .env
nano .env

# Запуск
docker-compose up -d

# Автозапуск
docker-compose restart
```

---

## Troubleshooting

### Контейнер не запускается
```bash
# Проверка логов
docker-compose logs app

# Пересборка
docker-compose build --no-cache
docker-compose up -d
```

### Порт занят
```bash
# Проверка (Linux)
sudo lsof -i :5000

# Проверка (Windows)
netstat -ano | findstr :5000

# Измените порт в docker-compose.yml
```

### Нет доступа к API
```bash
# Проверка контейнера
docker exec decision-maker wget -qO- http://localhost:5000/api/auth/me

# Проверка .env
docker exec decision-maker env | grep JWT
```

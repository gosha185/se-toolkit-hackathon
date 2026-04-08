FROM node:20-alpine

# Установка зависимостей для сборки
RUN apk add --no-cache python3 make g++

# Рабочая директория
WORKDIR /app

# Копирование package.json
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Установка зависимостей
RUN npm install --production

# Установка зависимостей фронтенда и сборка
RUN cd frontend && npm install && npm run build

# Копирование остального кода
COPY . .

# Создание директории для базы данных
RUN mkdir -p /app/data

# Переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=/app/data/database.sqlite

EXPOSE 5000

# Запуск сервера
CMD ["node", "backend/server.js"]

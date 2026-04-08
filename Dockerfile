FROM node:20-alpine AS frontend-build

RUN apk add --no-cache python3 make g++

WORKDIR /app/frontend

COPY frontend/package*.json ./

# Установка всех зависимостей (включая devDependencies для сборки)
RUN npm install

COPY frontend/ ./

# Сборка фронтенда
RUN npm run build

# Production этап
FROM node:20-alpine

WORKDIR /app

# Копирование package.json и установка production зависимостей
COPY package*.json ./
RUN npm install --production

# Копирование собранного фронтенда
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Копирование бэкенда
COPY backend/ ./backend/

# Создание директории для базы данных
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=/app/data/database.sqlite

EXPOSE 5000

CMD ["node", "backend/server.js"]

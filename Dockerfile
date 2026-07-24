# ==========================================
# Этап 1: Сборка всего проекта (Builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Копируем манифесты зависимостей
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 2. Устанавливаем ВСЕ зависимости монорепозитория
RUN npm ci

# 3. Копируем исходный код
COPY shared/ ./shared/
COPY client/ ./client/
COPY server/ ./server/

# 4. Собираем все части в правильном порядке
RUN npm --workspace=@game/shared run build
RUN npm --workspace=server run build
RUN npm --workspace=game-client run build

# ==========================================
# Этап 2: Продакшн-образ (Nginx + Node + Supervisor)
# ==========================================
FROM node:20-alpine

# Устанавливаем Nginx и Supervisor для одновременного запуска процессов
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Копируем конфиги и исходники сервера/shared для запуска
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Копируем собранные дистрибутивы
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma

# Устанавливаем продакшн-зависимости и генерируем Prisma Client
RUN npm ci --omit=dev
RUN npm --workspace=server run prisma:generate

# Копируем билд клиента в директорию Nginx
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Настраиваем Supervisor
RUN echo $'[supervisord]\n\
nodaemon=true\n\
\n\
[program:server]\n\
directory=/app/server\n\
command=npm start\n\
autorestart=true\n\
\n\
[program:nginx]\n\
command=nginx -g "daemon off;"\n\
autorestart=true\n\
' > /etc/supervisord.conf

EXPOSE 80 3000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
# Используем аргумент для версии Node.js
ARG NODE_VERSION=20.10.0

# Первый этап: установка зависимостей
FROM node:${NODE_VERSION} AS installer

WORKDIR /app

# Копируем необходимые файлы для установки зависимостей
COPY package*.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --production

# Второй этап: сборка и настройка образа
FROM node:${NODE_VERSION}

# Установка необходимых пакетов
RUN apt update && \
    apt install --yes iptables iproute2 wireguard-tools && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем зависимости из первого этапа
COPY --from=installer /app /app

# Копируем остальные файлы проекта
COPY . .

# Сборка проекта
RUN yarn build

# Экспонируем порты
EXPOSE 3232
EXPOSE 8181

# Определяем команду запуска контейнера
CMD ["yarn", "server"]

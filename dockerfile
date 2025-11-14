# # 1. Базовий образ з Node.js 20 для більшої сумісності (Debian-based)
# FROM node:22 AS builder

# ENV IS_DOCKER=true
# # RUN pnpm dlx puppeteer browsers install chrome


# # Встановлюємо Chromium + необхідні бібліотеки
# RUN apt-get update && apt-get install -y \
#     chromium \
#     ca-certificates \
#     fonts-liberation \
#     libatk1.0-0 \
#     libatk-bridge2.0-0 \
#     libcups2 \
#     libdrm2 \
#     libxkbcommon0 \
#     libxcomposite1 \
#     libxdamage1 \
#     libxrandr2 \
#     libgbm1 \
#     libasound2 \
#     libpangocairo-1.0-0 \
#     libpango-1.0-0 \
#     libgtk-3-0 \
#     libnspr4 \
#     libnss3 \
#     libxss1 \
#     libxtst6 \
#     xdg-utils \
#     --no-install-recommends && \
#     rm -rf /var/lib/apt/lists/*

# # 2. Встановлюємо pnpm глобально
# # RUN npm install -g pnpm
# RUN corepack enable && corepack prepare pnpm@latest --activate


# # 3. Встановлюємо робочу директорію
# WORKDIR /app

# # 4. Копіюємо package.json і pnpm-lock.yaml (якщо є)
# COPY package.json pnpm-lock.yaml* ./


# # Очищаємо кеш pnpm, щоб уникнути проблем з залежностями
# RUN pnpm store prune 

# # 5. Встановлюємо залежності
# RUN pnpm install --frozen-lockfile
# RUN pnpm dlx puppeteer browsers install chrome


# # 6. Завантажуємо кастомний Chromium, який ти використовуєш у коді
# RUN wget https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar && \
#     tar -xf chromium-v121.0.0-pack.tar -C /usr/local/bin && \
#     rm chromium-v121.0.0-pack.tar

# # 7. Копіюємо весь код у контейнер
# COPY . .

# # 8. Робимо збірку Next.js (production build)
# RUN pnpm build

# # ---------------

# # 9. Другий етап — створення мінімального production образу
# FROM node:22 AS runner

# ENV IS_DOCKER=true

# # Встановлюємо Chromium + необхідні бібліотеки
# RUN apt-get update && apt-get install -y \
#     chromium \
#     ca-certificates \
#     fonts-liberation \
#     libatk1.0-0 \
#     libatk-bridge2.0-0 \
#     libcups2 \
#     libdrm2 \
#     libxkbcommon0 \
#     libxcomposite1 \
#     libxdamage1 \
#     libxrandr2 \
#     libgbm1 \
#     libasound2 \
#     libpangocairo-1.0-0 \
#     libpango-1.0-0 \
#     libgtk-3-0 \
#     libnspr4 \
#     libnss3 \
#     libxss1 \
#     libxtst6 \
#     xdg-utils \
#     --no-install-recommends && \
#     rm -rf /var/lib/apt/lists/*

# WORKDIR /app

# # 10. Встановлюємо pnpm (можна не ставити, якщо не потрібен у runtime)
# # RUN npm install -g pnpm
# RUN corepack enable && corepack prepare pnpm@latest --activate

# # 11. Копіюємо залежності production
# COPY --from=builder /app/node_modules ./node_modules

# # 12. Копіюємо збірку і все необхідне
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/next.config.ts ./next.config.ts

# # 13. Копіюємо кастомний Chromium
# COPY --from=builder /usr/local/bin /usr/local/bin

# # 14. Виставляємо порт (Next.js дефолтний порт 3000)
# EXPOSE 3000

# # 15. Запускаємо сервер Next.js у production режимі
# CMD ["pnpm","start"]



# #Команди для перевірки локально - має бути запущений Docker Desktop на комп'ютері
# # docker build -t parser-m .
# # docker build --no-cache -t parser-m .
# # docker run -p 3000:3000 parser-m


# 1. Базовий образ, що має Chrome + потрібні залежності  
FROM ghcr.io/puppeteer/puppeteer:22.13.0

WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package.json package-lock.json ./

# Інсталяція залежностей через npm
RUN npm install

# Копіюємо решту файлів
COPY . .

# Збірка Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]


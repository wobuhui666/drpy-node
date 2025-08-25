# ---------- builder ----------
FROM node:22-alpine AS builder

RUN corepack enable
RUN apk add --no-cache git

WORKDIR /app
RUN git clone https://github.com/hjdhnx/drpy-node.git .

# 可选：国内源
# RUN npm config set registry https://registry.npmmirror.com

# 构建时安装依赖
RUN yarn install --non-interactive && yarn add puppeteer

# （可选）Alpine 下给 Puppeteer 装系统 chromium，更稳
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ---------- runner ----------
FROM node:22-alpine AS runner

WORKDIR /app

# 运行时需要 chromium（若上面用了系统 chromium）
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 这里也要装一次 pm2（全局可执行）
RUN npm install -g pm2

# 把构建好的内容复制过来
COPY --from=builder /app /app

EXPOSE 5757
CMD ["pm2-runtime", "index.js"]

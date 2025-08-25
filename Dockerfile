# 构建器阶段
FROM node:22-alpine AS builder

# 确保 yarn 可用（Node 22 自带 corepack）
RUN corepack enable

# 安装 git
RUN apk add --no-cache git

# 如确有需要才保留这个设置
RUN git config --global http.version HTTP/1.1

# 工作目录
WORKDIR /app

# 克隆仓库
RUN git clone https://github.com/hjdhnx/drpy-node.git .

# 使用中国镜像（可按需保留）
# RUN npm config set registry https://registry.npmmirror.com

# 全局安装 pm2
RUN npm install -g pm2

# （可选）使用系统 Chromium，Puppeteer 跑得更稳
# 注：如果你希望 Puppeteer 自己下载 Chrome，可以删除这些行
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 安装项目依赖并安装 puppeteer
# 若仓库没有 lockfile，yarn 会正常安装
RUN yarn install --non-interactive && yarn add puppeteer

# 复制到临时目录（保留你的做法）
RUN mkdir -p /tmp/drpys && cp -r /app/* /tmp/drpys/

# 运行器阶段（也用 Node 22，以便可用 pm2 / Node API）
FROM node:22-alpine AS runner

# 工作目录
WORKDIR /app

# 如果在 builder 装了系统 Chromium，这里也要装（运行时需要）
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 复制构建产物
COPY --from=builder /tmp/drpys /app

# 暴露端口
EXPOSE 5757

# 用 pm2 更稳（单进程则改成 ["node","index.js"]）
CMD ["pm2-runtime", "index.js"]

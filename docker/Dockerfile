# ---- 构建阶段 ----
FROM node:22-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY ../package.json package-lock.json ./

# 安装所有依赖（包括 devDependencies，构建需要）
RUN npm ci

# 复制源码和配置
COPY ../src ./src/
COPY ../public ./public/
COPY ../tsconfig.json tsconfig.server.json vite.config.ts ./
COPY ../wrangler.jsonc ./
# vite.config.ts 中 configPath 硬编码为 wrangler.test.jsonc，构建时用 wrangler.jsonc 代替
RUN cp wrangler.jsonc wrangler.test.jsonc

# 1. 构建前端 SSR 产物（vite build → dist/index.js + dist/assets/）
RUN npm run build

# 2. 编译 server.ts → dist-server/（Node.js 运行入口）
RUN npm run build:server

# ---- 运行阶段 ----
FROM node:22-alpine AS runner

WORKDIR /app

# 只安装生产依赖（包含 better-sqlite3、@hono/node-server）
COPY ../package.json package-lock.json ./
RUN npm ci --omit=dev

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# 复制 schema（数据库初始化）
COPY ../schema/schema.sql ./

# 复制启动脚本
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# 数据库持久化目录
VOLUME ["/data"]

EXPOSE 8787

ENTRYPOINT ["/bin/sh", "entrypoint.sh"]

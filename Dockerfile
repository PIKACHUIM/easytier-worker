# ---- 构建阶段 ----
FROM node:22-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./

# 安装所有依赖（包括 devDependencies，构建需要）
RUN npm ci

# 复制源码
COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json vite.config.ts ./
# 复制 wrangler 配置（运行时会挂载覆盖）
COPY wrangler.jsonc ./
# vite.config.ts 中 configPath 硬编码为 wrangler.test.jsonc，构建时用 wrangler.jsonc 代替
RUN cp wrangler.jsonc wrangler.test.jsonc

# 构建前端资产
RUN npm run build

# ---- 运行阶段 ----
FROM node:22-alpine AS runner

WORKDIR /app

# 只安装生产依赖 + wrangler（运行时需要）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    npm install -g wrangler

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/wrangler.jsonc ./wrangler.jsonc

# 复制 schema（数据库初始化可能需要）
COPY schema.sql ./

# 复制启动脚本
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 8787

# entrypoint 自动生成/读取 JWT_SECRET，再启动 wrangler dev --local
ENTRYPOINT ["/bin/sh", "entrypoint.sh"]

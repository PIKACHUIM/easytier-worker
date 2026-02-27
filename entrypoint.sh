#!/bin/sh
set -e

SECRETS_FILE="/secrets/jwt_secret"

# 若外部未传入 JWT_SECRET，则从持久化文件读取或随机生成
if [ -z "$JWT_SECRET" ]; then
    if [ -f "$SECRETS_FILE" ]; then
        JWT_SECRET=$(cat "$SECRETS_FILE")
        echo "[entrypoint] 从持久化文件读取 JWT_SECRET"
    else
        # 随机生成 32 字节 hex 字符串
        JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 64)
        echo "[entrypoint] 随机生成 JWT_SECRET"
    fi
fi

# 持久化到共享 volume（供 monitor 读取）
mkdir -p /secrets
echo -n "$JWT_SECRET" > "$SECRETS_FILE"
echo "[entrypoint] JWT_SECRET 已写入 $SECRETS_FILE"

# 导出供 wrangler 读取
export JWT_SECRET

exec wrangler dev --port 8787 --host 0.0.0.0 --local

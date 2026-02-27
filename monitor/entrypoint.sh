#!/bin/sh
set -e

SECRETS_FILE="/secrets/jwt_secret"

# 等待 app 写入 JWT_SECRET（最多等 60 秒）
echo "[monitor-entrypoint] 等待 JWT_SECRET 就绪..."
WAIT=0
while [ ! -f "$SECRETS_FILE" ]; do
    if [ $WAIT -ge 60 ]; then
        echo "[monitor-entrypoint] 超时：未找到 $SECRETS_FILE，退出"
        exit 1
    fi
    sleep 1
    WAIT=$((WAIT + 1))
done

JWT_SECRET=$(cat "$SECRETS_FILE")
echo "[monitor-entrypoint] 读取 JWT_SECRET 成功"

# 用 Python 生成 HS256 JWT token（monitor 角色，永不过期）
# 注意：后端使用标准 btoa/atob（非 URL-safe base64），需保持一致
JWT_TOKEN=$(python3 - <<EOF
import hmac, hashlib, base64, json, time

secret = "$JWT_SECRET"
header = base64.b64encode(json.dumps({"alg":"HS256","typ":"JWT"}, separators=(',',':')).encode()).decode()
payload = base64.b64encode(json.dumps({"role":"monitor","iat":int(time.time())}, separators=(',',':')).encode()).decode()
data = f"{header}.{payload}"
sig = hmac.new(secret.encode(), data.encode(), hashlib.sha256).digest()
sig_b64 = base64.b64encode(sig).decode()
print(f"{data}.{sig_b64}")
EOF
)

echo "[monitor-entrypoint] JWT token 生成成功"

exec python monitor.py "${API_URL}" "${JWT_TOKEN}" --log-level "${LOG_LEVEL:-INFO}"

FROM python:3.11-slim

WORKDIR /monitor

# 安装依赖
RUN pip install --no-cache-dir requests

# 复制 monitor 目录内容
COPY monitor.py ./
# checker 是 Linux 可执行文件，需要在构建时提供
# 如果存在则复制，否则运行时通过 volume 挂载
COPY checker* ./

# 确保 checker 有执行权限（如果存在）
RUN chmod +x checker 2>/dev/null || true

# API_URL 和 JWT_TOKEN 通过环境变量传入
ENV API_URL=""
ENV JWT_TOKEN=""
ENV LOG_LEVEL="INFO"

CMD ["sh", "-c", "python monitor.py \"${API_URL}\" \"${JWT_TOKEN}\" --log-level \"${LOG_LEVEL}\""]

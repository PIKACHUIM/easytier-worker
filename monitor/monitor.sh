#!/bin/bash
# EasyTier Monitor 启动脚本 (Linux/Mac)

echo "========================================"
echo "EasyTier 节点监控程序"
echo "========================================"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo "错误: 缺少 API_URL 参数"
    echo ""
    echo "使用方法: ./start_monitor.sh <API_URL> <JWT_TOKEN> [LOG_LEVEL]"
    echo ""
    echo "示例: ./start_monitor.sh https://api.example.com your_jwt_token INFO"
    echo ""
    exit 1
fi

if [ -z "$2" ]; then
    echo "错误: 缺少 JWT_TOKEN 参数"
    echo ""
    echo "使用方法: ./start_monitor.sh <API_URL> <JWT_TOKEN> [LOG_LEVEL]"
    echo ""
    echo "示例: ./start_monitor.sh https://api.example.com your_jwt_token INFO"
    echo ""
    exit 1
fi

API_URL="$1"
JWT_TOKEN="$2"
LOG_LEVEL="${3:-INFO}"

echo "API地址: $API_URL"
echo "日志级别: $LOG_LEVEL"
echo ""
echo "正在启动监控程序..."
echo ""

# 检查 Python 版本
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "错误: 未找到 Python"
    exit 1
fi

# 启动 Monitor
$PYTHON_CMD Monitor.py "$API_URL" "$JWT_TOKEN" --log-level "$LOG_LEVEL"

if [ $? -ne 0 ]; then
    echo ""
    echo "程序异常退出"
    exit 1
fi

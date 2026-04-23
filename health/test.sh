#!/bin/bash

# 测试脚本

set -e

# 配置测试参数
SERVER="${1:-tcp://192.168.1.1:11010}"
NETWORK="${2:-TestNetwork}"
PASSWORD="${3:-TestPassword}"

echo "========================================"
echo "EasyTier 健康检查 CLI 工具测试"
echo "========================================"
echo "服务器: $SERVER"
echo "网络名称: $NETWORK"
echo "网络密码: $PASSWORD"
echo "========================================"
echo ""

# 检查二进制文件是否存在
if [ ! -f "target/release/health-check" ]; then
    echo "错误: 未找到编译后的二进制文件"
    echo "请先运行: ./build.sh"
    exit 1
fi

echo "测试 1: 基本健康检查（30秒超时）"
echo "命令: ./target/release/health-check -s $SERVER -n $NETWORK -p $PASSWORD"
echo ""
./target/release/health-check -s "$SERVER" -n "$NETWORK" -p "$PASSWORD"
exit_code=$?
echo ""
echo "退出码: $exit_code"
echo ""

echo "========================================"
echo "测试 2: 详细日志模式"
echo "命令: ./target/release/health-check -s $SERVER -n $NETWORK -p $PASSWORD -v"
echo ""
./target/release/health-check -s "$SERVER" -n "$NETWORK" -p "$PASSWORD" -v
exit_code=$?
echo ""
echo "退出码: $exit_code"
echo ""

echo "========================================"
echo "测试 3: 短超时时间（10秒）"
echo "命令: ./target/release/health-check -s $SERVER -n $NETWORK -p $PASSWORD -t 10"
echo ""
./target/release/health-check -s "$SERVER" -n "$NETWORK" -p "$PASSWORD" -t 10
exit_code=$?
echo ""
echo "退出码: $exit_code"
echo ""

echo "========================================"
echo "测试完成！"
echo "========================================"

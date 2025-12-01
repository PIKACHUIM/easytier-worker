#!/bin/bash

# 构建脚本 - Linux/macOS

set -e

echo "开始编译 EasyTier 健康检查 CLI 工具..."

# 进入项目目录
cd "$(dirname "$0")"

# 编译 release 版本
cargo build --release

echo ""
echo "编译完成！"
echo "二进制文件位置: target/release/health-check"
echo ""
echo "使用示例:"
echo "  ./target/release/health-check -s tcp://192.168.1.1:11010 -n MyNetwork -p MyPassword"
echo ""

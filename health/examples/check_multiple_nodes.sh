#!/bin/bash

# EasyTier 健康检查示例脚本
# 此脚本演示如何使用 health-check 工具检查多个节点

# 配置节点列表
declare -A NODES=(
    ["节点1"]="tcp://192.168.1.1:11010|MyNetwork|MyPassword"
    ["节点2"]="tcp://192.168.1.100:11010|TestNetwork|TestPassword"
    ["节点3"]="wg://example.com:11011|ProdNetwork|ProdPassword"
)

# 健康检查工具路径
HEALTH_CHECK="./target/release/health-check"

# 检查工具是否存在
if [ ! -f "$HEALTH_CHECK" ]; then
    echo "错误: 未找到 health-check 工具"
    echo "请先运行: ./build.sh"
    exit 1
fi

echo "========================================"
echo "EasyTier 节点健康检查"
echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# 统计
total=0
online=0
offline=0

# 遍历所有节点
for node_name in "${!NODES[@]}"; do
    total=$((total + 1))
    
    # 解析配置
    IFS='|' read -r server network password <<< "${NODES[$node_name]}"
    
    echo "检查节点: $node_name"
    echo "  服务器: $server"
    echo "  网络: $network"
    
    # 执行健康检查
    result=$($HEALTH_CHECK -s "$server" -n "$network" -p "$password" 2>/dev/null)
    exit_code=$?
    
    # 解析结果
    read -r is_online conn_count _ _ _ <<< "$result"
    
    if [ $exit_code -eq 0 ] && [ "$is_online" -eq 1 ]; then
        echo "  状态: ✓ 在线"
        echo "  连接数: $conn_count"
        online=$((online + 1))
    else
        echo "  状态: ✗ 离线"
        offline=$((offline + 1))
    fi
    
    echo ""
done

echo "========================================"
echo "检查完成"
echo "总节点数: $total"
echo "在线: $online"
echo "离线: $offline"
echo "========================================"

# 返回状态码
if [ $offline -gt 0 ]; then
    exit 1
else
    exit 0
fi

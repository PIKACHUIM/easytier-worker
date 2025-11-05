#!/usr/bin/env python3
"""
EasyTier 客户端查询脚本示例

此脚本演示如何查询可用的 EasyTier 节点。

使用方法:
    python3 client_query.py --api-url https://your-domain.workers.dev --region domestic --priority traffic

依赖:
    pip install requests
"""

import argparse
import json
import sys
import requests


class EasyTierClient:
    def __init__(self, api_url: str):
        """
        初始化客户端
        
        Args:
            api_url: API 基础 URL
        """
        self.api_url = api_url.rstrip('/')
    
    def query_nodes(self, region: str = 'all', priority: str = 'traffic', relay_only: bool = False) -> list:
        """
        查询可用节点
        
        Args:
            region: 地域筛选（domestic/overseas/all）
            priority: 优先级（traffic/bandwidth/latency）
            relay_only: 是否只查询支持中转的节点
        
        Returns:
            节点列表
        """
        data = {
            'region': region,
            'priority': priority,
            'relay_only': relay_only
        }
        
        print(f"查询参数: {json.dumps(data, indent=2)}")
        
        try:
            response = requests.post(
                f'{self.api_url}/api/query',
                json=data,
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            return result.get('nodes', [])
        except requests.exceptions.RequestException as e:
            print(f"查询失败: {e}", file=sys.stderr)
            raise
    
    def get_public_nodes(self) -> list:
        """
        获取所有公开节点
        
        Returns:
            节点列表
        """
        try:
            response = requests.get(
                f'{self.api_url}/api/public',
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            return result.get('nodes', [])
        except requests.exceptions.RequestException as e:
            print(f"获取公开节点失败: {e}", file=sys.stderr)
            raise
    
    def get_stats(self) -> dict:
        """
        获取统计信息
        
        Returns:
            统计信息
        """
        try:
            response = requests.get(
                f'{self.api_url}/api/stats',
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"获取统计信息失败: {e}", file=sys.stderr)
            raise
    
    def print_node(self, node: dict):
        """
        打印节点信息
        
        Args:
            node: 节点数据
        """
        print(f"\n{'='*60}")
        print(f"节点名称: {node['node_name']}")
        print(f"节点 ID: {node['id']}")
        print(f"地域: {node['region_type']} - {node['region_detail']}")
        print(f"状态: {node.get('status', 'unknown')}")
        
        print(f"\n连接方式:")
        for conn in node.get('connections', []):
            print(f"  - {conn['type']}: {conn['ip']}:{conn['port']}")
        
        print(f"\n带宽信息:")
        print(f"  当前带宽: {node.get('current_bandwidth', 0):.2f} Mbps")
        print(f"  阶梯带宽: {node.get('tier_bandwidth', 0):.2f} Mbps")
        
        print(f"\n流量信息:")
        print(f"  已用流量: {node.get('used_traffic', 0):.2f} GB")
        print(f"  最大流量: {node.get('max_traffic', 0):.2f} GB")
        traffic_percent = (node.get('used_traffic', 0) / node.get('max_traffic', 1)) * 100
        print(f"  使用率: {traffic_percent:.1f}%")
        
        print(f"\n连接信息:")
        print(f"  当前连接数: {node.get('connection_count', 0)}")
        print(f"  最大连接数: {node.get('max_connections', 0)}")
        
        print(f"\n其他信息:")
        print(f"  允许中转: {'是' if node.get('allow_relay') else '否'}")
        if node.get('tags'):
            print(f"  标签: {node['tags']}")
        
        print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(description='EasyTier 客户端查询脚本')
    parser.add_argument('--api-url', type=str, required=True, help='API 基础 URL')
    
    subparsers = parser.add_subparsers(dest='command', help='命令')
    
    # 查询节点命令
    query_parser = subparsers.add_parser('query', help='查询可用节点')
    query_parser.add_argument('--region', type=str, default='all', 
                             choices=['domestic', 'overseas', 'all'],
                             help='地域筛选')
    query_parser.add_argument('--priority', type=str, default='traffic',
                             choices=['traffic', 'bandwidth', 'latency'],
                             help='优先级')
    query_parser.add_argument('--relay-only', action='store_true',
                             help='只查询支持中转的节点')
    
    # 获取公开节点命令
    subparsers.add_parser('public', help='获取所有公开节点')
    
    # 获取统计信息命令
    subparsers.add_parser('stats', help='获取统计信息')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    client = EasyTierClient(args.api_url)
    
    try:
        if args.command == 'query':
            nodes = client.query_nodes(
                region=args.region,
                priority=args.priority,
                relay_only=args.relay_only
            )
            
            if not nodes:
                print("没有找到符合条件的节点")
                sys.exit(0)
            
            print(f"\n找到 {len(nodes)} 个节点:")
            for node in nodes:
                client.print_node(node)
        
        elif args.command == 'public':
            nodes = client.get_public_nodes()
            
            if not nodes:
                print("没有公开节点")
                sys.exit(0)
            
            print(f"\n共有 {len(nodes)} 个公开节点:")
            for node in nodes:
                client.print_node(node)
        
        elif args.command == 'stats':
            stats = client.get_stats()
            
            print("\n系统统计信息:")
            print(f"{'='*60}")
            print(f"总节点数: {stats['total_nodes']}")
            print(f"在线节点数: {stats['online_nodes']}")
            print(f"国内节点数: {stats['domestic_nodes']}")
            print(f"海外节点数: {stats['overseas_nodes']}")
            print(f"总带宽: {stats['total_bandwidth']:.2f} Mbps")
            print(f"{'='*60}")
    
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

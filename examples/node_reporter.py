#!/usr/bin/env python3
"""
EasyTier 节点上报脚本示例

此脚本演示如何定期向 EasyTier 管理系统上报节点状态。
建议使用 cron 或 systemd timer 定期执行（每 10 分钟）。

使用方法:
    python3 node_reporter.py --node-id 1 --api-url https://your-domain.workers.dev

依赖:
    pip install requests psutil
"""

import argparse
import json
import time
import sys
import psutil
import requests


class NodeReporter:
    def __init__(self, node_id: int, api_url: str):
        """
        初始化节点上报器
        
        Args:
            node_id: 节点 ID
            api_url: API 基础 URL
        """
        self.node_id = node_id
        self.api_url = api_url.rstrip('/')
        self.last_traffic = 0
        self.traffic_file = f'/tmp/easytier_node_{node_id}_traffic.txt'
        
        # 尝试加载上次的流量数据
        try:
            with open(self.traffic_file, 'r') as f:
                self.last_traffic = float(f.read().strip())
        except:
            pass
    
    def get_network_traffic(self) -> float:
        """
        获取网络流量（GB）
        
        Returns:
            当前总流量（GB）
        """
        net_io = psutil.net_io_counters()
        # 发送 + 接收流量，转换为 GB
        total_bytes = net_io.bytes_sent + net_io.bytes_recv
        return total_bytes / (1024 ** 3)
    
    def get_bandwidth(self) -> float:
        """
        获取当前带宽使用（Mbps）
        
        Returns:
            当前带宽（Mbps）
        """
        # 测量 1 秒内的流量变化
        net_io_1 = psutil.net_io_counters()
        time.sleep(1)
        net_io_2 = psutil.net_io_counters()
        
        bytes_sent = net_io_2.bytes_sent - net_io_1.bytes_sent
        bytes_recv = net_io_2.bytes_recv - net_io_1.bytes_recv
        
        # 转换为 Mbps
        bandwidth = (bytes_sent + bytes_recv) * 8 / (1024 ** 2)
        return bandwidth
    
    def get_connection_count(self) -> int:
        """
        获取当前连接数
        
        Returns:
            连接数
        """
        connections = psutil.net_connections(kind='inet')
        # 只统计 ESTABLISHED 状态的连接
        return len([c for c in connections if c.status == 'ESTABLISHED'])
    
    def check_status(self) -> str:
        """
        检查节点状态
        
        Returns:
            'online' 或 'offline'
        """
        # 简单检查：如果 CPU 使用率 > 0，认为在线
        cpu_percent = psutil.cpu_percent(interval=1)
        return 'online' if cpu_percent >= 0 else 'offline'
    
    def report(self) -> dict:
        """
        上报节点状态
        
        Returns:
            API 响应
        """
        # 获取当前数据
        current_traffic = self.get_network_traffic()
        reported_traffic = max(0, current_traffic - self.last_traffic)
        current_bandwidth = self.get_bandwidth()
        connection_count = self.get_connection_count()
        status = self.check_status()
        
        # 构建上报数据
        data = {
            'node_id': self.node_id,
            'current_bandwidth': round(current_bandwidth, 2),
            'reported_traffic': round(reported_traffic, 2),
            'connection_count': connection_count,
            'status': status
        }
        
        print(f"上报数据: {json.dumps(data, indent=2)}")
        
        # 发送请求
        try:
            response = requests.post(
                f'{self.api_url}/api/report',
                json=data,
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            print(f"上报成功: {json.dumps(result, indent=2)}")
            
            # 保存当前流量
            self.last_traffic = current_traffic
            with open(self.traffic_file, 'w') as f:
                f.write(str(current_traffic))
            
            return result
        except requests.exceptions.RequestException as e:
            print(f"上报失败: {e}", file=sys.stderr)
            raise


def main():
    parser = argparse.ArgumentParser(description='EasyTier 节点上报脚本')
    parser.add_argument('--node-id', type=int, required=True, help='节点 ID')
    parser.add_argument('--api-url', type=str, required=True, help='API 基础 URL')
    parser.add_argument('--interval', type=int, default=0, help='上报间隔（秒），0 表示只上报一次')
    
    args = parser.parse_args()
    
    reporter = NodeReporter(args.node_id, args.api_url)
    
    if args.interval > 0:
        print(f"开始定期上报，间隔 {args.interval} 秒")
        while True:
            try:
                reporter.report()
            except Exception as e:
                print(f"上报出错: {e}", file=sys.stderr)
            
            time.sleep(args.interval)
    else:
        reporter.report()


if __name__ == '__main__':
    main()

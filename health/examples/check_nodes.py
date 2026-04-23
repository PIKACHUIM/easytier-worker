#!/usr/bin/env python3
"""
EasyTier 健康检查 Python 示例
演示如何在 Python 中使用 health-check 工具
"""

import subprocess
import sys
import json
from datetime import datetime
from typing import Dict, Optional, Tuple

class HealthChecker:
    """EasyTier 健康检查器"""
    
    def __init__(self, health_check_path: str = "./target/release/health-check"):
        self.health_check_path = health_check_path
    
    def check_node(
        self, 
        server: str, 
        network_name: str, 
        network_secret: str,
        timeout: int = 30,
        verbose: bool = False
    ) -> Optional[Dict]:
        """
        检查单个节点的健康状态
        
        Args:
            server: 服务器地址 (例如: tcp://192.168.1.1:11010)
            network_name: 网络名称
            network_secret: 网络密码
            timeout: 超时时间（秒）
            verbose: 是否显示详细日志
            
        Returns:
            包含健康状态的字典，如果检查失败则返回 None
        """
        cmd = [
            self.health_check_path,
            '-s', server,
            '-n', network_name,
            '-p', network_secret,
            '-t', str(timeout)
        ]
        
        if verbose:
            cmd.append('-v')
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout + 5
            )
            
            # 解析输出
            parts = result.stdout.strip().split()
            if len(parts) == 5:
                return {
                    'online': int(parts[0]) == 1,
                    'connections': int(parts[1]),
                    'bandwidth': int(parts[2]),
                    'tier_bandwidth': int(parts[3]),
                    'traffic': int(parts[4]),
                    'exit_code': result.returncode
                }
            else:
                return None
                
        except subprocess.TimeoutExpired:
            print(f"检查超时: {server}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"检查失败: {e}", file=sys.stderr)
            return None

def main():
    """主函数 - 演示如何使用 HealthChecker"""
    
    # 创建检查器实例
    checker = HealthChecker()
    
    # 定义要检查的节点
    nodes = [
        {
            'name': '节点1',
            'server': 'tcp://192.168.1.1:11010',
            'network': 'MyNetwork',
            'password': 'MyPassword'
        },
        {
            'name': '节点2',
            'server': 'tcp://192.168.1.1:11010',
            'network': 'TestNetwork',
            'password': 'TestPassword'
        },
    ]
    
    print("=" * 50)
    print("EasyTier 节点健康检查")
    print(f"检查时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    print()
    
    results = []
    
    # 检查所有节点
    for node in nodes:
        print(f"检查节点: {node['name']}")
        print(f"  服务器: {node['server']}")
        print(f"  网络: {node['network']}")
        
        status = checker.check_node(
            server=node['server'],
            network_name=node['network'],
            network_secret=node['password'],
            timeout=30
        )
        
        if status and status['online']:
            print(f"  状态: ✓ 在线")
            print(f"  连接数: {status['connections']}")
            results.append({'node': node['name'], 'status': 'online', 'connections': status['connections']})
        else:
            print(f"  状态: ✗ 离线")
            results.append({'node': node['name'], 'status': 'offline', 'connections': 0})
        
        print()
    
    # 统计
    total = len(results)
    online = sum(1 for r in results if r['status'] == 'online')
    offline = total - online
    
    print("=" * 50)
    print("检查完成")
    print(f"总节点数: {total}")
    print(f"在线: {online}")
    print(f"离线: {offline}")
    print("=" * 50)
    
    # 输出 JSON 格式结果（可选）
    print("\nJSON 格式结果:")
    print(json.dumps({
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total': total,
            'online': online,
            'offline': offline
        },
        'nodes': results
    }, indent=2, ensure_ascii=False))
    
    # 返回状态码
    sys.exit(0 if offline == 0 else 1)

if __name__ == '__main__':
    main()

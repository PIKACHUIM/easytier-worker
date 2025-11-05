#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EasyTier 节点上报脚本（更新版 v1.0.1）
使用节点名称、邮箱和Token进行上报
"""

import requests
import json
import time
import psutil  # 需要安装: pip install psutil

# ==================== 配置区域 ====================
# API 服务器地址
API_URL = "https://your-worker.workers.dev/api/report"

# 节点信息（从节点管理页面获取）
NODE_NAME = "your-node-name"  # 节点名称
USER_EMAIL = "your-email@example.com"  # 用户邮箱
REPORT_TOKEN = "your-report-token-here"  # 节点上报Token（从管理页面复制）

# 上报间隔（秒）
REPORT_INTERVAL = 600  # 10分钟上报一次
# ==================================================


class NodeReporter:
    """节点上报器"""
    
    def __init__(self, api_url, node_name, email, token):
        self.api_url = api_url
        self.node_name = node_name
        self.email = email
        self.token = token
        self.last_traffic = 0  # 上次的总流量
        
    def get_network_stats(self):
        """获取网络统计信息"""
        try:
            # 获取网络IO统计
            net_io = psutil.net_io_counters()
            
            # 计算当前总流量（GB）
            current_traffic = (net_io.bytes_sent + net_io.bytes_recv) / (1024 ** 3)
            
            # 计算本次上报的流量增量
            if self.last_traffic == 0:
                traffic_delta = 0  # 首次上报，增量为0
            else:
                traffic_delta = current_traffic - self.last_traffic
            
            self.last_traffic = current_traffic
            
            # 获取网络连接数
            connections = len(psutil.net_connections())
            
            # 获取网络带宽使用（Mbps）
            # 注意：这里简化处理，实际应该计算一段时间内的平均值
            bandwidth = 0  # 需要更复杂的逻辑来计算实时带宽
            
            return {
                'current_bandwidth': bandwidth,
                'reported_traffic': traffic_delta,
                'connection_count': connections,
                'status': 'online'
            }
        except Exception as e:
            print(f"获取网络统计失败: {e}")
            return None
    
    def report(self):
        """上报节点状态"""
        try:
            # 获取网络统计
            stats = self.get_network_stats()
            if not stats:
                return False
            
            # 构建上报数据
            data = {
                'node_name': self.node_name,
                'email': self.email,
                'token': self.token,
                'current_bandwidth': stats['current_bandwidth'],
                'reported_traffic': stats['reported_traffic'],
                'connection_count': stats['connection_count'],
                'status': stats['status']
            }
            
            # 发送上报请求
            response = requests.post(
                self.api_url,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ 上报成功 - {time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"  已用流量: {result.get('used_traffic', 0):.2f} GB / {result.get('max_traffic', 0):.2f} GB")
                print(f"  下次重置: {result.get('reset_date', 'N/A')}")
                return True
            else:
                error = response.json().get('error', '未知错误')
                print(f"✗ 上报失败: {error}")
                return False
                
        except requests.exceptions.Timeout:
            print("✗ 上报超时")
            return False
        except requests.exceptions.RequestException as e:
            print(f"✗ 网络错误: {e}")
            return False
        except Exception as e:
            print(f"✗ 上报失败: {e}")
            return False
    
    def run(self, interval):
        """持续运行上报"""
        print("=" * 60)
        print("EasyTier 节点上报服务已启动")
        print(f"节点名称: {self.node_name}")
        print(f"用户邮箱: {self.email}")
        print(f"上报间隔: {interval} 秒")
        print("=" * 60)
        print()
        
        while True:
            try:
                self.report()
                time.sleep(interval)
            except KeyboardInterrupt:
                print("\n\n服务已停止")
                break
            except Exception as e:
                print(f"运行错误: {e}")
                time.sleep(60)  # 出错后等待1分钟再重试


def main():
    """主函数"""
    # 检查配置
    if NODE_NAME == "your-node-name" or USER_EMAIL == "your-email@example.com" or REPORT_TOKEN == "your-report-token-here":
        print("错误：请先配置节点信息！")
        print("请编辑脚本，填写以下信息：")
        print("  - NODE_NAME: 节点名称")
        print("  - USER_EMAIL: 用户邮箱")
        print("  - REPORT_TOKEN: 上报Token（从节点管理页面获取）")
        return
    
    # 创建上报器
    reporter = NodeReporter(API_URL, NODE_NAME, USER_EMAIL, REPORT_TOKEN)
    
    # 运行上报服务
    reporter.run(REPORT_INTERVAL)


if __name__ == "__main__":
    main()

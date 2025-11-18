#!/usr/bin/env python3
"""
节点同步与状态上报脚本
1. 启动easytier-uptime.exe
2. 从远程API查询节点（源A）
3. 从本地API获取数据库节点（源B）
4. 对比A和B，以A为准进行增删改操作
5. 等待30秒以上
6. 获取数据库节点（源C）
7. 汇总C数据上报到远程API
8. 休眠5分钟，重复步骤2-7
"""

import argparse
import logging
import sys
import signal
import time
import subprocess
import requests
import json
from typing import Dict, List, Any
from datetime import datetime


# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NodeSyncMonitor:
    """节点同步与状态上报监控器"""
    
    def __init__(self, remote_api_url: str, local_api_url: str = "127.0.0.1:8080"):
        """
        初始化监控器
        
        Args:
            remote_api_url: 远程API地址（不带协议前缀）
            local_api_url: 本地API地址，默认为127.0.0.1:8080
        """
        self.remote_api_url = remote_api_url.rstrip('/')
        self.local_api_url = local_api_url.rstrip('/')
        self.easytier_process = None
        self.running = True
        
    def start_easytier_uptime(self):
        """启动easytier-uptime.exe进程"""
        try:
            logger.info("启动easytier-uptime.exe...")
            self.easytier_process = subprocess.Popen(
                ["easytier-uptime.exe"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            logger.info("easytier-uptime.exe启动成功")
        except Exception as e:
            logger.error(f"启动easytier-uptime.exe失败: {e}")
            raise
    
    def stop_easytier_uptime(self):
        """停止easytier-uptime.exe进程"""
        if self.easytier_process:
            try:
                self.easytier_process.terminate()
                self.easytier_process.wait(timeout=10)
                logger.info("easytier-uptime.exe已停止")
            except subprocess.TimeoutExpired:
                logger.warning("easytier-uptime.exe未能正常停止，强制终止")
                self.easytier_process.kill()
            except Exception as e:
                logger.error(f"停止easytier-uptime.exe时出错: {e}")
    
    def get_remote_nodes(self) -> List[Dict[str, Any]]:
        """从远程API获取节点列表（源A）"""
        try:
            url = f"https://{self.remote_api_url}/api/nodes/all"
            logger.info(f"从远程API获取节点列表: {url}")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            nodes = response.json()
            logger.info(f"远程API返回 {len(nodes)} 个节点")
            return nodes
            
        except Exception as e:
            logger.error(f"获取远程节点失败: {e}")
            return []
    
    def get_local_nodes(self) -> List[Dict[str, Any]]:
        """从本地API获取节点列表（源B/C）"""
        try:
            url = f"http://{self.local_api_url}/api/nodes"
            logger.info(f"从本地API获取节点列表: {url}")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            nodes = response.json()
            logger.info(f"本地API返回 {len(nodes)} 个节点")
            return nodes
            
        except Exception as e:
            logger.error(f"获取本地节点失败: {e}")
            return []
    
    def create_node(self, node_data: Dict[str, Any]) -> bool:
        """创建新节点"""
        try:
            url = f"http://{self.local_api_url}/api/nodes"
            response = requests.post(url, json=node_data, timeout=30)
            response.raise_for_status()
            logger.info(f"成功创建节点: {node_data.get('id', 'unknown')}")
            return True
        except Exception as e:
            logger.error(f"创建节点失败: {e}")
            return False
    
    def update_node(self, node_id: str, node_data: Dict[str, Any]) -> bool:
        """更新节点"""
        try:
            url = f"http://{self.local_api_url}/api/nodes/{node_id}"
            response = requests.put(url, json=node_data, timeout=30)
            response.raise_for_status()
            logger.info(f"成功更新节点: {node_id}")
            return True
        except Exception as e:
            logger.error(f"更新节点失败: {e}")
            return False
    
    def delete_node(self, node_id: str) -> bool:
        """删除节点"""
        try:
            url = f"http://{self.local_api_url}/api/nodes/{node_id}"
            response = requests.delete(url, timeout=30)
            response.raise_for_status()
            logger.info(f"成功删除节点: {node_id}")
            return True
        except Exception as e:
            logger.error(f"删除节点失败: {e}")
            return False
    
    def sync_nodes(self, remote_nodes: List[Dict[str, Any]], local_nodes: List[Dict[str, Any]]):
        """
        同步节点：以远程节点（源A）为准，对本地节点（源B）进行增删改操作
        
        Args:
            remote_nodes: 远程节点列表（源A）
            local_nodes: 本地节点列表（源B）
        """
        logger.info("开始同步节点...")
        
        # 创建节点映射，便于查找
        remote_map = {node.get('id'): node for node in remote_nodes if node.get('id')}
        local_map = {node.get('id'): node for node in local_nodes if node.get('id')}
        
        # 远程存在但本地不存在的节点，需要创建
        for node_id, remote_node in remote_map.items():
            if node_id not in local_map:
                self.create_node(remote_node)
        
        # 远程和本地都存在的节点，需要更新（以远程为准）
        for node_id, remote_node in remote_map.items():
            if node_id in local_map:
                # 这里可以根据需要比较节点内容，简化起见直接更新
                self.update_node(node_id, remote_node)
        
        # 本地存在但远程不存在的节点，需要删除
        for node_id in local_map:
            if node_id not in remote_map:
                self.delete_node(node_id)
        
        logger.info("节点同步完成")
    
    def report_status(self, nodes: List[Dict[str, Any]]):
        """
        汇总节点状态并上报到远程服务器
        
        Args:
            nodes: 节点列表（源C）
        """
        try:
            url = f"https://{self.remote_api_url}/api/report"
            logger.info(f"上报状态到: {url}")
            
            # 准备上报数据
            report_data = {
                'timestamp': datetime.now().isoformat(),
                'nodes': nodes,
                'total_count': len(nodes)
            }
            
            response = requests.post(url, json=report_data, timeout=30)
            response.raise_for_status()
            
            logger.info(f"状态上报成功，上报了 {len(nodes)} 个节点")
            
        except Exception as e:
            logger.error(f"状态上报失败: {e}")
    
    def run_sync_cycle(self):
        """执行一次完整的同步周期"""
        logger.info("开始执行同步周期...")
        
        # 步骤2：从远程API查询节点（源A）
        remote_nodes = self.get_remote_nodes()
        if not remote_nodes:
            logger.warning("未能获取远程节点，跳过本次同步")
            return
        
        # 步骤3：从本地API获取数据库节点（源B）
        local_nodes = self.get_local_nodes()
        
        # 步骤4：对比A和B，以A为准进行同步
        self.sync_nodes(remote_nodes, local_nodes)
        
        # 步骤5：等待30秒以上
        logger.info("等待30秒...")
        time.sleep(30)
        
        # 步骤6：从本地API获取数据库节点（源C）
        updated_nodes = self.get_local_nodes()
        
        # 步骤7：汇总C的数据，提交到远程API
        if updated_nodes:
            self.report_status(updated_nodes)
        
        logger.info("同步周期完成")
    
    def start_monitoring(self):
        """开始监控循环"""
        logger.info("启动节点同步与状态上报监控")
        
        # 步骤1：启动easytier-uptime.exe
        self.start_easytier_uptime()
        
        try:
            while self.running:
                # 执行同步周期（步骤2-7）
                self.run_sync_cycle()
                
                # 休眠5分钟
                logger.info("休眠5分钟...")
                for i in range(5 * 60):  # 5分钟 = 300秒
                    if not self.running:
                        break
                    time.sleep(1)
                    
        except Exception as e:
            logger.error(f"监控过程中出错: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # 清理资源
            self.stop_easytier_uptime()
    
    def stop(self):
        """停止监控"""
        logger.info("正在停止监控...")
        self.running = False


def signal_handler(signum, frame):
    """信号处理函数"""
    logger.info(f"收到信号 {signum}，开始清理...")
    if 'monitor' in globals():
        monitor.stop()
    sys.exit(0)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='节点同步与状态上报脚本',
        epilog='示例: python NodeSyncMonitor.py your-domain.workers.dev'
    )
    parser.add_argument('api_domain', help='远程API域名，例如 your-domain.workers.dev')
    parser.add_argument('--local-api', default='127.0.0.1:8080', 
                        help='本地API地址，默认为127.0.0.1:8080')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                        default='INFO', help='日志级别，默认为INFO')
    
    args = parser.parse_args()
    
    # 设置日志级别
    log_level = getattr(logging, args.log_level.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # 注册信号处理
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info("节点同步与状态上报脚本启动")
    logger.info(f"远程API域名: {args.api_domain}")
    logger.info(f"本地API地址: {args.local_api}")
    
    global monitor
    monitor = NodeSyncMonitor(args.api_domain, args.local_api)
    
    try:
        monitor.start_monitoring()
        return 0
    except KeyboardInterrupt:
        logger.info("脚本被用户中断")
        return 0
    except Exception as e:
        logger.error(f"脚本执行失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())
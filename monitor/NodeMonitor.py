#!/usr/bin/env python3
"""
节点监控脚本 - 获取节点信息并上报状态
"""

import argparse
import asyncio
import json
import logging
import os
import platform
import socket
import subprocess
import sys
import threading
import time
import traceback
import urllib.parse
import urllib.request
from typing import Dict, List, Optional, Tuple

# 导入配置和健康检查模块
from NodeConfigs import NodeMonitorConfig

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NodeMonitor:
    """
    节点监控器 - 获取EasyTier节点信息并上报状态
    
    功能：
    1. 启动easytier-uptime服务
    2. 从API获取节点列表
    3. 同步节点到本地服务
    4. 获取健康检查结果
    5. 上报节点状态
    """

    def __init__(self, api_base_url: str, jwt_token: str, config_file: Optional[str] = None):
        self.api_base_url = api_base_url.rstrip('/')
        self.jwt_token = jwt_token
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }
        self.config = NodeMonitorConfig(config_file or "node_monitor_config.json")

        # 设置日志级别
        log_level = getattr(logging, self.config.get_log_level().upper(), logging.INFO)
        logger.setLevel(log_level)

    def make_report_request(self, endpoint: str, data: Dict, retry_count: int = 0) -> Optional[Dict]:
        url = f"{self.api_base_url}{endpoint}"
        max_retries = self.config.get_max_retries()

        try:
            data_bytes = json.dumps(data).encode('utf-8')
            request = urllib.request.Request(url, data=data_bytes, method='POST')
            request.add_header('Content-Type', 'application/json')

            timeout = self.config.get_connection_timeout()
            with urllib.request.urlopen(request, timeout=timeout) as response:
                result = json.loads(response.read().decode('utf-8'))
                logger.info(f"上报API请求成功: {endpoint}")
                return result

        except urllib.error.HTTPError as e:
            logger.error(f"上报API HTTP错误 {e.code}: {endpoint}")
            try:
                error_data = json.loads(e.read().decode('utf-8'))
                logger.error(f"错误详情: {error_data}")
                # 如果是token验证失败，尝试重新生成token
                if e.code == 403 and 'Token验证失败' in str(error_data):
                    logger.warning("Token验证失败，可能需要重新生成节点上报token")
            except:
                logger.error(f"无法解析错误响应")
        except socket.timeout:
            logger.error(f"上报请求超时: {endpoint}")
        except Exception as e:
            logger.error(f"上报API请求失败: {endpoint} - {str(e)}")

        # 重试逻辑
        if retry_count < max_retries:
            wait_time = 2 ** retry_count  # 指数退避
            logger.info(f"{wait_time}秒后重试上报 ({retry_count + 1}/{max_retries})...")
            time.sleep(wait_time)
            return self.make_report_request(endpoint, data, retry_count + 1)

        return None

    def make_api_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None, retry_count: int = 0) -> \
            Optional[Dict]:
        """
        发起API请求（带重试机制）
        
        Args:
            endpoint: API端点
            method: 请求方法
            data: 请求数据
            retry_count: 当前重试次数
            
        Returns:
            响应数据或None
        """
        url = f"{self.api_base_url}{endpoint}"
        max_retries = self.config.get_max_retries()

        try:
            if data:
                data_bytes = json.dumps(data).encode('utf-8')
                request = urllib.request.Request(url, data=data_bytes, method=method)
            else:
                request = urllib.request.Request(url, method=method)

            # 添加认证头
            for key, value in self.headers.items():
                request.add_header(key, value)

            timeout = self.config.get_connection_timeout()
            with urllib.request.urlopen(request, timeout=timeout) as response:
                result = json.loads(response.read().decode('utf-8'))
                logger.info(f"API请求成功: {method} {endpoint}")
                return result

        except urllib.error.HTTPError as e:
            logger.error(f"HTTP错误 {e.code}: {method} {endpoint}")
            try:
                error_data = json.loads(e.read().decode('utf-8'))
                logger.error(f"错误详情: {error_data}")
            except:
                logger.error(f"无法解析错误响应")
        except socket.timeout:
            logger.error(f"请求超时: {method} {endpoint}")
        except Exception as e:
            logger.error(f"API请求失败: {method} {endpoint} - {str(e)}")

        # 重试逻辑
        if retry_count < max_retries:
            wait_time = 2 ** retry_count  # 指数退避
            logger.info(f"{wait_time}秒后重试 ({retry_count + 1}/{max_retries})...")
            time.sleep(wait_time)
            return self.make_api_request(endpoint, method, data, retry_count + 1)

        return None

    def make_local_api_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Optional[Dict]:
        """
        向本地easytier-uptime服务发起API请求
        
        Args:
            endpoint: API端点
            method: 请求方法
            data: 请求数据
            
        Returns:
            响应数据或None
        """
        url = f"http://localhost:8080{endpoint}"
        try:
            if data:
                data_bytes = json.dumps(data).encode('utf-8')
                request = urllib.request.Request(url, data=data_bytes, method=method)
            else:
                request = urllib.request.Request(url, method=method)
            
            request.add_header('Content-Type', 'application/json')
            
            with urllib.request.urlopen(request, timeout=5) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            logger.error(f"本地API请求失败: {method} {endpoint} - {str(e)}")
            return None

    def get_my_nodes(self) -> List[Dict]:
        """
        获取用户的所有节点
        
        Returns:
            节点列表
        """
        logger.info("开始获取用户节点列表...")
        result = self.make_api_request('/api/nodes/all')

        if result and 'nodes' in result:
            nodes = result['nodes']
            logger.info(f"成功获取 {len(nodes)} 个节点")
            return nodes
        else:
            logger.error("获取节点列表失败")
            return []

    def _start_uptime_service(self) -> bool:
        """
        启动easytier-uptime.exe服务
        
        Returns:
            启动是否成功
        """
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            bin_dir = os.path.join(current_dir, "EasytierBin")
            bin_path = os.path.join(bin_dir, "easytier-uptime.exe")
            
            if not os.path.exists(bin_path):
                logger.error(f"easytier-uptime.exe not found at {bin_path}")
                return False
            
            logger.info(f"Starting easytier-uptime service: {bin_path}")
            # 启动服务，不等待
            process = subprocess.Popen(
                [bin_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=bin_dir
            )
            # 存储进程，以便后续停止
            self.uptime_process = process
            return True
        except Exception as e:
            logger.error(f"Failed to start easytier-uptime service: {str(e)}")
            traceback.print_exc()
            return False
            
    def _wait_for_service_start(self, timeout=30):
        """
        等待服务启动，直到/health端点返回200
        
        Args:
            timeout: 超时时间（秒）
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # 调用/health端点
                health_url = "http://localhost:8080/health"
                request = urllib.request.Request(health_url)
                with urllib.request.urlopen(request, timeout=5) as response:
                    if response.status == 200:
                        logger.info("easytier-uptime service started successfully")
                        return True
            except Exception as e:
                logger.debug(f"Waiting for service to start: {str(e)}")
                time.sleep(1)
        logger.error("easytier-uptime service failed to start within timeout")
        return False

    def _sync_nodes(self):
        """同步节点信息"""
        # 获取API节点列表（源A）
        try:
            api_nodes = self._get_api_nodes()
            self.logger.info(f"从API获取{len(api_nodes)}个节点")
        except Exception as e:
            self.logger.error(f"获取API节点失败: {str(e)}")
            return
        
        # 获取本地数据库节点（源B）
        try:
            local_nodes = self._get_local_nodes()
            self.logger.info(f"从本地数据库获取{len(local_nodes)}个节点")
        except Exception as e:
            self.logger.error(f"获取本地节点失败: {str(e)}")
            return
        
        # 添加缺失节点
        added_count = 0
        for node in api_nodes:
            # 构建完整节点数据
            node_data = {
                "id": node["id"],
                "node_name": node["node_name"],
                "ip_address": node.get("ip_address", ""),
                "port": node.get("port", 0),
                "is_public": node.get("is_public", False),
                "location": node.get("location", ""),
                "description": node.get("description", "")
            }
            
            # 检查节点是否已存在
            if not any(n["id"] == node["id"] for n in local_nodes):
                try:
                    self._add_node(node_data)
                    added_count += 1
                    self.logger.info(f"添加节点 {node['id']}: {node['node_name']}")
                except Exception as e:
                    self.logger.error(f"添加节点失败: {str(e)}")
        
        # 删除多余节点
        removed_count = 0
        for node in local_nodes:
            if not any(n["id"] == node["id"] for n in api_nodes):
                try:
                    self._delete_node(node["id"])
                    removed_count += 1
                    self.logger.info(f"删除节点 {node['id']}: {node['node_name']}")
                except Exception as e:
                    self.logger.error(f"删除节点失败: {str(e)}")
        
        self.logger.info(f"节点同步完成: 添加{added_count}个, 删除{removed_count}个")

    def monitor_nodes(self):
        """
        监控所有节点（新逻辑）
        
        步骤：
        1. 启动easytier-uptime.exe
        2. 从传入地址获取节点列表 (源A)
        3. 从本地服务获取节点列表 (源B)
        4. 同步节点 (以源A为准)
        5. 等待健康检查执行
        6. 从本地服务获取节点数据 (源C)
        7. 上报节点状态
        """
        logger.info("Starting node monitor with new logic...")
        
        # 1. 启动easytier-uptime服务
        if not self._start_uptime_service():
            logger.error("Failed to start easytier-uptime service, exiting")
            return
            
        # 等待服务启动
        if not self._wait_for_service_start():
            logger.error("Service did not start, exiting")
            return
            
        try:
            # 2. 从传入地址获取节点列表 (源A)
            logger.info("从传入地址获取节点列表 (源A)...")
            source_a_nodes = self.get_my_nodes()
            source_a_node_ids = {node['id'] for node in source_a_nodes}
            
            # 3. 从本地服务获取节点列表 (源B)
            logger.info("从本地服务获取节点列表 (源B)...")
            source_b_response = self.make_local_api_request('/api/nodes')
            source_b_nodes = source_b_response.get('nodes', []) if source_b_response else []
            source_b_node_ids = {node['id'] for node in source_b_nodes}
            
            # 4. 同步节点 (以源A为准)
            logger.info("同步节点 (以源A为准)...")
            
            # 添加源A中存在但源B中不存在的节点
            for node in source_a_nodes:
                if node['id'] not in source_b_node_ids:
                    # 构建符合API要求的节点数据
                    api_node = {
                        "id": node['id'],
                        "node_name": node['node_name'],
                        "ip_address": node.get('ip_address', ''),
                        "port": node.get('port', 0),
                        "is_public": node.get('is_public', False)
                    }
                    
                    logger.info(f"添加节点: {node['node_name']} (ID: {node['id']})")
                    self.make_local_api_request('/api/nodes', method='POST', data=api_node)
            
            # 删除源B中存在但源A中不存在的节点
            for node in source_b_nodes:
                if node['id'] not in source_a_node_ids:
                    logger.info(f"删除节点: {node['node_name']} (ID: {node['id']})")
                    self.make_local_api_request(f"/api/nodes/{node['id']}", method='DELETE')
            
            # 5. 等待健康检查执行
            health_check_interval = 30  # 默认30秒
            logger.info(f"等待健康检查执行 (等待 {health_check_interval} 秒)...")
            time.sleep(health_check_interval)
            
            # 6. 从本地服务获取节点数据 (源C)
            logger.info("获取健康检查后的节点数据 (源C)...")
            source_c_response = self.make_local_api_request('/api/nodes')
            source_c_nodes = source_c_response.get('nodes', []) if source_c_response else []
            
            # 7. 上报节点状态
            logger.info("上报节点状态到服务器...")
            for node in source_c_nodes:
                # 构建上报数据
                report_data = {
                    "node_id": node['id'],
                    "node_name": node['node_name'],
                    "status": node.get('status', 'unknown'),
                    "last_check": node.get('last_check', ''),
                    "latency": node.get('latency', 0),
                    "health_stats": node.get('health_stats', {})
                }
                
                # 上报到服务器
                self.make_report_request('/api/report', report_data)
            
            logger.info("节点监控完成")
        
        except Exception as e:
            logger.error(f"监控过程中发生错误: {str(e)}")
            traceback.print_exc()


def main():
    """
    主函数 - 解析参数并启动节点监控
    """
    import signal

    parser = argparse.ArgumentParser(
        description='节点监控脚本 - 获取节点信息并上报状态',
        epilog='示例: python NodeMonitor.py https://your-domain.workers.dev your_jwt_token'
    )
    parser.add_argument('api_url', help='API基础地址，例如 https://your-domain.workers.dev')
    parser.add_argument('jwt_token', help='JWT认证令牌')
    parser.add_argument('--config', default='node_monitor_config.json', help='配置文件路径')
    parser.add_argument('--timeout', type=int, help='连接超时时间（秒），默认使用配置文件设置')
    parser.add_argument('--delay', type=int, help='节点间延迟时间（秒），默认使用配置文件设置')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                        help='日志级别，默认使用配置文件设置')

    args = parser.parse_args()

    logger.info("节点监控脚本启动")
    logger.info(f"API地址: {args.api_url}")
    logger.info(f"配置文件: {args.config}")

    monitor = None

    def signal_handler(signum, frame):
        """信号处理函数"""
        logger.info(f"收到信号 {signum}，开始清理...")
        if monitor:
            # 清理逻辑
            pass
        sys.exit(0)

    # 注册信号处理
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        # 创建监控器
        monitor = NodeMonitor(args.api_url, args.jwt_token, args.config)

        # 如果命令行参数覆盖了配置文件设置
        if args.timeout:
            monitor.config.config["connection_timeout"] = args.timeout
        if args.delay:
            monitor.config.config["node_delay"] = args.delay
        if args.log_level:
            monitor.config.config["log_level"] = args.log_level
            log_level = getattr(logging, args.log_level.upper(), logging.INFO)
            logger.setLevel(log_level)

        # 开始监控
        monitor.monitor_nodes()

        logger.info("节点监控脚本执行完成")

    except KeyboardInterrupt:
        logger.info("脚本被用户中断")
    except Exception as e:
        logger.error(f"脚本执行失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
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
import urllib.parse
import urllib.request
from typing import Dict, List, Optional, Tuple

# 导入配置和健康检查模块
from NodeConfigs import NodeMonitorConfig
from NodeChecker import EasyTierHealthChecker, HealthCheckResult

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
    1. 从API获取节点列表
    2. 为每个节点启动easytier-web进程
    3. 通过RPC获取节点真实信息
    4. 上报节点状态到服务器
    
    Args:
        api_base_url: API基础地址，例如 https://your-domain.workers.dev
        jwt_token: JWT认证令牌
        config_file: 配置文件路径
    """

    def __init__(self, api_base_url: str, jwt_token: str, config_file: Optional[str] = None):
        self.api_base_url = api_base_url.rstrip('/')
        self.jwt_token = jwt_token
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }
        self.config = NodeMonitorConfig(config_file or "node_monitor_config.json")

        # easytier-web进程管理
        self.easytier_processes = {}  # 存储每个节点的easytier-web进程
        self.process_lock = threading.Lock()

        # 健康检查器
        self.health_checker = None

        # 设置日志级别
        log_level = getattr(logging, self.config.get_log_level().upper(), logging.INFO)
        logger.setLevel(log_level)

    def _get_easytier_bin_path(self) -> str:
        """
        根据系统架构获取easytier-core二进制文件路径
        
        Returns:
            easytier-core二进制文件路径
        """
        system = platform.system().lower()
        current_dir = os.path.dirname(os.path.abspath(__file__))
        bin_dir = os.path.join(current_dir, "EasytierBin")

        if system == "windows":
            bin_path = os.path.join(bin_dir, "easytier-core.exe")
        else:
            bin_path = os.path.join(bin_dir, "easytier-core")

        if os.path.exists(bin_path):
            return bin_path
        else:
            # 如果本地没有，尝试使用系统PATH中的easytier-core
            return "easytier-core"

    def _start_easytier_web(self, node_name: str, network_name: str, network_secret: str, peer_url: str) -> bool:
        """
        在后台启动easytier-web进程
        
        Args:
            node_name: 节点名称
            network_name: 网络名称
            network_secret: 网络密钥
            peer_url: 对等节点URL
            
        Returns:
            启动是否成功
        """
        try:
            bin_path = self._get_easytier_bin_path()

            # 构建命令参数
            cmd = [
                bin_path,
                "--network-name", network_name,
                "--network-secret", network_secret,
                "-p", peer_url,
                "--rpc-portal", "15888"  # 使用rpc-portal参数设置RPC端口
            ]

            logger.info(f"启动easytier-web进程: {' '.join(cmd)}")

            # 在后台启动进程
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.path.dirname(bin_path)
            )

            # 存储进程信息
            with self.process_lock:
                self.easytier_processes[node_name] = {
                    'process': process,
                    'network_name': network_name,
                    'network_secret': network_secret,
                    'peer_url': peer_url,
                    'start_time': time.time()
                }

            # 等待一小段时间确保进程启动
            time.sleep(2)

            # 检查进程是否还在运行
            if process.poll() is None:
                logger.info(f"easytier-web进程启动成功: {node_name}")
                return True
            else:
                stdout, stderr = process.communicate()
                logger.error(f"easytier-web进程启动失败: {node_name}")
                if stderr:
                    logger.error(f"错误信息: {stderr.decode('utf-8')}")
                return False

        except Exception as e:
            logger.error(f"启动easytier-web进程失败: {node_name} - {str(e)}")
            return False

    def _stop_easytier_web(self, node_name: str):
        """
        停止指定节点的easytier-web进程
        
        Args:
            node_name: 节点名称
        """
        with self.process_lock:
            if node_name in self.easytier_processes:
                process_info = self.easytier_processes[node_name]
                process = process_info['process']

                try:
                    process.terminate()
                    process.wait(timeout=5)
                    logger.info(f"easytier-web进程已停止: {node_name}")
                except subprocess.TimeoutExpired:
                    process.kill()
                    logger.warning(f"强制终止easytier-web进程: {node_name}")
                except Exception as e:
                    logger.error(f"停止easytier-web进程失败: {node_name} - {str(e)}")
                finally:
                    del self.easytier_processes[node_name]

    def _cleanup_all_processes(self):
        """清理所有easytier-web进程"""
        with self.process_lock:
            for node_name in list(self.easytier_processes.keys()):
                self._stop_easytier_web(node_name)

    async def _get_rpc_node_info(self, host: str) -> Optional[HealthCheckResult]:
        """
        通过RPC获取节点信息
        
        Args:
            host: 节点IP地址
            
        Returns:
            健康检查结果或None
        """
        try:
            if not self.health_checker:
                self.health_checker = EasyTierHealthChecker(timeout=self.config.get_connection_timeout())

            # 连接到节点的RPC端口(15888)
            result = await self.health_checker.check_node_health("tcp", host, 15888)
            print(f"RPC连接结果: {result}")
            if result.is_online:
                logger.info(f"RPC连接成功获取节点信息: {host}")
                return result
            else:
                logger.warning(f"RPC连接失败或节点离线: {host} - {result.error_message}")
                return None

        except Exception as e:
            logger.error(f"获取RPC节点信息失败: {host} - {str(e)}")
            return None

    """ ================================================================
    发起上报API请求
    ====================================================
    Args:
        endpoint: API端点
        data: 请求数据
    =============================================================== """

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

    def get_my_nodes(self) -> List[Dict]:
        """
        获取用户的所有节点，并为每个节点启动easytier-web进程
        
        Returns:
            节点列表
        """
        logger.info("开始获取用户节点列表...")
        result = self.make_api_request('/api/nodes/all')

        if result and 'nodes' in result:
            nodes = result['nodes']
            logger.info(f"成功获取 {len(nodes)} 个节点")

            # 为每个节点获取详细信息和启动easytier-web
            for node in nodes:
                node_id = node.get('id')
                node_name = node.get('node_name')

                if node_id and node_name:
                    # 获取节点详细信息
                    node_detail = self.make_api_request(f'/api/nodes/{node_id}')
                    if node_detail and 'node' in node_detail:
                        detail = node_detail['node']

                        # 保存上报token
                        if 'report_token' in detail and detail['report_token']:
                            self.config.set_report_token(node_name, detail['report_token'])
                            logger.info(f"获取节点 {node_name} 的上报token成功")
                        else:
                            logger.warning(f"节点 {node_name} 没有配置上报token，请先在管理页面生成")

                        # 从节点列表中获取网络配置（按要求从/api/nodes/all获取）
                        network_name = node.get('network_name')
                        network_token = node.get('network_token')  # network_secret
                        connections = node.get('connections', [])

                        if network_name and network_token and connections:
                            # 使用第一个连接作为对等节点
                            peer_connection = connections[0]
                            conn_type = peer_connection.get('type', '').lower()
                            ip = peer_connection.get('ip', '')
                            port = peer_connection.get('port', 11010)  # 默认使用11010端口

                            if ip and port:
                                if conn_type == 'tcp':
                                    peer_url = f"tcp://{ip}:{port}"
                                elif conn_type == 'udp':
                                    peer_url = f"udp://{ip}:{port}"
                                else:
                                    # 默认使用TCP
                                    peer_url = f"tcp://{ip}:{port}"

                                # 启动easytier-web进程
                                if self._start_easytier_web(node_name, network_name, network_token, peer_url):
                                    logger.info(f"节点 {node_name} 的easytier-web进程启动成功")
                                else:
                                    logger.warning(f"节点 {node_name} 的easytier-web进程启动失败")
                            else:
                                logger.warning(f"节点 {node_name} 的连接信息不完整")
                        else:
                            logger.warning(f"节点 {node_name} 缺少网络配置或连接信息")
                    else:
                        logger.warning(f"无法获取节点 {node_name} 的详细信息")

            return nodes
        else:
            logger.error("获取节点列表失败")
            return []

    def report_node_status(self, node: Dict) -> bool:
        """
        上报节点状态，通过RPC获取真实信息
        
        Args:
            node: 节点信息
            
        Returns:
            上报是否成功
        """
        node_name = node.get('node_name', '')
        user_email = node.get('user_email', '')

        if not node_name or not user_email:
            logger.error(f"节点信息不完整，无法上报: {node}")
            return False

        # 从配置中获取上报token
        report_token = self.config.get_report_token(node_name)
        if not report_token:
            logger.error(f"节点 {node_name} 没有配置上报token")
            return False

        # 初始化默认值
        current_bandwidth = 0
        reported_traffic = 0
        connection_count = 0
        tier_bandwidth = 100
        status = 'offline'  # 默认离线状态
        # 通过RPC获取节点真实信息
        connections = node.get('connections', [])
        if connections:
            # 使用本地RPC端口进行查询（easytier-web在本地启动）
            host = "127.0.0.1"

            if host:
                try:
                    # 使用asyncio运行RPC查询
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    rpc_result = loop.run_until_complete(self._get_rpc_node_info(host))
                    loop.close()

                    if rpc_result and rpc_result.is_online:
                        # 节点在线，从RPC结果中提取真实数据
                        status = 'online'
                        connection_count = rpc_result.connection_count

                        # 暂时使用默认值，因为当前的HealthCheckResult不包含详细的peer信息
                        # 后续可以从rust版本的RPC响应中获取更详细的数据
                        current_bandwidth = 0  # MB
                        reported_traffic = 0  # GB

                        logger.info(
                            f"通过RPC获取节点 {node_name} 的真实数据: 连接数={connection_count}, 带宽={current_bandwidth}MB, 流量={reported_traffic}GB")
                    else:
                        logger.warning(f"RPC查询失败，节点 {node_name} 离线")

                except Exception as e:
                    logger.error(f"RPC查询节点 {node_name} 信息失败: {str(e)}")
                    status = 'offline'
        else:
            logger.warning(f"节点 {node_name} 没有连接信息，标记为离线")

        # 构建上报数据
        report_data = {
            "node_name": node_name,
            "email": user_email,
            "token": report_token,
            "current_bandwidth": current_bandwidth,  # 真实数据或默认0
            "reported_traffic": reported_traffic,  # 真实数据或默认0
            "connection_count": connection_count,  # 真实数据或默认0
            "tier_bandwidth": tier_bandwidth,
            "status": status
        }

        logger.info(f"上报节点状态: {node_name} - {status}")
        logger.info(f"上报数据: 带宽={current_bandwidth}MB, 流量={reported_traffic}GB, 连接数={connection_count}")

        # 上报API不需要JWT认证，使用特殊的请求方法
        result = self.make_report_request('/api/report', report_data)

        if result:
            logger.info(f"节点状态上报成功: {node_name}")
            if 'used_traffic' in result:
                logger.info(f"节点流量信息 - 已用: {result['used_traffic']}GB, 最大: {result['max_traffic']}GB")
            return True
        else:
            logger.error(f"节点状态上报失败: {node_name}")
            return False

    def monitor_nodes(self):
        """
        监控所有节点
        """
        logger.info("开始节点监控...")

        try:
            # 获取用户节点列表并启动easytier-web进程
            nodes = self.get_my_nodes()

            if not nodes:
                logger.warning("没有获取到任何节点")
                return

            # 等待所有easytier-web进程完全启动
            logger.info("等待easytier-web进程启动...")
            time.sleep(5)

            success_count = 0
            failure_count = 0

            for i, node in enumerate(nodes):
                node_name = node.get('node_name', 'Unknown')
                connections = node.get('connections', [])

                logger.info(f"\n[{i + 1}/{len(nodes)}] 监控节点: {node_name}")

                if not connections:
                    logger.warning(f"节点 {node_name} 没有配置连接信息")
                    # 直接上报状态（RPC会自动判断是否在线）
                    if self.report_node_status(node):
                        success_count += 1
                    else:
                        failure_count += 1
                    continue

                # 通过RPC检查节点状态并上报
                if self.report_node_status(node):
                    success_count += 1
                else:
                    failure_count += 1

                # 节点间延迟
                if i < len(nodes) - 1:  # 不是最后一个节点
                    delay = self.config.get_node_delay()
                    logger.info(f"等待 {delay} 秒后继续...")
                    time.sleep(delay)

            logger.info(f"\n监控完成 - 成功: {success_count}, 失败: {failure_count}")

        finally:
            # 清理所有easytier-web进程
            logger.info("清理easytier-web进程...")
            self._cleanup_all_processes()

            # 关闭健康检查器
            if self.health_checker:
                try:
                    # 创建一个新的event loop来正确关闭异步上下文管理器
                    async def close_health_checker():
                        async with self.health_checker:
                            pass

                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(close_health_checker())
                    loop.close()
                except Exception as e:
                    logger.warning(f"关闭健康检查器时出错: {str(e)}")

            logger.info("清理完成")


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
            monitor._cleanup_all_processes()
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
    finally:
        # 确保清理资源
        if monitor:
            monitor._cleanup_all_processes()

    return 0


if __name__ == '__main__':
    exit(main())

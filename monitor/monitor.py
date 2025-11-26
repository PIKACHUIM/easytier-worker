#!/usr/bin/env python3
# EasyTier 节点监控程序 =======================================
# 功能：后台运行service进程，每1分钟查询/维护/更新/上报节点数据
import argparse
import json
import logging
import os
import platform
import subprocess
import sys
import time
import urllib.request
import urllib.error
from typing import Dict, List, Optional
from datetime import datetime
import threading
import signal

# 配置日志 =======================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Monitor:
    # EasyTier 节点监控器 =======================================
    def __init__(self, api_base_url: str, jwt_token: str):
        # 初始化监控器 =======================================
        self.api_base_url = api_base_url.rstrip('/')
        self.jwt_token = jwt_token
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }
        self.cached_nodes = []  # 本地缓存的节点数据
        self.service_process = None  # service进程
        self.running = True  # 运行标志
        # 确定service可执行文件路径 =======================================
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if platform.system() == 'Windows':
            self.service_path = os.path.join(current_dir, 'service.exe')
        else:
            self.service_path = os.path.join(current_dir, 'service')
        self.local_api_url = 'http://127.0.0.1:8080'  # 本地service API地址

    def make_api_request(self, endpoint: str, method: str = 'GET',
                         data: Optional[Dict] = None, use_local: bool = False) -> Optional[Dict]:
        # 发起API请求 =======================================
        if use_local:
            url = f"{self.local_api_url}{endpoint}"
            headers = {'Content-Type': 'application/json'}
        else:
            url = f"{self.api_base_url}{endpoint}"
            headers = self.headers.copy()

        try:
            if data:
                data_bytes = json.dumps(data).encode('utf-8')
                request = urllib.request.Request(url, data=data_bytes, method=method)
            else:
                request = urllib.request.Request(url, method=method)

            for key, value in headers.items():
                request.add_header(key, value)

            with urllib.request.urlopen(request, timeout=10) as response:
                result = json.loads(response.read().decode('utf-8'))
                logger.debug(f"API请求成功: {method} {endpoint}")
                return result

        except urllib.error.HTTPError as e:
            logger.error(f"HTTP错误 {e.code}: {method} {endpoint}")
            try:
                error_data = json.loads(e.read().decode('utf-8'))
                logger.error(f"错误详情: {error_data}")
            except:
                pass
        except Exception as e:
            logger.error(f"API请求失败: {method} {endpoint} - {str(e)}")
        return None

    def start_service(self) -> bool:
        # 启动service进程 =======================================
        if not os.path.exists(self.service_path):
            logger.error(f"Service文件不存在: {self.service_path}")
            return False
        try:
            logger.info(f"启动service进程: {self.service_path}")
            if platform.system() != 'Windows':  # 在Linux上需要确保文件有执行权限
                os.chmod(self.service_path, 0o755)
            # 启动进程 =======================================
            self.service_process = subprocess.Popen(
                [self.service_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.path.dirname(self.service_path)
            )
            logger.info(f"Service进程已启动，PID: {self.service_process.pid}")
            return self.wait_for_service()  # 等待服务启动
        except Exception as e:
            logger.error(f"启动service失败: {str(e)}")
            return False

    def wait_for_service(self, timeout: int = 30) -> bool:
        # 等待service启动完成 =======================================
        logger.info("等待service启动...")
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                result = self.make_api_request('/health', use_local=True)
                if result:
                    logger.info("Service启动成功")
                    return True
            except:
                pass
            time.sleep(1)
        logger.error("Service启动超时")
        return False

    def stop_service(self):
        # 停止service进程 =======================================
        if self.service_process:
            logger.info("停止service进程...")
            try:
                self.service_process.terminate()
                self.service_process.wait(timeout=5)
                logger.info("Service进程已停止")
            except:
                logger.warning("强制终止service进程")
                self.service_process.kill()

    def fetch_nodes_from_api(self) -> List[Dict]:
        # 从API获取所有节点 =======================================
        logger.info("从API获取节点列表...")
        result = self.make_api_request('/api/nodes/all')
        if result and 'nodes' in result:
            nodes = result['nodes']
            logger.info(f"成功获取 {len(nodes)} 个节点")
            return nodes
        else:
            logger.error("获取节点列表失败")
            return []

    def get_local_nodes(self) -> List[Dict]:
        # 从本地service获取节点列表 =======================================
        logger.info("从本地service获取节点列表...")
        result = self.make_api_request('/api/nodes', use_local=True)
        if result and result.get('success') and 'data' in result:
            data = result['data']
            if 'items' in data:
                nodes = data['items']
                logger.info(f"本地service有 {len(nodes)} 个节点")
                return nodes
        logger.warning("获取本地节点列表失败")
        return []

    def sync_nodes(self, api_nodes: List[Dict]):
        # 同步节点到本地service =======================================
        logger.info("开始同步节点...")
        local_nodes = self.get_local_nodes()  # 获取本地节点
        # 创建本地节点的 (host, port, protocol) 索引，用于检查唯一约束 =======================================
        local_node_keys = {
            (node['host'], node['port'], node['protocol']): node
            for node in local_nodes
        }
        # 创建API节点的 (host, port, protocol) 索引 =======================================
        api_node_keys = {}
        for node in api_nodes:
            host = node.get('ip_address', node.get('host', '127.0.0.1'))
            port = int(node.get('port', 11010))
            protocol = node.get('protocol', 'tcp')
            node_key = (host, port, protocol)
            api_node_keys[node_key] = node
        # 添加新节点 =======================================
        added_count = 0
        skipped_count = 0
        for node_key, node in api_node_keys.items():
            if node_key in local_node_keys:  # 检查是否已存在相同的 (host, port, protocol) 组合
                existing_node = local_node_keys[node_key]
                node_name = node.get('node_name', f"Node-{node['id']}")
                logger.debug(
                    f"节点已存在: {node_name} (host={node_key[0]}, port={node_key[1]}, protocol={node_key[2]})，本地ID={existing_node['id']}")
                skipped_count += 1
                continue
            # 准备节点数据，符合 CreateNodeRequest 结构 =======================================
            node_name = node.get('node_name', f"Node-{node['id']}")
            host, port, protocol = node_key
            node_data = {
                'name': node_name,
                'host': host,
                'port': port,
                'protocol': protocol,
                'max_connections': int(node.get('max_connections', 100)),
                'allow_relay': bool(node.get('allow_relay', True)),
                'network_name': node.get('network_name', 'default'),
            }
            # 可选字段 =======================================
            description = node.get('description', '').strip()
            if description:
                node_data['description'] = description
            network_secret = node.get('network_secret', '').strip()
            if network_secret:
                node_data['network_secret'] = network_secret
            # 联系方式字段（至少需要一个） =======================================
            qq_number = node.get('qq_number', '').strip()
            wechat = node.get('wechat', '').strip()
            mail = node.get('mail', '').strip()
            if qq_number:
                node_data['qq_number'] = qq_number
            if wechat:
                node_data['wechat'] = wechat
            # mail 字段必须是有效邮箱 =======================================
            if mail and '@' in mail:
                node_data['mail'] = mail
            elif not qq_number and not wechat:  # 如果没有其他联系方式，必须提供邮箱
                node_data['mail'] = 'default@example.com'
            logger.debug(f"准备添加节点数据: {json.dumps(node_data, ensure_ascii=False)}")
            result = self.make_api_request('/api/nodes', method='POST',
                                           data=node_data, use_local=True)
            if result and result.get('success'):
                logger.info(f"添加节点: {node_name} (ID: {node['id']})")
                added_count += 1
                local_node_keys[node_key] = node['id']  # 添加到本地索引，避免后续重复检查
            else:
                error_msg = result.get('error', '未知错误') if result else '请求失败'
                logger.error(f"添加节点失败: {node_name} - {error_msg}")
        # 删除多余节点（本地有但API中没有的节点） =======================================
        removed_count = 0
        for node_key, local_node in local_node_keys.items():
            if node_key not in api_node_keys:
                node_name = local_node.get('name', f"Node-{local_node['id']}")
                result = self.make_api_request(f"/api/nodes/{local_node['id']}",
                                               method='DELETE', use_local=True)
                if result and result.get('success'):
                    logger.info(
                        f"删除节点: {node_name} (host={node_key[0]}, port={node_key[1]}, protocol={node_key[2]})")
                    removed_count += 1
                else:
                    error_msg = result.get('error', '未知错误') if result else '请求失败'
                    logger.error(f"删除节点失败: {node_name} - {error_msg}")
        logger.info(f"节点同步完成: 添加 {added_count} 个, 跳过 {skipped_count} 个（已存在）, 删除 {removed_count} 个")

    def update_node_status(self):
        # 从本地service读取节点状态并更新缓存 =======================================
        logger.info("更新节点状态...")
        local_nodes = self.get_local_nodes()
        if not local_nodes:
            logger.warning("没有获取到本地节点数据")
            return
        self.cached_nodes = []  # 更新缓存
        for node in local_nodes:
            node_info = {
                'id': node['id'],
                'name': node['name'],
                'host': node['host'],
                'port': node['port'],
                'protocol': node['protocol'],
                'status': node.get('current_health_status', 'unknown'),
                'last_check': node.get('last_check_time', ''),
                'response_time': node.get('last_response_time', 0),
                'health_percentage_24h': node.get('health_percentage_24h', 0.0),
                'is_active': node.get('is_active', False),
                'description': node.get('description', ''),
                'updated_at': datetime.utcnow().isoformat()
            }
            self.cached_nodes.append(node_info)
        logger.info(f"已更新 {len(self.cached_nodes)} 个节点的状态")

    def report_nodes(self):
        # 上报节点数据到API =======================================
        if not self.cached_nodes:
            logger.warning("没有缓存数据可上报")
            return
        logger.info(f"开始上报 {len(self.cached_nodes)} 个节点的数据...")
        success_count = 0
        for node in self.cached_nodes:
            report_data = {
                'node_id': node['id'],
                'node_name': node['name'],
                'status': node['status'],
                'last_check': node['last_check'],
                'response_time': node['response_time'],
                'health_percentage_24h': node['health_percentage_24h'],
                'is_active': node['is_active'],
                'timestamp': datetime.utcnow().isoformat()
            }
            result = self.make_api_request('/api/report', method='POST', data=report_data)
            if result:
                logger.info(f"上报成功: {node['name']}")
                success_count += 1
            else:
                logger.error(f"上报失败: {node['name']}")
        logger.info(f"上报完成: 成功 {success_count}/{len(self.cached_nodes)}")

    def run_cycle(self):
        # 执行一次完整的监控周期 =======================================
        try:
            logger.info("=" * 60)
            logger.info("开始新的监控周期")
            logger.info("=" * 60)
            api_nodes = self.fetch_nodes_from_api()  # 1. 从API查询所有节点并缓存
            if api_nodes:
                self.sync_nodes(api_nodes)  # 2. 维护节点（增删）
                logger.info("等待健康检查执行...")  # 等待一小段时间让健康检查运行
                time.sleep(10)
                self.update_node_status()  # 3. 读取节点状态并更新缓存
                self.report_nodes()  # 4. 上报缓存数据
            else:
                logger.warning("未获取到API节点，跳过本次周期")
            logger.info("监控周期完成")
        except Exception as e:
            logger.error(f"监控周期执行出错: {str(e)}", exc_info=True)

    def run(self):
        # 运行监控程序 =======================================
        logger.info("启动EasyTier节点监控程序")
        logger.info(f"API地址: {self.api_base_url}")
        logger.info(f"本地Service地址: {self.local_api_url}")
        # 启动service =======================================
        if not self.start_service():
            logger.error("无法启动service，退出程序")
            return 1
        try:  # 主循环
            while self.running:
                self.run_cycle()
                logger.info("等待60秒后执行下一次监控...")  # 等待60秒
                for _ in range(60):
                    if not self.running:
                        break
                    time.sleep(1)
        except KeyboardInterrupt:
            logger.info("收到中断信号")
        except Exception as e:
            logger.error(f"程序运行出错: {str(e)}", exc_info=True)
        finally:
            self.stop_service()
            logger.info("监控程序已退出")
        return 0


def main():
    # 主函数 =======================================
    parser = argparse.ArgumentParser(
        description='EasyTier节点监控程序',
        epilog='示例: python Monitor.py https://your-api.com your_jwt_token'
    )
    parser.add_argument('api_url', help='API基础地址')
    parser.add_argument('jwt_token', help='JWT认证令牌')
    parser.add_argument('--log-level',
                        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                        default='INFO',
                        help='日志级别')
    args = parser.parse_args()
    # 设置日志级别 =======================================
    log_level = getattr(logging, args.log_level.upper())
    logger.setLevel(log_level)
    monitor = Monitor(args.api_url, args.jwt_token)  # 创建监控器

    # 信号处理 =======================================
    def signal_handler(signum, frame):
        logger.info(f"收到信号 {signum}，准备退出...")
        monitor.running = False

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    return monitor.run()  # 运行监控


if __name__ == '__main__':
    sys.exit(main())

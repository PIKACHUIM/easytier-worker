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
        # service 工作目录（包含 .env 和数据库文件）=======================================
        # 使用 record 子目录作为工作目录
        record_dir = os.path.join(current_dir, 'record')
        # 如果 record 目录不存在，则创建它
        if not os.path.exists(record_dir):
            os.makedirs(record_dir)
            logger.info(f"创建 record 目录: {record_dir}")
        self.service_work_dir = record_dir
        logger.info(f"Service工作目录设置为: {self.service_work_dir}")
        self.local_api_url = 'http://127.0.0.1:8080'  # 本地service API地址
        self.admin_token = None  # 本地service的admin token
        self.admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')  # 从环境变量读取或使用默认值

    def make_api_request(self, endpoint: str, method: str = 'GET',
                         data: Optional[Dict] = None, use_local: bool = False,
                         use_admin: bool = False) -> Optional[Dict]:
        # 发起API请求 =======================================
        if use_local:
            url = f"{self.local_api_url}{endpoint}"
            headers = {'Content-Type': 'application/json'}
            # 如果需要admin权限，添加admin token
            if use_admin and self.admin_token:
                headers['Authorization'] = f'Bearer {self.admin_token}'
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
            logger.info(f"Service工作目录: {self.service_work_dir}")
            # 启动进程 =======================================
            self.service_process = subprocess.Popen(
                [self.service_path],
                cwd=self.service_work_dir,
                env=os.environ.copy()
            )
            logger.info(f"Service进程已启动，PID: {self.service_process.pid}")
            # 检查进程是否立即退出 =======================================
            time.sleep(1)
            if self.service_process.poll() is not None:
                logger.error(f"Service进程启动后立即退出，退出码: {self.service_process.returncode}")
                return False
            if not self.wait_for_service():  # 等待服务启动
                return False
            # 登录获取admin token
            return self.login_admin()
        except Exception as e:
            logger.error(f"启动service失败: {str(e)}")
            return False

    def wait_for_service(self, timeout: int = 30) -> bool:
        # 等待service启动完成 =======================================
        logger.info("等待service启动...")
        start_time = time.time()
        endpoints_to_try = ['/health', '/api/health', '/api/nodes']
        while time.time() - start_time < timeout:
            # 检查进程是否还在运行 =======================================
            if self.service_process.poll() is not None:
                logger.error(f"Service进程已退出，退出码: {self.service_process.returncode}")
                return False
            # 尝试多个可能的健康检查端点 =======================================
            for endpoint in endpoints_to_try:
                try:
                    result = self.make_api_request(endpoint, use_local=True)
                    if result:
                        logger.info(f"Service启动成功（通过 {endpoint} 端点验证）")
                        return True
                except Exception as e:
                    logger.debug(f"尝试 {endpoint} 失败: {str(e)}")
            time.sleep(2)
        logger.error(f"Service启动超时（{timeout}秒）")
        return False

    def login_admin(self) -> bool:
        # 登录获取admin token =======================================
        logger.info("登录管理员账户...")
        login_data = {'password': self.admin_password}
        result = self.make_api_request('/api/admin/login', method='POST',
                                       data=login_data, use_local=True)
        if result and result.get('success'):
            token_data = result.get('data', {})
            self.admin_token = token_data.get('token')
            if self.admin_token:
                logger.info("管理员登录成功")
                return True
            else:
                logger.error("登录响应中未找到token")
        else:
            error_msg = result.get('error', '未知错误') if result else '请求失败'
            logger.error(f"管理员登录失败: {error_msg}")
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
        # 从API基础地址获取所有节点（作为数据源） =======================================
        logger.info("从API基础地址获取节点列表...")
        result = self.make_api_request('/api/nodes/all')
        if result and 'nodes' in result:
            nodes = result['nodes']
            logger.info(f"从API获取到 {len(nodes)} 个节点")
            # 输出第一个节点的数据结构用于调试
            if nodes:
                logger.debug(f"第一个节点的数据结构: {json.dumps(nodes[0], ensure_ascii=False, indent=2)}")
            return nodes
        logger.warning("从API获取节点列表失败")
        return []

    def get_local_nodes(self) -> List[Dict]:
        # 从本地service获取节点列表 =======================================
        logger.info("从本地service获取节点列表...")
        # 使用admin接口获取所有节点（包括未审核的）
        result = self.make_api_request('/api/admin/nodes', use_local=True, use_admin=True)
        if result and result.get('success') and 'data' in result:
            data = result['data']
            if isinstance(data, dict) and 'items' in data:
                nodes = data['items']
                logger.info(f"本地service有 {len(nodes)} 个节点")
                return nodes
            elif isinstance(data, list):
                # 如果直接返回列表
                logger.info(f"本地service有 {len(data)} 个节点")
                return data
        logger.warning("获取本地节点列表失败")
        return []

    def sync_nodes(self, api_nodes: List[Dict]):
        # 同步节点到本地service（以API节点为准） =======================================
        logger.info("开始同步节点...")
        local_nodes = self.get_local_nodes()  # 获取本地节点
        
        # 使用 (host, port, protocol) 三元组作为唯一标识，而不是ID
        # 因为API的ID和本地service的ID不一致
        def get_node_key(node, from_api=False):
            """获取节点的唯一标识 (host, port, protocol)"""
            if from_api:
                # 从API节点提取连接信息
                connections = node.get('connections', [])
                if connections and len(connections) > 0:
                    first_conn = connections[0]
                    host = first_conn.get('ip', '')
                    port = int(first_conn.get('port', 11010))
                    protocol = first_conn.get('type', 'TCP').lower()
                else:
                    host = node.get('ip_address', node.get('host', ''))
                    port = int(node.get('port', 11010))
                    protocol = node.get('protocol', 'tcp')
            else:
                # 从本地节点提取
                host = node.get('host', '')
                port = int(node.get('port', 11010))
                protocol = node.get('protocol', 'tcp')
            
            # 标准化协议名称
            if protocol.upper() in ['TCP', 'UDP', 'WG', 'WS', 'WSS']:
                protocol = protocol.lower()
            return (host, port, protocol)
        
        # 创建本地节点的索引：{(host, port, protocol): node}
        local_node_map = {}
        for node in local_nodes:
            key = get_node_key(node, from_api=False)
            if key[0]:  # 确保host不为空
                local_node_map[key] = node
        
        # 创建API节点的索引：{(host, port, protocol): node}
        api_node_map = {}
        for node in api_nodes:
            key = get_node_key(node, from_api=True)
            if key[0]:  # 确保host不为空
                api_node_map[key] = node
        
        logger.info(f"本地节点映射: {len(local_node_map)} 个有效节点")
        logger.info(f"API节点映射: {len(api_node_map)} 个有效节点")
        
        # 更新本地和API都存在的节点（如果数据不一致） =======================================
        updated_count = 0
        for node_key, api_node in api_node_map.items():
            if node_key in local_node_map:
                local_node = local_node_map[node_key]
                local_id = local_node.get('id')
                api_node_id = api_node.get('id', 'unknown')
                
                # 提取API节点的字段
                api_node_name = api_node.get('node_name', api_node.get('name', f"Node-{api_node_id}"))
                api_description = api_node.get('description', '').strip() or api_node.get('notes', '').strip() or '无描述'
                # API返回的是network_token，需要映射到本地的network_secret
                api_network_secret = api_node.get('network_token', api_node.get('network_secret', '')).strip() or ''
                api_network_name = api_node.get('network_name', 'default')
                api_version = api_node.get('version', '').strip() or 'unknown'
                api_max_connections = int(api_node.get('max_connections', 100))
                api_allow_relay = bool(api_node.get('allow_relay', True))
                api_qq_number = api_node.get('qq_number', '').strip()
                # wechat字段映射为report_token（上报令牌）
                api_wechat = api_node.get('report_token', api_node.get('wechat', '')).strip()
                # mail字段映射为user_email（用户邮箱）
                api_mail = api_node.get('user_email', api_node.get('mail', '')).strip()
                
                # 对比字段，构建更新数据
                update_data = {}
                
                if local_node.get('name') != api_node_name:
                    update_data['name'] = api_node_name
                if local_node.get('description') != api_description:
                    update_data['description'] = api_description
                if local_node.get('network_secret') != api_network_secret:
                    update_data['network_secret'] = api_network_secret
                if local_node.get('network_name') != api_network_name:
                    update_data['network_name'] = api_network_name
                if local_node.get('version') != api_version:
                    update_data['version'] = api_version
                if local_node.get('max_connections') != api_max_connections:
                    update_data['max_connections'] = api_max_connections
                if local_node.get('allow_relay') != api_allow_relay:
                    update_data['allow_relay'] = api_allow_relay
                if local_node.get('qq_number', '') != api_qq_number:
                    update_data['qq_number'] = api_qq_number
                if local_node.get('wechat', '') != api_wechat:
                    update_data['wechat'] = api_wechat
                if local_node.get('mail', '') != api_mail and api_mail and '@' in api_mail:
                    update_data['mail'] = api_mail
                
                # 如果有字段需要更新
                if update_data:
                    logger.info(f"检测到节点 {api_node_name} {node_key} 数据不一致，准备更新")
                    logger.debug(f"更新字段: {json.dumps(update_data, ensure_ascii=False)}")
                    
                    result = self.make_api_request(
                        f"/api/admin/nodes/{local_id}",
                        method='PUT',
                        data=update_data,
                        use_local=True,
                        use_admin=True
                    )
                    
                    if result and result.get('success'):
                        logger.info(f"更新节点成功: {api_node_name} {node_key} (本地ID: {local_id})")
                        updated_count += 1
                    else:
                        error_msg = result.get('error', '未知错误') if result else '请求失败'
                        logger.error(f"更新节点失败: {api_node_name} {node_key} - {error_msg}")
        
        # 添加API中存在但本地不存在的节点 =======================================
        added_count = 0
        for node_key, node in api_node_map.items():
            if node_key not in local_node_map:
                # 输出节点的完整数据用于调试
                api_node_id = node.get('id', 'unknown')
                logger.info(f"准备添加节点 {node_key}，API ID={api_node_id}")
                logger.debug(f"节点原始数据: {json.dumps(node, ensure_ascii=False)}")
                
                # 准备节点数据，符合 CreateNodeRequest 结构 =======================================
                # 从API节点数据中提取字段（注意字段名映射）
                node_name = node.get('node_name', node.get('name', f"Node-{api_node_id}"))
                
                # 从connections数组中提取IP和端口信息 =======================================
                host = None
                port = 11010
                protocol = 'tcp'
                
                connections = node.get('connections', [])
                if connections and len(connections) > 0:
                    # 使用第一个连接的信息
                    first_conn = connections[0]
                    host = first_conn.get('ip', '')
                    port = int(first_conn.get('port', 11010))
                    conn_type = first_conn.get('type', 'TCP').lower()
                    protocol = conn_type if conn_type in ['tcp', 'udp', 'wg', 'ws', 'wss'] else 'tcp'
                else:
                    # 如果没有connections数组，尝试从顶层字段获取（兼容旧格式）
                    host = node.get('ip_address', node.get('host', ''))
                    port = int(node.get('port', 11010))
                    protocol = node.get('protocol', 'tcp')
                
                if not host:
                    logger.warning(f"节点 {node_name} 缺少IP地址，跳过添加。可用字段: {list(node.keys())}")
                    continue
                
                # 构建符合CreateNodeRequest的数据结构
                node_data = {
                    'name': node_name,
                    'host': host,
                    'port': port,
                    'protocol': protocol,
                    'max_connections': int(node.get('max_connections', 100)),
                    'allow_relay': bool(node.get('allow_relay', True)),
                    'network_name': node.get('network_name', 'default'),
                    # 必填字段，提供默认值
                    'description': node.get('description', '').strip() or node.get('notes', '').strip() or '无描述',
                    # API返回的是network_token，需要映射到本地的network_secret
                    'network_secret': node.get('network_token', node.get('network_secret', '')).strip() or '',
                    'version': node.get('version', '').strip() or 'unknown',
                }
                
                # 联系方式字段（至少需要一个） =======================================
                qq_number = node.get('qq_number', '').strip()
                # wechat字段映射为report_token（上报令牌）
                wechat = node.get('report_token', node.get('wechat', '')).strip()
                # mail字段映射为user_email（用户邮箱）
                mail = node.get('user_email', node.get('mail', '')).strip()
                
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
                    new_node_data = result.get('data', {})
                    new_node_id = new_node_data.get('id', 'unknown')
                    logger.info(f"添加节点成功: {node_name} {node_key} (API ID: {api_node_id}, 本地ID: {new_node_id})")
                    added_count += 1
                else:
                    error_msg = result.get('error', '未知错误') if result else '请求失败'
                    logger.error(f"添加节点失败: {node_name} {node_key} - {error_msg}")
        
        # 删除本地存在但API中不存在的节点 =======================================
        removed_count = 0
        for node_key, local_node in local_node_map.items():
            if node_key not in api_node_map:
                local_id = local_node.get('id')
                node_name = local_node.get('name', f"Node-{local_id}")
                logger.info(f"准备删除节点: {node_name} {node_key} (本地ID: {local_id})")
                result = self.make_api_request(f"/api/nodes/{local_id}",
                                               method='DELETE', use_local=True)
                if result and result.get('success'):
                    logger.info(f"删除节点成功: {node_name} {node_key}")
                    removed_count += 1
                else:
                    error_msg = result.get('error', '未知错误') if result else '请求失败'
                    logger.error(f"删除节点失败: {node_name} {node_key} - {error_msg}")
        
        logger.info(f"节点同步完成: 更新 {updated_count} 个, 添加 {added_count} 个, 删除 {removed_count} 个")

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
        
        # 先从本地service获取完整的节点信息（包含mail和wechat字段）
        local_nodes = self.get_local_nodes()
        # 创建节点名称到节点信息的映射
        node_info_map = {node.get('name'): node for node in local_nodes}
        
        logger.info(f"开始上报 {len(self.cached_nodes)} 个节点的数据...")
        success_count = 0
        for node in self.cached_nodes:
            # 使用API要求的字段格式，添加空值检查
            health_percentage = node.get('health_percentage_24h') or 0.0
            response_time = node.get('response_time') or 0.0
            is_active = node.get('is_active', False)
            status = node.get('status', 'unknown')
            
            # 从本地节点信息中获取mail和wechat（report_token）
            node_name = node['name']
            local_node_info = node_info_map.get(node_name, {})
            user_email = local_node_info.get('mail', '')
            report_token = local_node_info.get('wechat', '')  # wechat字段存储的是report_token
            
            if not user_email or not report_token:
                logger.warning(f"节点 {node_name} 缺少必要的上报信息（email或token），跳过上报")
                continue
            
            report_data = {
                'node_name': node_name,
                'email': user_email,  # 使用节点的用户邮箱
                'token': report_token,  # 使用节点的report_token（存储在wechat字段）
                'current_bandwidth': response_time,  # 使用响应时间作为带宽指标
                'reported_traffic': health_percentage / 100.0,  # 将健康百分比转换为0-1的流量指标
                'connection_count': 1 if is_active else 0,  # 活跃状态转换为连接数
                'status': 'online' if status == 'healthy' else 'offline'  # 状态映射
            }
            # 输出上报数据用于调试
            logger.debug(f"上报数据: {json.dumps(report_data, ensure_ascii=False)}")
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
    # 同时设置根日志记录器的级别
    logging.getLogger().setLevel(log_level)
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

#!/usr/bin/env python3
# EasyTier 节点监控程序 (使用 checker.exe 版本) =======================================
# 功能：每1分钟使用checker.exe查询节点状态并上报数据
import argparse
import json
import logging
import os
import platform
import subprocess
import sys
import time
import re
import requests
from typing import Dict, List, Optional
from datetime import datetime
import signal

# 配置日志 =======================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MonitorNew:
    # EasyTier 节点监控器 (使用 checker.exe) =======================================
    def __init__(self, api_base_url: str, jwt_token: str):
        # 初始化监控器 =======================================
        self.api_base_url = api_base_url.rstrip('/')
        self.jwt_token = jwt_token
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        }
        self.cached_nodes = []  # 本地缓存的节点数据
        self.running = True  # 运行标志
        
        # 确定checker可执行文件路径 =======================================
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if platform.system() == 'Windows':
            self.checker_path = os.path.join(current_dir, 'checker.exe')
        else:
            self.checker_path = os.path.join(current_dir, 'checker')
        
        # 检查checker文件是否存在
        if not os.path.exists(self.checker_path):
            logger.error(f"Checker文件不存在: {self.checker_path}")
        else:
            logger.info(f"Checker路径: {self.checker_path}")

    def make_api_request(self, endpoint: str, method: str = 'GET',
                         data: Optional[Dict] = None) -> Optional[Dict]:
        # 发起API请求 =======================================
        url = f"{self.api_base_url}{endpoint}"
        headers = self.headers.copy()

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=10)
            else:
                response = requests.request(method, url, headers=headers, json=data, timeout=10)

            response.raise_for_status()
            # logger.info(f"响应内容: {response.text}")
            result = response.json()
            logger.debug(f"API请求成功: {method} {endpoint}")
            return result

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP错误 {e.response.status_code}: {method} {endpoint}")
            # logger.error(f"响应内容: {e.response.text}")
        except Exception as e:
            logger.error(f"API请求失败: {method} {endpoint} - {str(e)}")
            logger.error(f"错误详情: {e}")
            import traceback
            traceback.print_exc()
        return None

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

    def check_node_with_checker(self, node: Dict) -> Optional[Dict]:
        # 使用checker.exe检测单个节点状态 =======================================
        # 提取节点连接信息
        connections = node.get('connections', [])
        if connections and len(connections) > 0:
            first_conn = connections[0]
            host = first_conn.get('ip', '')
            port = first_conn.get('port', 11010)
            protocol = first_conn.get('type', 'TCP').lower()
        else:
            host = node.get('ip_address', node.get('host', ''))
            port = node.get('port', 11010)
            protocol = node.get('protocol', 'tcp')
        
        network_name = node.get('network_name', 'default')
        network_secret = node.get('network_token', node.get('network_secret', ''))
        node_name = node.get('node_name', node.get('name', 'unknown'))
        
        if not host or not network_secret:
            logger.warning(f"节点 {node_name} 缺少必要信息 (host或network_secret)")
            return None
        
        # 构建checker命令
        server_url = f"{protocol}://{host}:{port}"
        cmd = [
            self.checker_path,
            '--server', server_url,
            '--network-name', network_name,
            '--network-secret', network_secret
        ]
        
        logger.info(f"执行checker命令: {' '.join(cmd)}")
        
        try:
            # 执行checker.exe，指定UTF-8编码避免解码错误
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=10
            )
            
            output = result.stdout.strip()
            logger.debug(f"节点 {node_name} checker完整输出: {output}")
            
            # 过滤 ANSI 转义码（如终端颜色控制字符 \x1b[...m）
            ansi_escape = re.compile(r'\x1b\[[0-9;]*[a-zA-Z]')
            output = ansi_escape.sub('', output)
            
            # 遍历所有行，找第一个符合数据格式的行（忽略日志行）
            lines = output.split('\n')
            data_line = ''
            for line in lines:
                stripped = line.strip()
                parts_try = stripped.split()
                # 数据行格式: "1 100 0 0 0"，5个数字，第一个为0或1
                if len(parts_try) >= 5 and all(
                    p.replace('.', '', 1).lstrip('-').isdigit() for p in parts_try[:5]
                ):
                    data_line = stripped
                    break
            logger.debug(f"节点 {node_name} checker数据行: {data_line}")
            
            # 解析输出: "1 100 0 0 0" -> [在线状态, 连接数, 带宽, 阶梯, 流量]
            parts = data_line.split()
            if len(parts) >= 5:
                is_online = int(parts[0])
                connection_count = int(parts[1])
                bandwidth = float(parts[2])
                tier = float(parts[3])
                traffic = float(parts[4])
                
                return {
                    'node': node,
                    'is_online': is_online == 1,
                    'connection_count': connection_count,
                    'bandwidth': bandwidth,
                    'tier': tier,
                    'traffic': traffic,
                    'status': 'online' if is_online == 1 else 'offline',
                    'check_time': datetime.utcnow().isoformat()
                }
            else:
                logger.warning(f"节点 {node_name} checker输出格式不正确: {output}")
                return None
                
        except subprocess.TimeoutExpired:
            logger.error(f"节点 {node_name} checker执行超时")
            return None
        except Exception as e:
            logger.error(f"节点 {node_name} checker执行失败: {str(e)}")
            return None

    def check_all_nodes(self, nodes: List[Dict]) -> List[Dict]:
        # 检测所有节点状态 =======================================
        logger.info(f"开始检测 {len(nodes)} 个节点...")
        results = []
        
        for node in nodes:
            node_name = node.get('node_name', node.get('name', 'unknown'))
            logger.info(f"检测节点: {node_name}")
            
            check_result = self.check_node_with_checker(node)
            if check_result:
                results.append(check_result)
            else:
                # checker输出格式不正确或检测失败，跳过不上报
                logger.warning(f"节点 {node_name} checker输出格式不正确或检测失败，跳过上报")
        
        logger.info(f"检测完成: {len(results)} 个节点")
        return results

    def report_nodes(self, check_results: List[Dict]):
        # 上报节点数据到API =======================================
        if not check_results:
            logger.warning("没有检测结果可上报")
            return
        
        logger.info(f"开始上报 {len(check_results)} 个节点的数据...")
        success_count = 0
        
        for result in check_results:
            node = result['node']
            node_name = node.get('node_name', node.get('name', 'unknown'))
            
            # 获取上报所需的信息
            user_email = node.get('user_email', node.get('mail', ''))
            report_token = node.get('report_token', node.get('wechat', ''))
            
            if not user_email or not report_token:
                logger.warning(f"节点 {node_name} 缺少必要的上报信息（email或token），跳过上报")
                continue
            
            # 构建上报数据
            report_data = {
                'node_name': node_name,
                'email': user_email,
                'token': report_token,
                'current_bandwidth': result['bandwidth'],
                'reported_traffic': result['traffic'],
                'connection_count': result['connection_count'],
                'status': result['status']
            }
            
            logger.debug(f"上报数据: {json.dumps(report_data, ensure_ascii=False)}")
            
            api_result = self.make_api_request('/api/report', method='POST', data=report_data)
            if api_result:
                logger.info(f"上报成功: {node_name}")
                success_count += 1
            else:
                logger.error(f"上报失败: {node_name}")
        
        logger.info(f"上报完成: 成功 {success_count}/{len(check_results)}")

    def run_cycle(self):
        # 执行一次完整的监控周期 =======================================
        try:
            logger.info("=" * 60)
            logger.info("开始新的监控周期")
            logger.info("=" * 60)
            
            # 1. 从API查询所有节点
            api_nodes = self.fetch_nodes_from_api()
            
            if api_nodes:
                # 2. 使用checker检测所有节点状态
                check_results = self.check_all_nodes(api_nodes)
                
                # 3. 上报检测结果
                self.report_nodes(check_results)
            else:
                logger.warning("未获取到API节点，跳过本次周期")
            
            logger.info("监控周期完成")
            
        except Exception as e:
            logger.error(f"监控周期执行出错: {str(e)}", exc_info=True)

    def run(self):
        # 运行监控程序 =======================================
        logger.info("启动EasyTier节点监控程序 (checker版本)")
        logger.info(f"API地址: {self.api_base_url}")
        logger.info(f"Checker路径: {self.checker_path}")
        
        try:
            # 主循环
            while self.running:
                self.run_cycle()
                
                # 等待60秒
                logger.info("等待60秒后执行下一次监控...")
                for _ in range(60):
                    if not self.running:
                        break
                    time.sleep(1)
                    
        except KeyboardInterrupt:
            logger.info("收到中断信号")
        except Exception as e:
            logger.error(f"程序运行出错: {str(e)}", exc_info=True)
        finally:
            logger.info("监控程序已退出")
        
        return 0


def main():
    # 主函数 =======================================
    parser = argparse.ArgumentParser(
        description='EasyTier节点监控程序 (使用checker.exe)',
        epilog='示例: python monitor_new.py https://your-api.com your_jwt_token'
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
    logging.getLogger().setLevel(log_level)
    
    # 创建监控器
    monitor = MonitorNew(args.api_url, args.jwt_token)

    # 信号处理 =======================================
    def signal_handler(signum, frame):
        logger.info(f"收到信号 {signum}，准备退出...")
        monitor.running = False

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # 运行监控
    return monitor.run()


if __name__ == '__main__':
    sys.exit(main())
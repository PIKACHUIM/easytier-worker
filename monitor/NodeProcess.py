#!/usr/bin/env python3
"""
节点进程管理脚本 - 管理EasyTier节点进程
"""

import argparse
import logging
import sys
import signal
from NodeMonitor import NodeMonitor


# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """
    主函数 - 解析参数并启动节点监控
    """
    parser = argparse.ArgumentParser(
        description='节点进程管理脚本 - 获取节点信息并上报状态',
        epilog='示例: python NodeProcess.py https://your-domain.workers.dev your_jwt_token'
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
        return 0

    except KeyboardInterrupt:
        logger.info("脚本被用户中断")
        return 0
    except Exception as e:
        logger.error(f"脚本执行失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        # 确保清理资源
        if monitor:
            monitor._cleanup_all_processes()


if __name__ == '__main__':
    exit(main())
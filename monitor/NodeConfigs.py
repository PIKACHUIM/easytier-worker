import json
import os
from typing import Dict, Optional


class NodeMonitorConfig:
    """节点监控配置管理器"""

    def __init__(self, config_file: str = "node_monitor_config.json"):
        """
        初始化配置管理器

        Args:
            config_file: 配置文件路径
        """
        self.config_file = config_file
        self.config = self.load_config()

    def load_config(self) -> Dict:
        """
        加载配置文件

        Returns:
            配置字典
        """
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"加载配置文件失败: {e}")
                return self.get_default_config()
        else:
            return self.get_default_config()

    def get_default_config(self) -> Dict:
        """
        获取默认配置

        Returns:
            默认配置字典
        """
        return {
            "report_tokens": {},  # 存储节点名称到上报token的映射
            "connection_timeout": 5,
            "node_delay": 1,
            "max_retries": 3,
            "log_level": "INFO"
        }

    def save_config(self):
        """保存配置到文件"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"保存配置文件失败: {e}")

    def get_report_token(self, node_name: str) -> Optional[str]:
        """
        获取节点的上报token

        Args:
            node_name: 节点名称

        Returns:
            上报token或None
        """
        return self.config["report_tokens"].get(node_name)

    def set_report_token(self, node_name: str, token: str):
        """
        设置节点的上报token

        Args:
            node_name: 节点名称
            token: 上报token
        """
        self.config["report_tokens"][node_name] = token
        self.save_config()

    def get_connection_timeout(self) -> int:
        """获取连接超时时间"""
        return self.config.get("connection_timeout", 5)

    def get_node_delay(self) -> int:
        """获取节点间延迟时间"""
        return self.config.get("node_delay", 1)

    def get_max_retries(self) -> int:
        """获取最大重试次数"""
        return self.config.get("max_retries", 3)

    def get_log_level(self) -> str:
        """获取日志级别"""
        return self.config.get("log_level", "INFO")

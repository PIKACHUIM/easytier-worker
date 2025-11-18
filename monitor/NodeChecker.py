#!/usr/bin/env python3
"""
EasyTier节点健康检查器
简化版本，用于调试连接问题
"""

import asyncio
import json
import socket
import time
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from enum import Enum
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """健康状态枚举"""
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class NodeInfo:
    """节点信息"""
    node_id: int
    name: str
    protocol: str
    host: str
    port: int
    network_name: str
    network_secret: str


@dataclass
class HealthCheckResult:
    """健康检查结果"""
    node_id: int
    is_online: bool
    connection_count: int
    version: str
    response_time_ms: int
    error_message: Optional[str] = None


class EasyTierProtocolError(Exception):
    """EasyTier协议错误"""
    pass


class EasyTierHealthChecker:
    """EasyTier节点健康检查器"""
    
    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass
        
    async def _test_rpc_methods(self, host: str, port: int) -> Dict[str, Any]:
        """测试多种RPC方法获取详细信息"""
        methods_to_try = [
            "get_info",
            "get_peer_info", 
            "get_route_table",
            "get_network_summary"
        ]
        
        all_info = {}
        
        for method in methods_to_try:
            try:
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection(host, port),
                    timeout=self.timeout
                )
                
                try:
                    rpc_request = {
                        "jsonrpc": "2.0",
                        "method": method,
                        "params": {},
                        "id": method
                    }
                    request = json.dumps(rpc_request).encode() + b'\n'
                    writer.write(request)
                    await writer.drain()
                    
                    # 读取完整响应
                    response_data = b""
                    while True:
                        chunk = await asyncio.wait_for(
                            reader.read(4096),
                            timeout=self.timeout
                        )
                        if not chunk:
                            break
                        response_data += chunk
                        
                        # 检查是否收到完整JSON对象
                        try:
                            response_text = response_data.decode('utf-8', errors='ignore').strip()
                            if response_text.count('{') == response_text.count('}'):
                                break
                        except:
                            pass
                        
                        # 防止响应过大导致内存溢出
                        if len(response_data) > 65536:  # 64KB限制
                            break
                    
                    logger.debug(f"Raw response for {method}: {response_data[:200]}")
                    
                    if response_data:
                        response_text = response_data.decode('utf-8', errors='ignore').strip()
                        try:
                            response_json = json.loads(response_text)
                            if "result" in response_json:
                                all_info[method] = response_json["result"]
                                logger.debug(f"Got response for {method}: {str(response_json['result'])[:100]}")
                        except json.JSONDecodeError:
                            logger.debug(f"Failed to parse JSON for {method}")
                    
                finally:
                    writer.close()
                    await writer.wait_closed()
                    
            except Exception as e:
                logger.debug(f"Failed to call {method}: {e}")
                continue
        
        return all_info

    async def _test_connection(self, host: str, port: int) -> Dict[str, Any]:
        """测试连接并尝试获取信息"""
        try:
            # 创建 TCP 连接
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=self.timeout
            )
            
            try:
                # 发送更精确的JSON-RPC 2.0请求
                rpc_request = {
                    "jsonrpc": "2.0",
                    "method": "get_info",
                    "params": {},
                    "id": "health_check"
                }
                request = json.dumps(rpc_request).encode() + b'\n'
                writer.write(request)
                await writer.drain()
                
                # 读取完整响应
                response_data = b""
                while True:
                    chunk = await asyncio.wait_for(
                        reader.read(4096),
                        timeout=self.timeout
                    )
                    if not chunk:
                        break
                    response_data += chunk
                    
                    # 检查是否收到完整JSON对象
                    try:
                        response_text = response_data.decode('utf-8', errors='ignore').strip()
                        if response_text.count('{') == response_text.count('}'):
                            break
                    except:
                        pass
                
                logger.debug(f"Raw response from {host}:{port}: {response_data[:200]}")
                
                if response_data:
                    try:
                        response_text = response_data.decode('utf-8', errors='ignore').strip()
                        response_json = json.loads(response_text)
                        
                        # 严格验证响应格式
                        if "jsonrpc" not in response_json or response_json["jsonrpc"] != "2.0":
                            raise EasyTierProtocolError("Invalid JSON-RPC version")
                            
                        if "error" in response_json:
                            error = response_json["error"]
                            logger.warning(f"RPC error from {host}:{port}: {error.get('message', 'Unknown error')}")
                            return {
                                "status": "rpc_error",
                                "raw_response": response_text,
                                "error": error
                            }
                        
                        if "result" not in response_json:
                            raise EasyTierProtocolError("Missing 'result' in response")
                            
                        return {
                            "status": "connected",
                            "raw_response": response_text,
                            "parsed_response": response_json["result"]
                        }
                    except json.JSONDecodeError as e:
                        logger.debug(f"JSON解析失败: {e}")
                        return {"raw_response": str(response_data[:200]), "status": "invalid_format"}
                    except Exception as e:
                        logger.debug(f"响应处理失败: {e}")
                        return {"raw_response": str(response_data[:200]), "status": "invalid_format"}
                
                return {"status": "no_response"}
                
            finally:
                writer.close()
                await writer.wait_closed()
                
        except asyncio.TimeoutError:
            raise EasyTierProtocolError(f"Connection timeout to {host}:{port}")
        except socket.error as e:
            raise EasyTierProtocolError(f"Socket error: {e}")
        except Exception as e:
            raise EasyTierProtocolError(f"Unexpected error: {e}")
    
    async def check_node_health(self, protocol: str, host: str, port: int) -> HealthCheckResult:
        """检查节点健康状态"""
        start_time = time.time()
        node_id = hash(f"{host}:{port}") & 0x7fffffff
        
        try:
            # 基本连接测试
            basic_result = await self._test_connection(host, port)
            
            # 尝试获取更详细的信息
            detailed_info = await self._test_rpc_methods(host, port)
            
            response_time_ms = int((time.time() - start_time) * 1000)
            
            logger.info(f"Connected to {host}:{port}, methods tried: {list(detailed_info.keys())}")
            
            # 解析响应获取详细信息
            version = "unknown"
            connection_count = 0
            
            # 优先从详细信息中获取
            if "get_info" in detailed_info:
                info = detailed_info["get_info"]
                
                # 获取版本信息
                if "version" in info:
                    version = str(info["version"])
                    if "-" in version:
                        version = version.split("-")[0]
                
                # 获取连接数
                if "connected_peers" in info:
                    connection_count = len(info["connected_peers"])
                elif "peer_route_pairs" in info:
                    peer_route_pairs = info["peer_route_pairs"]
                    connection_count = sum(
                        1 for pair in peer_route_pairs 
                        if pair.get("peer") and pair["peer"].get("conns")
                    )
            
            elif basic_result.get("parsed_response"):
                # 回退到基本响应
                info = basic_result["parsed_response"]
                
                if "version" in info:
                    version = str(info["version"])
                    if "-" in version:
                        version = version.split("-")[0]
                
                if "connected_peers" in info:
                    connection_count = len(info["connected_peers"])
                elif "peer_route_pairs" in info:
                    peer_route_pairs = info["peer_route_pairs"]
                    connection_count = sum(
                        1 for pair in peer_route_pairs 
                        if pair.get("peer") and pair["peer"].get("conns")
                    )
            
            # 从 get_peer_info 中获取额外的连接信息
            if "get_peer_info" in detailed_info:
                peer_info = detailed_info["get_peer_info"]
                if isinstance(peer_info, list):
                    connection_count = max(connection_count, len(peer_info))
            
            logger.debug(f"Final info - version: {version}, connections: {connection_count}")
            
            return HealthCheckResult(
                node_id=node_id,
                is_online=True,
                connection_count=connection_count,
                version=version,
                response_time_ms=response_time_ms
            )
            
        except Exception as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            logger.error(f"Failed to connect to {host}:{port}: {e}")
            return HealthCheckResult(
                node_id=node_id,
                is_online=False,
                connection_count=0,
                version="unknown",
                response_time_ms=response_time_ms,
                error_message=str(e)
            )
    
    async def check_multiple_nodes(self, nodes: List[NodeInfo]) -> List[HealthCheckResult]:
        """批量检查多个节点的健康状态"""
        tasks = []
        for node in nodes:
            task = self.check_node_health(node.protocol, node.host, node.port)
            tasks.append(task)
        
        # 并行执行所有检查
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常结果
        health_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                node = nodes[i]
                health_results.append(HealthCheckResult(
                    node_id=node.node_id,
                    is_online=False,
                    connection_count=0,
                    version="unknown",
                    response_time_ms=0,
                    error_message=str(result)
                ))
            else:
                health_results.append(result)
        
        return health_results

    def print_health_result(self, result: HealthCheckResult):
        """打印健康检查结果"""
        status = "✅ 在线" if result.is_online else "❌ 离线"
        print(f"节点ID: {result.node_id}")
        print(f"状态: {status}")
        print(f"连接数: {result.connection_count}")
        print(f"版本: {result.version}")
        print(f"响应时间: {result.response_time_ms}ms")
        
        if result.is_online:
            if result.connection_count > 0:
                print(f"网络状态: 已连接到 {result.connection_count} 个对等节点")
            else:
                print("网络状态: 节点在线但未检测到对等连接")
            
            if result.version != "unknown":
                print(f"节点版本: {result.version}")
            else:
                print("⚠️  无法获取版本信息")
        else:
            print("网络状态: 节点离线")
        
        if result.error_message:
            print(f"错误信息: {result.error_message}")
        
        print("-" * 50)


# 使用示例
async def main():
    """主函数示例"""
    # 创建健康检查器
    async with EasyTierHealthChecker(timeout=5) as checker:
        # 检查单个节点
        print("=== 检查单个节点 ===")
        result = await checker.check_node_health("tcp", "127.0.0.1", 15888)
        checker.print_health_result(result)
        
        # 额外展示详细诊断信息
        print("\n=== 详细诊断信息 ===")
        if result.is_online:
            try:
                detailed_info = await checker._test_rpc_methods("127.0.0.1", 15888)
                print(f"可用的RPC方法: {list(detailed_info.keys())}")
                
                for method, info in detailed_info.items():
                    print(f"\n{method} 返回信息:")
                    print(f"  {str(info)[:200]}...")
                    
            except Exception as e:
                print(f"获取详细信息失败: {e}")
        else:
            print("节点离线，无法获取详细信息")
        
        # 批量检查示例
        print("\n\n=== 批量检查节点 ===")
        test_nodes = [
            NodeInfo(1, "本地节点", "tcp", "127.0.0.1", 15888, "test-net", "test-secret"),
            NodeInfo(2, "远程节点1", "tcp", "192.168.1.100", 15888, "test-net", "test-secret"),
            NodeInfo(3, "远程节点2", "tcp", "192.168.1.101", 15888, "test-net", "test-secret"),
        ]
        
        batch_results = await checker.check_multiple_nodes(test_nodes)
        
        for result in batch_results:
            checker.print_health_result(result)


if __name__ == "__main__":
    # 运行示例
    asyncio.run(main())
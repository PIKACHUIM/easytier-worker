"""
EdgeOne 云函数 - 批量节点检测
通过调用 Hono 主服务的 /api/edgeone/batch-check 接口批量检测节点在线状态

EdgeOne Pages Python 云函数入口：on_fetch
"""
import json
import os
from datetime import datetime, timezone


def verify_api_key(request):
    """验证 API Key"""
    api_key = os.environ.get('API_KEY', '')
    if not api_key:
        # 未配置 API Key，不鉴权
        return True

    request_key = request.headers.get('x-api-key', '')
    if not request_key:
        return False

    return request_key == api_key


def make_check_result(is_online=False, connection_count=0, latency_ms=-1,
                      check_time=None, error=None):
    """构造检测结果"""
    result = {
        'is_online': is_online,
        'connection_count': connection_count,
        'latency_ms': latency_ms,
        'check_time': check_time or datetime.now(timezone.utc).isoformat(),
    }
    if error:
        result['error'] = error
    return result


async def on_fetch(request, response):
    """
    EdgeOne 云函数入口 - 批量节点检测

    请求体（JSON）：
    {
        "nodes": [
            {
                "server": "tcp://1.2.3.4:11010",
                "network_name": "MyNetwork",
                "network_secret": "MyPassword"
            }
        ]
    }
    """
    # API Key 鉴权
    if not verify_api_key(request):
        return response.status(401).json({'error': '未授权：API Key 验证失败'})

    # 解析请求体
    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return response.status(400).json({'error': '无效的 JSON 请求体'})

    nodes = body.get('nodes', [])

    if not nodes or not isinstance(nodes, list):
        return response.status(400).json({'error': '缺少 nodes 字段或格式不正确'})

    if len(nodes) == 0:
        return response.status(400).json({'error': '节点列表不能为空'})

    if len(nodes) > 20:
        return response.status(400).json({'error': '单次批量检测最多支持 20 个节点'})

    # 验证每个节点的必填参数
    for i, node in enumerate(nodes):
        if not node.get('server') or not node.get('network_name') or not node.get('network_secret'):
            return response.status(400).json({
                'error': f'第 {i + 1} 个节点缺少必填参数 (server, network_name, network_secret)'
            })

    # 获取 Hono 主服务地址
    hono_api_url = os.environ.get('HONO_API_URL', '')
    if not hono_api_url:
        return response.status(500).json({
            'results': [make_check_result(error='未配置 HONO_API_URL 环境变量') for _ in nodes]
        })

    # 调用 Hono 主服务的批量检测接口
    try:
        import urllib.request

        hono_url = hono_api_url.rstrip('/') + '/api/edgeone/batch-check'
        headers = {
            'Content-Type': 'application/json',
        }

        # 携带 API Key
        api_key = os.environ.get('HONO_API_KEY', '')
        if api_key:
            headers['X-API-Key'] = api_key

        timeout = int(os.environ.get('CHECK_TIMEOUT', '30')) * 2  # 批量检测给更长的超时

        req_data = json.dumps({'nodes': nodes}).encode('utf-8')
        req = urllib.request.Request(hono_url, data=req_data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return response.json(data)

    except Exception as e:
        error_result = make_check_result(error=f'调用 Hono 批量检测接口失败: {str(e)}')
        return response.status(500).json({
            'results': [error_result for _ in nodes]
        })

"""
EdgeOne 云函数 - 单节点检测
通过调用 Hono 主服务的 /api/edgeone/check 接口检测节点在线状态

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
    EdgeOne 云函数入口 - 单节点检测

    请求参数（Query String）：
    - server: 节点连接地址（如 tcp://1.2.3.4:11010）
    - network_name: 网络名称
    - network_secret: 网络密码
    """
    # API Key 鉴权
    if not verify_api_key(request):
        return response.status(401).json({'error': '未授权：API Key 验证失败'})

    # 获取查询参数
    from urllib.parse import urlparse, parse_qs
    parsed = urlparse(request.url)
    params = parse_qs(parsed.query)

    server = params.get('server', [None])[0]
    network_name = params.get('network_name', [None])[0]
    network_secret = params.get('network_secret', [None])[0]

    # 参数校验
    if not server or not network_name or not network_secret:
        return response.status(400).json({
            'error': '缺少必填参数',
            'required': ['server', 'network_name', 'network_secret'],
            'example': '/api/edgeone/check?server=tcp://IP:PORT&network_name=xxx&network_secret=xxx',
        })

    # 获取 Hono 主服务地址
    hono_api_url = os.environ.get('HONO_API_URL', '')
    if not hono_api_url:
        # 没有配置 Hono API 地址，返回错误
        return response.status(500).json(
            make_check_result(error='未配置 HONO_API_URL 环境变量')
        )

    # 调用 Hono 主服务的检测接口
    try:
        import urllib.request

        hono_url = hono_api_url.rstrip('/') + f'/api/edgeone/check?server={server}&network_name={network_name}&network_secret={network_secret}'
        headers = {
            'Content-Type': 'application/json',
        }

        # 携带 API Key
        api_key = os.environ.get('HONO_API_KEY', '')
        if api_key:
            headers['X-API-Key'] = api_key

        timeout = int(os.environ.get('CHECK_TIMEOUT', '30'))

        req = urllib.request.Request(hono_url, headers=headers, method='GET')
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return response.json(data)

    except Exception as e:
        return response.status(500).json(
            make_check_result(error=f'调用 Hono 检测接口失败: {str(e)}')
        )

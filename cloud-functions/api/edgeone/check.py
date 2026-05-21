"""
EdgeOne 云函数 - 单节点检测
通过调用 Hono 主服务的 /api/edgeone/check 接口检测节点在线状态

EdgeOne Pages Python 云函数入口：on_fetch
"""
import json
import os
import sys
import traceback
from datetime import datetime, timezone


def _make_response(response, data, status_code=200):
    """
    安全地构造响应，兼容多种 EdgeOne Python 运行时 API 形式
    """
    json_str = json.dumps(data, ensure_ascii=False)

    # 方式1: response.json(data) / response.status(code).json(data)
    try:
        if status_code == 200:
            return response.json(data)
        else:
            return response.status(status_code).json(data)
    except Exception:
        pass

    # 方式2: response(body, status=code, headers={...})
    try:
        return response(json_str, status=status_code, headers={'Content-Type': 'application/json'})
    except Exception:
        pass

    # 方式3: 返回 dict
    try:
        return {
            'statusCode': status_code,
            'headers': {'Content-Type': 'application/json'},
            'body': json_str,
        }
    except Exception:
        pass

    return json_str


def verify_api_key(request):
    """验证 API Key"""
    try:
        api_key = os.environ.get('API_KEY', '')
        if not api_key:
            return True

        request_key = ''
        try:
            request_key = request.headers.get('x-api-key', '')
        except Exception:
            try:
                request_key = request.headers.get('X-Api-Key', '')
            except Exception:
                pass

        if not request_key:
            return False

        return request_key == api_key
    except Exception:
        return True


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
    try:
        # API Key 鉴权
        if not verify_api_key(request):
            return _make_response(response, {'error': '未授权：API Key 验证失败'}, 401)

        # 获取查询参数
        from urllib.parse import urlparse, parse_qs

        # 尝试多种方式获取 URL
        url = ''
        try:
            url = request.url
        except Exception:
            try:
                url = request.path
            except Exception:
                pass

        parsed = urlparse(url)
        params = parse_qs(parsed.query)

        server = params.get('server', [None])[0]
        network_name = params.get('network_name', [None])[0]
        network_secret = params.get('network_secret', [None])[0]

        # 参数校验
        if not server or not network_name or not network_secret:
            return _make_response(response, {
                'error': '缺少必填参数',
                'required': ['server', 'network_name', 'network_secret'],
                'example': '/api/edgeone/check?server=tcp://IP:PORT&network_name=xxx&network_secret=xxx',
            }, 400)

        # 获取 Hono 主服务地址
        hono_api_url = os.environ.get('HONO_API_URL', '')
        if not hono_api_url:
            return _make_response(response, make_check_result(error='未配置 HONO_API_URL 环境变量'), 500)

        # 调用 Hono 主服务的检测接口
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
            return _make_response(response, data)

    except Exception as e:
        error_detail = {
            'error': f'云函数执行异常: {str(e)}',
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc(),
            'python_version': sys.version,
        }
        try:
            return _make_response(response, error_detail, 500)
        except Exception:
            return json.dumps(error_detail, ensure_ascii=False)
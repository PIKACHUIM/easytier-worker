"""
EdgeOne 云函数 - 健康状态检查
返回云函数服务自身的健康状态信息

EdgeOne Pages Python 云函数入口：on_fetch
"""
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


async def on_fetch(request, response):
    """
    EdgeOne 云函数入口 - 健康状态检查
    """
    # API Key 鉴权
    if not verify_api_key(request):
        return response.status(401).json({'error': '未授权：API Key 验证失败'})

    hono_api_url = os.environ.get('HONO_API_URL', '')

    return response.json({
        'status': 'ok',
        'service': 'edgeone-check',
        'mode': 'proxy' if hono_api_url else 'standalone',
        'hono_api_configured': bool(hono_api_url),
        'timestamp': datetime.now(timezone.utc).isoformat(),
    })

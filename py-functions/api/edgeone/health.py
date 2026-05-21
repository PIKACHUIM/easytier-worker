"""
EdgeOne 云函数 - 健康状态检查
返回云函数服务自身的健康状态信息

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
    尝试多种方式返回 JSON 响应
    """
    json_str = json.dumps(data, ensure_ascii=False)

    # 方式1: response.json(data) - 链式调用
    try:
        if status_code == 200:
            return response.json(data)
        else:
            return response.status(status_code).json(data)
    except Exception:
        pass

    # 方式2: response(json_str, status=status_code, headers={...})
    try:
        return response(json_str, status=status_code, headers={'Content-Type': 'application/json'})
    except Exception:
        pass

    # 方式3: 直接返回 Response 对象（类似 Cloudflare Workers）
    try:
        from http import HTTPStatus
        return {
            'statusCode': status_code,
            'headers': {'Content-Type': 'application/json'},
            'body': json_str,
        }
    except Exception:
        pass

    # 方式4: 返回字符串
    return json_str


def verify_api_key(request):
    """验证 API Key"""
    try:
        api_key = os.environ.get('API_KEY', '')
        if not api_key:
            # 未配置 API Key，不鉴权
            return True

        # 尝试多种方式获取 header
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
        # 鉴权出错时放行
        return True


async def on_fetch(request, response):
    """
    EdgeOne 云函数入口 - 健康状态检查
    """
    try:
        # API Key 鉴权
        if not verify_api_key(request):
            return _make_response(response, {'error': '未授权：API Key 验证失败'}, 401)

        hono_api_url = os.environ.get('HONO_API_URL', '')

        # 收集运行时环境信息，帮助调试
        runtime_info = {
            'python_version': sys.version,
            'platform': sys.platform,
            'request_type': str(type(request)),
            'response_type': str(type(response)),
        }

        # 尝试获取 request 的属性列表
        try:
            runtime_info['request_attrs'] = [a for a in dir(request) if not a.startswith('_')][:20]
        except Exception:
            pass

        # 尝试获取 response 的属性列表
        try:
            runtime_info['response_attrs'] = [a for a in dir(response) if not a.startswith('_')][:20]
        except Exception:
            pass

        return _make_response(response, {
            'status': 'ok',
            'service': 'edgeone-check',
            'mode': 'proxy' if hono_api_url else 'standalone',
            'hono_api_configured': bool(hono_api_url),
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'runtime_info': runtime_info,
        })

    except Exception as e:
        # 顶层异常捕获 - 返回详细错误信息
        error_detail = {
            'error': f'云函数执行异常: {str(e)}',
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc(),
            'python_version': sys.version,
            'platform': sys.platform,
        }

        # 尝试用最简单的方式返回错误
        try:
            return _make_response(response, error_detail, 500)
        except Exception:
            # 如果连 _make_response 都失败了，返回纯字符串
            return json.dumps(error_detail, ensure_ascii=False)
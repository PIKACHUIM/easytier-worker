"""
EdgeOne Pages Python 云函数 - 健康状态检查
路由: GET /api/edgeone/health

参考 EdgeOne 官方文档：https://pages.edgeone.ai/document/python
入口规范：class handler(BaseHTTPRequestHandler) + do_GET / do_POST
"""
import json
import os
import sys
import traceback
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler


def _verify_api_key(headers):
    """验证 API Key（如未配置 API_KEY 环境变量则不鉴权）"""
    try:
        api_key = os.environ.get('API_KEY', '')
        if not api_key:
            return True
        request_key = headers.get('x-api-key') or headers.get('X-Api-Key') or ''
        return request_key == api_key
    except Exception:
        return True


def _build_payload():
    hono_api_url = os.environ.get('HONO_API_URL', '')
    return {
        'status': 'ok',
        'service': 'edgeone-check',
        'mode': 'proxy' if hono_api_url else 'standalone',
        'hono_api_configured': bool(hono_api_url),
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'python_version': sys.version,
    }


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, x-api-key')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {'ok': True})

    def do_GET(self):
        try:
            if not _verify_api_key(self.headers):
                self._send_json(401, {'error': '未授权：API Key 验证失败'})
                return
            self._send_json(200, _build_payload())
        except Exception as e:
            self._send_json(500, {
                'error': f'云函数执行异常: {type(e).__name__}: {str(e)}',
                'traceback': traceback.format_exc(),
            })

    # 静默 BaseHTTPRequestHandler 默认日志
    def log_message(self, format, *args):
        return
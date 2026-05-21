"""
EdgeOne Pages Python 云函数 - 单节点检测
路由: GET /api/edgeone/check?server=tcp://IP:PORT&network_name=xxx&network_secret=xxx

通过 EasyTier 协议握手检测节点在线状态（与 batch-check.py 共享底层实现）
参考 EdgeOne 官方文档：https://pages.edgeone.ai/document/python
"""
import json
import os
import sys
import traceback
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# 复用 batch-check.py 中的 EasyTier 协议检测函数
# 注意：EdgeOne 平台同目录下的 .py 文件可以相互 import
try:
    # 动态导入 batch-check 模块（文件名带连字符，需要用 importlib）
    import importlib.util
    _spec = importlib.util.spec_from_file_location(
        'batch_check_mod',
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'batch-check.py')
    )
    _bc = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_bc)
    check_node_via_easytier = _bc.check_node_via_easytier
except Exception:
    check_node_via_easytier = None


def _verify_api_key(headers):
    try:
        api_key = os.environ.get('API_KEY', '')
        if not api_key:
            return True
        request_key = headers.get('x-api-key') or headers.get('X-Api-Key') or ''
        return request_key == api_key
    except Exception:
        return True


def _make_check_result(is_online=False, connection_count=0, latency_ms=-1, error=None):
    result = {
        'is_online': is_online,
        'connection_count': connection_count,
        'latency_ms': latency_ms,
        'check_time': datetime.now(timezone.utc).isoformat(),
    }
    if error:
        result['error'] = error
    return result


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

            # 解析 Query 参数
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)

            server = (params.get('server') or [None])[0]
            network_name = (params.get('network_name') or [None])[0]
            network_secret = (params.get('network_secret') or [None])[0]

            if not server or not network_name or not network_secret:
                self._send_json(400, {
                    'error': '缺少必填参数',
                    'required': ['server', 'network_name', 'network_secret'],
                    'example': '/api/edgeone/check?server=tcp://IP:PORT&network_name=xxx&network_secret=xxx',
                })
                return

            # 优先：直接通过 EasyTier 协议检测
            if check_node_via_easytier is not None:
                timeout_sec = int(os.environ.get('CHECK_TIMEOUT', '15'))
                try:
                    is_online, conn_count, latency_ms, error = check_node_via_easytier(
                        server, network_name, network_secret, timeout_sec
                    )
                    self._send_json(200, _make_check_result(
                        is_online=is_online,
                        connection_count=conn_count,
                        latency_ms=latency_ms,
                        error=error,
                    ))
                    return
                except Exception as e:
                    self._send_json(200, _make_check_result(
                        error=f'EasyTier 协议检测异常: {type(e).__name__}: {str(e)}'
                    ))
                    return

            # 备用：转发到 Hono 主服务
            hono_api_url = os.environ.get('HONO_API_URL', '')
            if not hono_api_url:
                self._send_json(500, _make_check_result(
                    error='未配置 HONO_API_URL 环境变量，且 EasyTier 协议模块加载失败'
                ))
                return

            import urllib.request
            from urllib.parse import quote
            hono_url = (
                hono_api_url.rstrip('/')
                + '/api/edgeone/check'
                + f'?server={quote(server, safe="")}'
                + f'&network_name={quote(network_name, safe="")}'
                + f'&network_secret={quote(network_secret, safe="")}'
            )
            headers = {'Content-Type': 'application/json'}
            api_key = os.environ.get('HONO_API_KEY', '')
            if api_key:
                headers['X-API-Key'] = api_key

            timeout = int(os.environ.get('CHECK_TIMEOUT', '30'))
            req = urllib.request.Request(hono_url, headers=headers, method='GET')
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                self._send_json(200, data)

        except Exception as e:
            self._send_json(500, {
                'error': f'云函数执行异常: {type(e).__name__}: {str(e)}',
                'traceback': traceback.format_exc(),
                'python_version': sys.version,
            })

    def log_message(self, format, *args):
        return
"""
EdgeOne Pages Python 云函数 - 网络能力诊断
路由: GET /api/edgeone/probe?host=IP&port=PORT

依次测试以下网络能力，定位「为什么 batch-check / check 在线上一直超时」：
  1) DNS 解析（getaddrinfo）
  2) HTTPS 出站（urllib 访问 https://www.qq.com）
  3) TCP 80   (公认开放)
  4) TCP 443  (公认开放)
  5) TCP 53   (DNS over TCP)
  6) TCP <user-port>  (用户传入的目标节点端口)
  7) TCP 1.1.1.1:443 等已知 IP

返回每一步的：success / error_type / latency_ms

使用：
  GET /api/edgeone/probe?host=103.40.14.12&port=61040
"""
import json
import os
import socket
import sys
import time
import traceback
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request


def _verify_api_key(headers):
    try:
        api_key = os.environ.get('API_KEY', '')
        if not api_key:
            return True
        request_key = headers.get('x-api-key') or headers.get('X-Api-Key') or ''
        return request_key == api_key
    except Exception:
        return True


def _try_tcp(host, port, timeout=5):
    """尝试 TCP 连接，返回探测结果 dict"""
    start = time.time()
    sock = None
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((host, port))
        latency = int((time.time() - start) * 1000)
        return {
            'target': f'{host}:{port}',
            'success': True,
            'latency_ms': latency,
        }
    except socket.timeout:
        return {
            'target': f'{host}:{port}',
            'success': False,
            'latency_ms': int((time.time() - start) * 1000),
            'error_type': 'timeout',
            'error': '连接超时（很可能被 egress 防火墙静默丢弃）',
        }
    except ConnectionRefusedError:
        return {
            'target': f'{host}:{port}',
            'success': False,
            'latency_ms': int((time.time() - start) * 1000),
            'error_type': 'refused',
            'error': '连接被拒绝（说明出站不被拦截，但目标端口未开放）',
        }
    except OSError as e:
        return {
            'target': f'{host}:{port}',
            'success': False,
            'latency_ms': int((time.time() - start) * 1000),
            'error_type': 'oserror',
            'errno': getattr(e, 'errno', None),
            'error': f'OSError: {str(e)}（可能是 socket 被禁用 / 权限不足 / 平台限制）',
        }
    except Exception as e:
        return {
            'target': f'{host}:{port}',
            'success': False,
            'latency_ms': int((time.time() - start) * 1000),
            'error_type': type(e).__name__,
            'error': str(e),
        }
    finally:
        if sock:
            try:
                sock.close()
            except Exception:
                pass


def _try_dns(host):
    start = time.time()
    try:
        infos = socket.getaddrinfo(host, None, socket.AF_INET)
        ips = list({i[4][0] for i in infos})
        return {
            'target': host,
            'success': True,
            'ips': ips,
            'latency_ms': int((time.time() - start) * 1000),
        }
    except Exception as e:
        return {
            'target': host,
            'success': False,
            'error_type': type(e).__name__,
            'error': str(e),
            'latency_ms': int((time.time() - start) * 1000),
        }


def _try_https(url, timeout=5):
    start = time.time()
    try:
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return {
                'url': url,
                'success': True,
                'http_status': resp.status,
                'latency_ms': int((time.time() - start) * 1000),
            }
    except Exception as e:
        return {
            'url': url,
            'success': False,
            'error_type': type(e).__name__,
            'error': str(e),
            'latency_ms': int((time.time() - start) * 1000),
        }


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, data):
        body = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, x-api-key')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
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

            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            user_host = (params.get('host') or [None])[0]
            user_port_str = (params.get('port') or [None])[0]
            user_port = int(user_port_str) if user_port_str and user_port_str.isdigit() else None

            report = {
                'service': 'edgeone-network-probe',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'python_version': sys.version,
                'platform': sys.platform,
                'tests': {},
            }

            # 1) DNS 测试
            report['tests']['dns_resolve'] = _try_dns('www.qq.com')

            # 2) HTTPS 出站
            report['tests']['https_qq'] = _try_https('https://www.qq.com', timeout=5)
            report['tests']['https_cloudflare'] = _try_https('https://1.1.1.1', timeout=5)

            # 3) 标准端口 TCP 测试
            report['tests']['tcp_qq_443'] = _try_tcp('www.qq.com', 443, timeout=5)
            report['tests']['tcp_qq_80'] = _try_tcp('www.qq.com', 80, timeout=5)
            report['tests']['tcp_cloudflare_443'] = _try_tcp('1.1.1.1', 443, timeout=5)
            report['tests']['tcp_google_dns_53'] = _try_tcp('8.8.8.8', 53, timeout=5)

            # 4) 用户传入的目标节点
            if user_host and user_port:
                report['tests']['tcp_user_target'] = _try_tcp(user_host, user_port, timeout=8)
                # 同时测试同主机的 443 端口，对比验证
                report['tests']['tcp_user_host_443'] = _try_tcp(user_host, 443, timeout=5)

            # 5) 给出结论
            t = report['tests']
            verdict = []
            if t.get('dns_resolve', {}).get('success'):
                verdict.append('✅ DNS 正常')
            else:
                verdict.append('❌ DNS 解析失败')
            if t.get('https_qq', {}).get('success'):
                verdict.append('✅ HTTPS(443) 出站正常')
            else:
                verdict.append('❌ HTTPS(443) 出站被拦截')
            tcp_443 = t.get('tcp_qq_443', {}).get('success') or t.get('tcp_cloudflare_443', {}).get('success')
            verdict.append('✅ 原始 TCP→443 可用' if tcp_443 else '❌ 原始 TCP→443 不可用（socket 被禁）')
            if user_host and user_port:
                user_ok = t.get('tcp_user_target', {}).get('success')
                user_443 = t.get('tcp_user_host_443', {}).get('success')
                if user_ok:
                    verdict.append(f'✅ 目标 {user_host}:{user_port} 可达')
                elif user_443:
                    verdict.append(f'❌ 目标 {user_host}:{user_port} 不可达，但同主机 443 可达 → **EdgeOne egress 防火墙拦截了非标准端口**')
                else:
                    verdict.append(f'❌ 目标 {user_host}:{user_port} 不可达，同主机 443 也不可达 → **EdgeOne 不允许任意 TCP 出站**')
            report['verdict'] = verdict

            self._send_json(200, report)
        except Exception as e:
            self._send_json(500, {
                'error': f'云函数执行异常: {type(e).__name__}: {str(e)}',
                'traceback': traceback.format_exc(),
            })

    def log_message(self, format, *args):
        return

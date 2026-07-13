"""
EdgeOne 云函数 - 批量节点检测（带连接数获取）
通过 EasyTier 协议握手 + RPC 获取节点在线状态和真实连接数

实现原理：
1. TCP 连接到目标 EasyTier 节点
2. 实现 EasyTier 帧协议（TCPTunnelHeader + PeerManagerHeader + Payload）
3. 发送 HandshakeRequest（protobuf 编码）完成握手
4. 握手成功后发送 ListPeer RPC 请求获取 peer 列表
5. 从 peer 列表中计算真实连接数

参考：EasyTierCore/easytier/src/peers/peer_conn.rs
      EasyTierCore/easytier/src/tunnel/packet_def.rs
      EasyTierCore/easytier/src/proto/peer_rpc.proto
      EasyTierCore/easytier/src/proto/api_instance.proto

EdgeOne Pages Python 云函数入口：class handler(BaseHTTPRequestHandler)
路由：POST /api/edgeone/batch-check
"""
import json
import os
import struct
import socket
import random
import sys
import time
import traceback
from datetime import datetime, timezone


# ============================================================
# EasyTier 协议常量
# ============================================================

# 握手魔数和版本
EASYTIER_MAGIC = 0xd1e1a5e1
EASYTIER_VERSION = 1

# PeerManagerHeader 中的 packet_type
PACKET_TYPE_HANDSHAKE = 2
PACKET_TYPE_RPC_REQ = 8
PACKET_TYPE_RPC_RESP = 9

# PeerManagerHeader.flags 位（参考 packet_def.rs::PeerManagerHeaderFlags）
PEER_MANAGER_FLAG_ENCRYPTED = 0x01

# AES-GCM 尾部预留长度：tag(16) + nonce(12)
# 参考 packet_def.rs::AesGcmTail
AES_GCM_ENCRYPTION_RESERVED = 28

# TCP 帧头大小
TCP_TUNNEL_HEADER_SIZE = 4  # u32 LE (len)
# PeerManagerHeader 大小: from_peer_id(4) + to_peer_id(4) + packet_type(1) + flags(1) + forward_counter(1) + reserved(1) + len(4) = 16
PEER_MANAGER_HEADER_SIZE = 16

# NetworkSecretDigest 大小 (blake3 hash 的前 32 字节)
NETWORK_SECRET_DIGEST_SIZE = 32


# ============================================================
# Protobuf 手动编码/解码（避免依赖 protobuf 库）
# ============================================================

def encode_varint(value):
    """编码 varint"""
    result = bytearray()
    while value > 0x7F:
        result.append((value & 0x7F) | 0x80)
        value >>= 7
    result.append(value & 0x7F)
    return bytes(result)


def decode_varint(data, offset):
    """解码 varint，返回 (value, new_offset)"""
    result = 0
    shift = 0
    while offset < len(data):
        byte = data[offset]
        result |= (byte & 0x7F) << shift
        offset += 1
        if not (byte & 0x80):
            break
        shift += 7
    return result, offset


def encode_protobuf_field(field_number, wire_type, value):
    """编码单个 protobuf 字段"""
    tag = (field_number << 3) | wire_type
    result = encode_varint(tag)

    if wire_type == 0:  # varint
        result += encode_varint(value)
    elif wire_type == 2:  # length-delimited
        if isinstance(value, str):
            value = value.encode('utf-8')
        result += encode_varint(len(value))
        result += value

    return result


def decode_protobuf_fields(data):
    """解码 protobuf 消息为字段列表 [(field_number, wire_type, value)]"""
    fields = []
    offset = 0
    while offset < len(data):
        tag, offset = decode_varint(data, offset)
        field_number = tag >> 3
        wire_type = tag & 0x07

        if wire_type == 0:  # varint
            value, offset = decode_varint(data, offset)
            fields.append((field_number, wire_type, value))
        elif wire_type == 2:  # length-delimited
            length, offset = decode_varint(data, offset)
            value = data[offset:offset + length]
            offset += length
            fields.append((field_number, wire_type, value))
        elif wire_type == 5:  # 32-bit
            value = struct.unpack_from('<I', data, offset)[0]
            offset += 4
            fields.append((field_number, wire_type, value))
        elif wire_type == 1:  # 64-bit
            value = struct.unpack_from('<Q', data, offset)[0]
            offset += 8
            fields.append((field_number, wire_type, value))
        else:
            break  # 未知 wire_type，停止解析

    return fields


def get_pb_field(fields, field_number, wire_type=None):
    """从 decode_protobuf_fields 的结果中取第一个匹配字段的值（无则 None）"""
    for fn, wt, val in fields:
        if fn == field_number and (wire_type is None or wt == wire_type):
            return val
    return None


def get_pb_fields_all(fields, field_number, wire_type=None):
    """从 decode_protobuf_fields 的结果中取所有匹配字段的值列表"""
    return [val for fn, wt, val in fields
            if fn == field_number and (wire_type is None or wt == wire_type)]


# ============================================================
# EasyTier 协议实现
# ============================================================

class _SipHasher13:
    """
    SipHash-1-3 实现，与 Rust std::collections::hash_map::DefaultHasher 一致
    参考：EasyTierCore/easytier/src/tunnel/mod.rs - generate_digest_from_str
    """

    def __init__(self, k0=0, k1=0):
        self.v0 = k0 ^ 0x736f6d6570736575
        self.v1 = k1 ^ 0x646f72616e646f6d
        self.v2 = k0 ^ 0x6c7967656e657261
        self.v3 = k1 ^ 0x7465646279746573
        self._buf = bytearray()
        self._total_len = 0

    @staticmethod
    def _rotl(x, b):
        return ((x << b) | (x >> (64 - b))) & 0xFFFFFFFFFFFFFFFF

    def _sipround(self, v0, v1, v2, v3):
        v0 = (v0 + v1) & 0xFFFFFFFFFFFFFFFF
        v1 = self._rotl(v1, 13); v1 ^= v0; v0 = self._rotl(v0, 32)
        v2 = (v2 + v3) & 0xFFFFFFFFFFFFFFFF
        v3 = self._rotl(v3, 16); v3 ^= v2
        v0 = (v0 + v3) & 0xFFFFFFFFFFFFFFFF
        v3 = self._rotl(v3, 21); v3 ^= v0
        v2 = (v2 + v1) & 0xFFFFFFFFFFFFFFFF
        v1 = self._rotl(v1, 17); v1 ^= v2; v2 = self._rotl(v2, 32)
        return v0, v1, v2, v3

    def write(self, data):
        """追加数据到 hasher（流式写入）"""
        self._buf.extend(data)
        self._total_len += len(data)
        while len(self._buf) >= 8:
            m = struct.unpack_from('<Q', self._buf, 0)[0]
            self._buf = self._buf[8:]
            self.v3 ^= m
            self.v0, self.v1, self.v2, self.v3 = self._sipround(
                self.v0, self.v1, self.v2, self.v3)
            self.v0 ^= m

    def finish(self):
        """计算最终哈希值（不修改内部状态）"""
        v0, v1, v2, v3 = self.v0, self.v1, self.v2, self.v3
        buf = bytes(self._buf)
        m = (self._total_len % 256) << 56
        for i, b in enumerate(buf):
            m |= b << (8 * i)
        v3 ^= m
        v0, v1, v2, v3 = self._sipround(v0, v1, v2, v3)
        v0 ^= m
        v2 ^= 0xFF
        for _ in range(3):
            v0, v1, v2, v3 = self._sipround(v0, v1, v2, v3)
        return (v0 ^ v1 ^ v2 ^ v3) & 0xFFFFFFFFFFFFFFFF


def compute_network_secret_digest(network_name, network_secret):
    """
    计算网络密钥摘要 - 与 Rust EasyTier 的 generate_digest_from_str 完全一致

    算法：使用 SipHash-1-3（Rust DefaultHasher），流式写入 network_name 和 network_secret，
    然后迭代生成 32 字节 digest：每次 finish() 得到 8 字节，再 write 回已生成的 digest。
    """
    hasher = _SipHasher13()
    hasher.write(network_name.encode('utf-8'))
    hasher.write(network_secret.encode('utf-8'))

    digest = bytearray(NETWORK_SECRET_DIGEST_SIZE)
    for i in range(NETWORK_SECRET_DIGEST_SIZE // 8):
        h = hasher.finish()
        struct.pack_into('>Q', digest, i * 8, h)
        hasher.write(bytes(digest[:(i + 1) * 8]))

    return bytes(digest)


def derive_aes_128_key(network_secret):
    """
    与 Rust EasyTier global_ctx.rs::get_128_key 完全一致：
        let mut hasher = DefaultHasher::new();         // SipHash-1-3, k0=k1=0
        hasher.write(secret.as_bytes());
        key[0..8]  = hasher.finish().to_be_bytes();
        hasher.write(&key[0..8]);
        key[8..16] = hasher.finish().to_be_bytes();
        return key
    注意：与 digest 不同，这里不使用 network_name。
    """
    hasher = _SipHasher13()
    hasher.write(network_secret.encode('utf-8'))
    key = bytearray(16)
    h1 = hasher.finish()
    struct.pack_into('>Q', key, 0, h1)
    hasher.write(bytes(key[0:8]))
    h2 = hasher.finish()
    struct.pack_into('>Q', key, 8, h2)
    return bytes(key)


def derive_aes_256_key(network_secret):
    """与 Rust global_ctx.rs::get_256_key 完全一致。"""
    hasher = _SipHasher13()
    hasher.write(network_secret.encode('utf-8'))
    hasher.write(b"easytier-256bit-key")
    key = bytearray(32)
    for i in range(4):
        chunk_start = i * 8
        hasher.write(bytes(key[0:chunk_start]))
        hasher.write(bytes([i]))
        h = hasher.finish()
        struct.pack_into('>Q', key, chunk_start, h)
    return bytes(key)


# ============================================================
# AES-GCM 解密（可选，需要 cryptography 库）
# ============================================================
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    _HAS_AESGCM = True
except Exception:
    AESGCM = None
    _HAS_AESGCM = False


def try_decrypt_payload(encrypted_payload, network_secret):
    """
    尝试解密一帧加密 payload（packet_type=8 且 flags=ENCRYPTED 时的 payload）。

    布局（参考 aes_gcm.rs::decrypt 与 AesGcmTail）：
        [ ciphertext (text_len) ][ tag(16) ][ nonce(12) ]
        text_len = payload_len - 28
    AAD 为空。

    返回 (success, plaintext_or_None)
    """
    if not _HAS_AESGCM:
        return False, None
    if len(encrypted_payload) < AES_GCM_ENCRYPTION_RESERVED:
        return False, None

    text_len = len(encrypted_payload) - AES_GCM_ENCRYPTION_RESERVED
    ciphertext = encrypted_payload[:text_len]
    tag = encrypted_payload[text_len:text_len + 16]
    nonce = encrypted_payload[text_len + 16:text_len + 16 + 12]
    ct_plus_tag = ciphertext + tag

    # 优先 AES-128-GCM（默认算法）
    try:
        aes = AESGCM(derive_aes_128_key(network_secret))
        return True, aes.decrypt(nonce, ct_plus_tag, None)
    except Exception:
        pass
    # 回退 AES-256-GCM
    try:
        aes = AESGCM(derive_aes_256_key(network_secret))
        return True, aes.decrypt(nonce, ct_plus_tag, None)
    except Exception:
        pass
    return False, None


# ============================================================
# OspfRouteRpc.SyncRouteInfoRequest 解析（统计连接数）
# 参考 EasyTierCore/easytier/src/proto/peer_rpc.proto
# ============================================================

def parse_rpc_packet_body(rpc_payload):
    """
    解析 RpcPacket（common.proto::RpcPacket），返回 dict:
        {service_name, method_index, body, is_request, from_peer, to_peer}
    """
    fields = decode_protobuf_fields(rpc_payload)
    out = {
        'from_peer': get_pb_field(fields, 1, 0) or 0,
        'to_peer': get_pb_field(fields, 2, 0) or 0,
        'transaction_id': get_pb_field(fields, 3, 0) or 0,
        'descriptor': get_pb_field(fields, 4, 2) or b'',
        'body': get_pb_field(fields, 5, 2) or b'',
        'is_request': bool(get_pb_field(fields, 6, 0) or 0),
        'service_name': '',
        'method_index': 0,
    }
    if out['descriptor']:
        desc_fields = decode_protobuf_fields(out['descriptor'])
        sn = get_pb_field(desc_fields, 3, 2)
        if sn:
            try:
                out['service_name'] = sn.decode('utf-8', errors='replace')
            except Exception:
                out['service_name'] = ''
        out['method_index'] = get_pb_field(desc_fields, 4, 0) or 0
    return out


def parse_sync_route_info_request(body):
    """
    body 是 RpcPacket.body，即 RpcRequest 整个消息。
    取 RpcRequest.request (field 2) 后再解析为 SyncRouteInfoRequest。

    返回 dict: {my_peer_id, peer_ids: set, conn_map: {peer_id: [neighbor_peer_ids]}}
    """
    rpc_req_fields = decode_protobuf_fields(body)
    request_bytes = get_pb_field(rpc_req_fields, 2, 2) or b''
    if not request_bytes:
        request_bytes = body  # 极端容错

    sri_fields = decode_protobuf_fields(request_bytes)
    out = {
        'my_peer_id': get_pb_field(sri_fields, 1, 0) or 0,
        'peer_ids': set(),
        'conn_map': {},
    }

    # field 4: peer_infos (RoutePeerInfos) -> field 1 items repeated RoutePeerInfo
    peer_infos_blob = get_pb_field(sri_fields, 4, 2)
    peer_id_order = []  # 用于 bitmap 解析时按 RoutePeerInfo 出现顺序对照
    if peer_infos_blob:
        rpi_outer = decode_protobuf_fields(peer_infos_blob)
        for item_blob in get_pb_fields_all(rpi_outer, 1, 2):
            rpi_fields = decode_protobuf_fields(item_blob)
            pid = get_pb_field(rpi_fields, 1, 0)
            if pid is not None:
                out['peer_ids'].add(pid)

    # field 5: conn_bitmap (RouteConnBitmap)
    #   field 1: peer_ids (repeated PeerIdVersion) - 决定 N 与每行/列对应的 peer
    #   field 2: bitmap (bytes) - 长度 ceil(N*N/8)
    cb_blob = get_pb_field(sri_fields, 5, 2)
    if cb_blob:
        cb_fields = decode_protobuf_fields(cb_blob)
        cb_peer_ids = []
        for piv_blob in get_pb_fields_all(cb_fields, 1, 2):
            piv_fields = decode_protobuf_fields(piv_blob)
            pid = get_pb_field(piv_fields, 1, 0) or 0
            cb_peer_ids.append(pid)
        bitmap_bytes = get_pb_field(cb_fields, 2, 2) or b''
        n = len(cb_peer_ids)
        if n > 0 and bitmap_bytes:
            for i, src_pid in enumerate(cb_peer_ids):
                neighbors = []
                for j, dst_pid in enumerate(cb_peer_ids):
                    bit_idx = i * n + j
                    byte_idx = bit_idx // 8
                    bit_off = bit_idx % 8
                    if byte_idx < len(bitmap_bytes) and \
                       (bitmap_bytes[byte_idx] >> bit_off) & 1:
                        neighbors.append(dst_pid)
                if src_pid:
                    out['conn_map'][src_pid] = neighbors
        # 也补充 peer_ids 到全网视图
        for pid in cb_peer_ids:
            out['peer_ids'].add(pid)

    # field 7: conn_peer_list (RouteConnPeerList) - 与 conn_bitmap 二选一
    cpl_blob = get_pb_field(sri_fields, 7, 2)
    if cpl_blob:
        cpl_fields = decode_protobuf_fields(cpl_blob)
        for pci_blob in get_pb_fields_all(cpl_fields, 1, 2):
            pci_fields = decode_protobuf_fields(pci_blob)
            pid_ver_blob = get_pb_field(pci_fields, 1, 2)
            pid = 0
            if pid_ver_blob:
                pid_ver_fields = decode_protobuf_fields(pid_ver_blob)
                pid = get_pb_field(pid_ver_fields, 1, 0) or 0
            neighbors = []
            for fn, wt, val in pci_fields:
                if fn == 2 and wt == 0:
                    neighbors.append(val)
                elif fn == 2 and wt == 2:
                    off = 0
                    while off < len(val):
                        v, off = decode_varint(val, off)
                        neighbors.append(v)
            if pid:
                out['conn_map'][pid] = neighbors

    return out


def build_handshake_request(my_peer_id, network_name, network_secret):
    """
    构建 HandshakeRequest protobuf 消息

    message HandshakeRequest {
        uint32 magic = 1;
        uint32 my_peer_id = 2;
        uint32 version = 3;
        repeated string features = 4;
        string network_name = 5;
        bytes network_secret_digrest = 6;
    }
    """
    payload = b''
    payload += encode_protobuf_field(1, 0, EASYTIER_MAGIC)       # magic
    payload += encode_protobuf_field(2, 0, my_peer_id)           # my_peer_id
    payload += encode_protobuf_field(3, 0, EASYTIER_VERSION)     # version
    # features (field 4) - 留空
    payload += encode_protobuf_field(5, 2, network_name)         # network_name
    # network_secret_digest (field 6)
    digest = compute_network_secret_digest(network_name, network_secret)
    payload += encode_protobuf_field(6, 2, digest)               # network_secret_digrest

    return payload


def build_tcp_frame(from_peer_id, to_peer_id, packet_type, payload):
    """
    构建完整的 TCP 帧

    帧格式：
    [TCPTunnelHeader: 4 bytes] [PeerManagerHeader: 16 bytes] [Payload: N bytes]

    TCPTunnelHeader:
        len: u32 LE = PeerManagerHeader + Payload 的总长度

    PeerManagerHeader:
        from_peer_id: u32 LE
        to_peer_id: u32 LE
        packet_type: u8
        flags: u8
        forward_counter: u8
        reserved: u8
        len: u32 LE = payload 长度
    """
    # PeerManagerHeader
    peer_mgr_hdr = struct.pack('<IIBBBBi',
                               from_peer_id,    # from_peer_id
                               to_peer_id,      # to_peer_id
                               packet_type,     # packet_type
                               0,               # flags
                               1,               # forward_counter
                               0,               # reserved
                               len(payload))    # len (payload length)

    # TCPTunnelHeader
    body = peer_mgr_hdr + payload
    tcp_hdr = struct.pack('<I', len(body))

    return tcp_hdr + body


def parse_tcp_frame(data):
    """
    解析 TCP 帧，返回 (from_peer_id, to_peer_id, packet_type, flags, payload, consumed_bytes)
    如果数据不完整返回 None
    """
    if len(data) < TCP_TUNNEL_HEADER_SIZE:
        return None

    body_len = struct.unpack_from('<I', data, 0)[0]
    total_len = TCP_TUNNEL_HEADER_SIZE + body_len

    if len(data) < total_len:
        return None

    # 解析 PeerManagerHeader
    offset = TCP_TUNNEL_HEADER_SIZE
    if body_len < PEER_MANAGER_HEADER_SIZE:
        return None

    from_peer_id = struct.unpack_from('<I', data, offset)[0]
    to_peer_id = struct.unpack_from('<I', data, offset + 4)[0]
    packet_type = data[offset + 8]
    flags = data[offset + 9]
    # forward_counter = data[offset + 10]
    # reserved = data[offset + 11]
    payload_len = struct.unpack_from('<i', data, offset + 12)[0]

    payload_offset = offset + PEER_MANAGER_HEADER_SIZE
    # 加密包：payload_len 是明文长度，实际后面还跟了 28 字节 AesGcmTail（tag+nonce）
    actual_payload_len = payload_len
    body_payload_room = body_len - PEER_MANAGER_HEADER_SIZE
    if (flags & PEER_MANAGER_FLAG_ENCRYPTED) and \
       body_payload_room >= payload_len + AES_GCM_ENCRYPTION_RESERVED:
        actual_payload_len = payload_len + AES_GCM_ENCRYPTION_RESERVED
    payload = data[payload_offset:payload_offset + actual_payload_len]

    return (from_peer_id, to_peer_id, packet_type, flags, payload, total_len)


def parse_handshake_response(payload):
    """
    解析 HandshakeRequest 响应

    返回 dict: {magic, my_peer_id, version, network_name, features}
    """
    fields = decode_protobuf_fields(payload)
    result = {
        'magic': 0,
        'peer_id': 0,
        'version': 0,
        'network_name': '',
        'features': [],
    }

    for field_number, wire_type, value in fields:
        if field_number == 1 and wire_type == 0:
            result['magic'] = value
        elif field_number == 2 and wire_type == 0:
            result['peer_id'] = value
        elif field_number == 3 and wire_type == 0:
            result['version'] = value
        elif field_number == 4 and wire_type == 2:
            result['features'].append(value.decode('utf-8', errors='replace'))
        elif field_number == 5 and wire_type == 2:
            result['network_name'] = value.decode('utf-8', errors='replace')

    return result


# ============================================================
# 节点检测核心逻辑
# ============================================================

def _process_rpc_frame(rpc_payload, network_secret, remote_peer_id, encrypted, stats):
    """
    处理一个 packet_type=8 的 RPC 帧。
    更新 stats（dict）：
        - best_conn_count: 目前认为最可信的连接数（初始 -1）
        - plain_count, encrypted_count, encrypted_failed_count
    """
    payload_to_parse = rpc_payload

    if encrypted:
        stats['encrypted_count'] += 1
        ok, decrypted = try_decrypt_payload(rpc_payload, network_secret)
        if not ok:
            stats['encrypted_failed_count'] += 1
            return
        payload_to_parse = decrypted
    else:
        stats['plain_count'] += 1

    try:
        rpc = parse_rpc_packet_body(payload_to_parse)
    except Exception:
        return

    if rpc.get('service_name') != 'OspfRouteRpc':
        return
    if not rpc.get('is_request'):
        return

    try:
        sri = parse_sync_route_info_request(rpc['body'])
    except Exception:
        return

    target_pid = sri.get('my_peer_id') or remote_peer_id

    # 优先：从 conn_map 找目标 peer 的直连数
    conn_count = None
    if target_pid and target_pid in sri['conn_map']:
        conn_count = len(sri['conn_map'][target_pid])

    # 回退 1：取 conn_map 中最大的条目长度
    if conn_count is None and sri['conn_map']:
        conn_count = max(len(v) for v in sri['conn_map'].values())

    # 回退 2：用 peer_infos 总数 - 1（全网视图减自己）
    if conn_count is None and sri['peer_ids']:
        conn_count = max(len(sri['peer_ids']) - 1, 0)

    if conn_count is None:
        return

    if conn_count > stats['best_conn_count']:
        stats['best_conn_count'] = conn_count


def check_node_via_easytier(server, network_name, network_secret, timeout_sec=15):
    """
    通过 EasyTier 协议检测节点状态

    流程：
    1. TCP 连接到目标节点
    2. 发送 HandshakeRequest（包含 network_name + network_secret_digest）
    3. 接收并验证服务端的 HandshakeRequest 响应
    4. 握手成功后等待后续数据包（路由同步 RPC、Ping 等），确认连接稳定
    5. 通过收到的 RPC 请求数量推断节点活跃连接数

    相比简单 TCP 端口检测的优势：
    - 验证节点确实运行 EasyTier（magic 校验）
    - 验证网络名称匹配
    - 验证网络密码正确（SipHash-1-3 digest 校验）
    - 通过后续数据包确认节点正常工作

    返回: (is_online, connection_count, latency_ms, error)
    """
    import re

    # 解析服务器地址
    match = re.match(r'^(tcp|ws|wss)://(.+):(\d+)$', server, re.IGNORECASE)
    if not match:
        return False, 0, -1, '无效的连接地址格式'

    protocol, host, port_str = match.groups()
    port = int(port_str)

    if protocol.lower() != 'tcp':
        # 目前只支持 TCP 协议的直接检测
        return False, 0, -1, f'暂不支持 {protocol} 协议的直接检测'

    # 生成随机 peer_id
    my_peer_id = random.randint(1, 0x7FFFFFFF)

    start_time = time.time()
    sock = None

    try:
        # 1. TCP 连接
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout_sec)
        sock.connect((host, port))

        connect_time = time.time()

        # 2. 发送 HandshakeRequest
        hs_payload = build_handshake_request(my_peer_id, network_name, network_secret)
        frame = build_tcp_frame(my_peer_id, 0, PACKET_TYPE_HANDSHAKE, hs_payload)
        sock.sendall(frame)

        # 3. 接收服务端的 HandshakeRequest 响应
        recv_buf = b''
        remote_peer_id = 0
        handshake_ok = False

        deadline = time.time() + timeout_sec
        while time.time() < deadline:
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            sock.settimeout(max(remaining, 0.1))

            try:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                recv_buf += chunk
            except socket.timeout:
                break

            # 尝试解析帧
            while True:
                parsed = parse_tcp_frame(recv_buf)
                if parsed is None:
                    break

                from_peer, to_peer, pkt_type, flags, payload, consumed = parsed
                recv_buf = recv_buf[consumed:]

                if pkt_type == PACKET_TYPE_HANDSHAKE:
                    hs_resp = parse_handshake_response(payload)
                    if hs_resp['magic'] == EASYTIER_MAGIC:
                        remote_peer_id = hs_resp['peer_id']
                        handshake_ok = True
                        break

            if handshake_ok:
                break

        if not handshake_ok:
            latency_ms = int((time.time() - start_time) * 1000)
            return False, 0, latency_ms, '握手超时或失败（节点可能不在线或密码错误）'

        latency_ms = int((connect_time - start_time) * 1000)

        # 4. 握手成功后，等待路由同步 RPC，解析连接数
        #    - 明文（flags=0）：直接解析 SyncRouteInfoRequest
        #    - 加密（flags=ENCRYPTED）：尝试 AES-128/256-GCM 解密；失败则 connection_count=0
        stats = {
            'best_conn_count': -1,
            'plain_count': 0,
            'encrypted_count': 0,
            'encrypted_failed_count': 0,
        }
        connection_confirmed = False
        post_deadline = time.time() + min(timeout_sec, 4)

        while time.time() < post_deadline:
            remaining = post_deadline - time.time()
            if remaining <= 0:
                break
            sock.settimeout(max(remaining, 0.1))

            try:
                chunk = sock.recv(16384)
                if not chunk:
                    if not connection_confirmed:
                        return False, 0, latency_ms, '握手后连接被关闭（密码可能不正确）'
                    break
                recv_buf += chunk
            except socket.timeout:
                if connection_confirmed and stats['best_conn_count'] >= 0:
                    break
                continue

            # 解析后续帧
            while True:
                parsed = parse_tcp_frame(recv_buf)
                if parsed is None:
                    break

                from_peer, to_peer, pkt_type, flags, payload, consumed = parsed
                recv_buf = recv_buf[consumed:]

                if pkt_type == PACKET_TYPE_RPC_REQ:
                    connection_confirmed = True
                    encrypted = bool(flags & PEER_MANAGER_FLAG_ENCRYPTED)
                    _process_rpc_frame(payload, network_secret, remote_peer_id,
                                       encrypted, stats)
                elif pkt_type == 4:  # Ping
                    connection_confirmed = True

        if not connection_confirmed:
            return True, 0, latency_ms, None

        # 5. 汇总
        if stats['best_conn_count'] >= 0:
            # 明文解析或解密成功
            return True, stats['best_conn_count'], latency_ms, None

        # 全部 RPC 都是加密且解不开 → 在线但 connection_count=0
        if stats['encrypted_count'] > 0 and stats['plain_count'] == 0:
            err_msg = ('节点启用了加密通道，连接数无法解析（密码可能错或版本不兼容）'
                       if _HAS_AESGCM else
                       '节点启用了加密通道，且环境缺少 cryptography 库')
            return True, 0, latency_ms, err_msg

        # 收到 Ping 但没有 RPC 帧
        return True, 0, latency_ms, None

    except socket.timeout:
        latency_ms = int((time.time() - start_time) * 1000)
        return False, 0, latency_ms, '连接超时'
    except ConnectionRefusedError:
        return False, 0, -1, '连接被拒绝'
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        return False, 0, latency_ms, f'检测异常: {str(e)}'
    finally:
        if sock:
            try:
                sock.close()
            except Exception:
                pass


# ============================================================
# EdgeOne Pages Python 云函数接口
# 官方文档：https://pages.edgeone.ai/document/python
# 入口规范：class handler(BaseHTTPRequestHandler)
# 路由规则：文件路径 → URL 路径
#   cloud-functions/api/edgeone/batch-check.py → /api/edgeone/batch-check
# ============================================================

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


class handler(BaseHTTPRequestHandler):
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

    响应：
    {
        "results": [
            {
                "is_online": true,
                "connection_count": 5,
                "latency_ms": 120,
                "check_time": "2026-05-08T09:00:00.000Z"
            }
        ]
    }
    """

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

    def do_POST(self):
        try:
            # API Key 鉴权
            if not _verify_api_key(self.headers):
                self._send_json(401, {'error': '未授权：API Key 验证失败'})
                return

            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

            try:
                body = json.loads(raw_body) if raw_body else {}
            except json.JSONDecodeError:
                self._send_json(400, {'error': '无效的 JSON 请求体'})
                return

            nodes = body.get('nodes', [])

            if not isinstance(nodes, list) or len(nodes) == 0:
                self._send_json(400, {'error': '缺少 nodes 字段或节点列表为空'})
                return

            if len(nodes) > 20:
                self._send_json(400, {'error': '单次批量检测最多支持 20 个节点'})
                return

            # 验证每个节点的必填参数
            for i, node in enumerate(nodes):
                if not node.get('server') or not node.get('network_name') or not node.get('network_secret'):
                    self._send_json(400, {
                        'error': f'第 {i + 1} 个节点缺少必填参数 (server, network_name, network_secret)'
                    })
                    return

            # 获取超时配置
            timeout_sec = int(os.environ.get('CHECK_TIMEOUT', '15'))

            # 逐个检测节点（通过 EasyTier 协议）
            results = []
            for node in nodes:
                try:
                    is_online, conn_count, latency_ms, error = check_node_via_easytier(
                        node['server'], node['network_name'], node['network_secret'], timeout_sec
                    )
                    results.append(make_check_result(
                        is_online=is_online,
                        connection_count=conn_count,
                        latency_ms=latency_ms,
                        error=error,
                    ))
                except Exception as e:
                    results.append(make_check_result(error=f'检测异常: {type(e).__name__}: {str(e)}'))

            self._send_json(200, {'results': results})

        except Exception as e:
            self._send_json(500, {
                'error': f'云函数执行异常: {type(e).__name__}: {str(e)}',
                'traceback': traceback.format_exc(),
                'python_version': sys.version,
            })

    # 同时允许 GET 方式（用于浏览器快速调试，仅返回提示）
    def do_GET(self):
        self._send_json(405, {
            'error': '请使用 POST 方法',
            'usage': 'POST /api/edgeone/batch-check  body={"nodes":[{"server":"tcp://IP:PORT","network_name":"...","network_secret":"..."}]}',
        })

    def log_message(self, format, *args):
        return
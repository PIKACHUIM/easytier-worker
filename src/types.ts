import type {Context} from 'hono'

// 用户类型
export interface User {
    id: number;
    email: string;
    password_hash: string;
    is_admin: number;
    is_super_admin: number; // 超级管理员（环境变量中的管理员）
    is_verified: number;
    verification_token?: string;
    is_enabled: number; // 用户启用状态：1-启用，0-禁用，默认1
    qq_number?: string; // QQ号
    wechat_uid?: string; // 微信UID（WxPusher的UID）
    telegram_id?: string; // Telegram ID
    created_at: string;
}

// 系统设置类型
export interface SystemSetting {
    id: number;
    setting_key: string;
    setting_value: string;
    description?: string;
    updated_at: string;
}

// 连接方式类型
export interface Connection {
    type: 'TCP' | 'UDP' | 'WS' | 'WSS' | 'WG';
    ip: string;
    port: number;
}

// 节点类型
export interface Node {
    id: number;
    user_email: string;
    node_name: string;
    region_type: 'domestic' | 'overseas';
    region_detail: string;
    connections: Connection[];
    current_bandwidth: number;
    tier_bandwidth: number;
    max_bandwidth: number;
    used_traffic: number;
    correction_traffic: number;
    max_traffic: number;
    reset_cycle: number;
    reset_date: string;
    connection_count: number;
    max_connections: number;
    tags: string;
    created_at: string;
    valid_until: string;
    status: 'online' | 'offline';
    recent_status: string;
    notes: string;
    allow_relay: number;
    is_enabled: number; // 节点审核状态：-1-未审核，1-通过审核且启用，0-审核通过但手动禁用，默认-1
    last_report_at?: string;
    report_token: string;
    network_name?: string;
    network_token?: string;
    offline_notify: number; // 节点首次下线通知选项：0-不通知，1-通知微信，2-通知邮箱，3-TG通知
    last_offline_notify_at?: string; // 最后一次下线通知时间
    network_count: number; // 当前网络数（由客户端上报）
    relay_bandwidth: number; // 中转带宽（Mbps，由客户端上报）
    current_network_only: number; // 是否仅允许当前网络（由客户端上报）
}

// 数据库中的节点类型（connections 是字符串）
export interface NodeDB extends Omit<Node, 'connections'> {
    connections: string;
}

// API 请求类型
export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface NodeCreateRequest {
    node_name: string;
    region_type: 'domestic' | 'overseas';
    region_detail?: string;
    connections: Connection[];
    max_bandwidth: number;
    max_traffic: number;
    reset_cycle: number;
    max_connections: number;
    tags?: string;
    valid_until: string;
    notes?: string;
    allow_relay: number;
    is_enabled?: number; // 节点审核状态：-1-未审核，0-审核但未启用，1-通过审核且启用
    network_name?: string;
    network_token?: string;
    offline_notify?: number; // 节点首次下线通知选项：0-不通知，1-通知微信，2-通知邮箱，3-TG通知
}

export interface NodeUpdateRequest extends Partial<NodeCreateRequest> {
    correction_traffic?: number;
    tier_bandwidth?: number;
    offline_notify?: number;
}

export interface NodeReportRequest {
    node_name: string; // 节点名称（替代node_id）
    email: string; // 用户邮箱
    token: string; // 节点上报验证token
    current_bandwidth: number;
    reported_traffic: number; // 本次上报的流量（字节，由客户端直接上报累计值）
    connection_count: number;
    status: 'online' | 'offline';
    tier_bandwidth?: number; // 可选：由节点上报阶梯带宽
    // 以下为新增字段（由EasyTier核心直接上报）
    network_count?: number; // 当前网络数
    relay_bandwidth?: number; // 中转带宽（bps）
    allow_relay?: boolean; // 是否支持中转
    current_network_only?: boolean; // 是否仅允许当前网络
    reset_day?: number; // 每月流量重置日期（1-31，0表示月末）
    // 方案C：扩展上报字段 - 节点 peer 信息（由 EasyTier 客户端上报）
    peers?: PeerInfo[]; // 当前连接的 peer 列表
    route_info?: RouteInfo[]; // 路由拓扑信息
    latency_ms?: number; // 节点自身测量的平均延迟（ms）
    public_ip?: string; // 节点的公网 IP
    easytier_version?: string; // EasyTier 版本号
    uptime_seconds?: number; // 节点运行时长（秒）
}

// 方案C：Peer 信息（由 EasyTier 客户端上报）
export interface PeerInfo {
    peer_id: string; // Peer ID
    hostname?: string; // Peer 主机名
    ipv4?: string; // Peer 的虚拟 IPv4 地址
    latency_ms?: number; // 到该 Peer 的延迟（ms）
    loss_rate?: number; // 丢包率（0-1）
    rx_bytes?: number; // 接收字节数
    tx_bytes?: number; // 发送字节数
    conn_type?: string; // 连接类型（direct/relay/p2p）
    tunnel_type?: string; // 隧道类型（tcp/udp/ws/wss/wg）
}

// 方案C：路由信息（由 EasyTier 客户端上报）
export interface RouteInfo {
    peer_id: string; // 目标 Peer ID
    hostname?: string; // 目标主机名
    ipv4?: string; // 目标虚拟 IPv4
    cost: number; // 路由开销
    next_hop_peer_id?: string; // 下一跳 Peer ID
    proxy_cidrs?: string[]; // 代理网段
}

// 方案A：监控服务批量上报请求（由 health-check-cli batch 模式上报）
export interface MonitorReportRequest {
    results: MonitorNodeResult[];
}

// 方案A：单个节点的监控检测结果
export interface MonitorNodeResult {
    node_name: string;
    email: string;
    token: string;
    is_online: boolean;
    connection_count: number;
    latency_ms: number;
    check_time: string;
    error?: string;
}

export interface NodeQueryRequest {
    region?: 'domestic' | 'overseas' | 'all';
    priority?: 'traffic' | 'bandwidth' | 'latency';
    relay_only?: boolean;
}

// Cloudflare Workers 环境变量类型
export interface Env {
    DB: any; // D1Database
    JWT_SECRET: string;
    ADMIN_EMAIL: string;
    RESEND_API_KEY: string;
    ENABLE_EMAIL_VERIFICATION?: string; // 是否启用邮件验证，默认false
}

// JWT Payload 类型
export interface JWTPayload {
    email: string;
    is_admin: boolean;
    is_super_admin?: boolean;
    is_enabled?: number; // 用户启用状态：1-启用，0-禁用
}

// 初始化请求类型
export interface InitializeRequest {
    jwt_secret: string;
    email: string;
    password: string;
}

// 系统设置更新请求类型
export interface SystemSettingsUpdateRequest {
    resend_api_key?: string;
    resend_from_email?: string;
    resend_from_domain?: string;
    site_name?: string;
    site_url?: string;
    telegram_bot_token?: string;
    telegram_bot_id?: string;
    wxpusher_app_token?: string;
    wxpusher_app_id?: string;
}

// 用户管理请求类型
export interface UserManageRequest {
    email: string;
    is_admin: boolean;
}

// 节点 Peer 数据库记录类型
export interface NodePeerDB {
    id: number;
    node_id: number;
    peer_id: string;
    hostname?: string;
    ipv4?: string;
    latency_ms?: number;
    loss_rate?: number;
    rx_bytes?: number;
    tx_bytes?: number;
    conn_type?: string;
    tunnel_type?: string;
    updated_at: string;
}

// Hono Context 扩展类型
export type AppContext = Context<{
    Bindings: Env;
    Variables: {
        user: JWTPayload;
    };
}>
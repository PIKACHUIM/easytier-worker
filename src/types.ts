// 用户类型
export interface User {
  id: number;
  email: string;
  password_hash: string;
  is_admin: number;
  is_super_admin: number; // 超级管理员（环境变量中的管理员）
  is_verified: number;
  verification_token?: string;
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
  tags?: string;
  created_at: string;
  valid_until: string;
  status: 'online' | 'offline';
  recent_status: string;
  notes?: string;
  allow_relay: number;
  last_report_at?: string;
  report_token?: string; // 节点上报验证token
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
  region_detail: string;
  connections: Connection[];
  tier_bandwidth: number;
  max_bandwidth: number;
  max_traffic: number;
  reset_cycle: number;
  max_connections: number;
  tags?: string;
  valid_until: string;
  notes?: string;
  allow_relay: number;
}

export interface NodeUpdateRequest extends Partial<NodeCreateRequest> {
  correction_traffic?: number;
}

export interface NodeReportRequest {
  node_name: string; // 节点名称（替代node_id）
  email: string; // 用户邮箱
  token: string; // 节点上报验证token
  current_bandwidth: number;
  reported_traffic: number; // 本次上报的流量增量
  connection_count: number;
  status: 'online' | 'offline';
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
}

// 用户管理请求类型
export interface UserManageRequest {
  email: string;
  is_admin: boolean;
}

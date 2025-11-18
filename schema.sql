-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  is_super_admin INTEGER DEFAULT 0, -- 超级管理员标记（环境变量中的管理员）
  is_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 节点表
CREATE TABLE IF NOT EXISTS nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  node_name TEXT NOT NULL,
  region_type TEXT NOT NULL, -- 'domestic' 或 'overseas'
  region_detail TEXT NOT NULL, -- 具体地区
  connections TEXT NOT NULL, -- JSON 数组，存储连接方式列表
  current_bandwidth REAL DEFAULT 0, -- 当前带宽 (Mbps)
  tier_bandwidth REAL NOT NULL, -- 当前阶梯带宽 (Mbps)
  max_bandwidth REAL NOT NULL, -- 服务器最大带宽 (Mbps)
  used_traffic REAL DEFAULT 0, -- 已用流量 (GB)
  correction_traffic REAL DEFAULT 0, -- 修正流量 (GB)
  max_traffic REAL NOT NULL, -- 最大流量 (GB)
  reset_cycle INTEGER NOT NULL, -- 重置周期 (天)
  reset_date DATETIME NOT NULL, -- 下次重置日期
  connection_count INTEGER DEFAULT 0, -- 当前连接数
  max_connections INTEGER NOT NULL, -- 最大允许连接数
  tags TEXT, -- 标签
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME NOT NULL, -- 有效期至
  status TEXT DEFAULT 'offline', -- 'online' 或 'offline'
  recent_status TEXT DEFAULT '', -- 30天内每10分钟负荷情况
  notes TEXT, -- 备注信息
  allow_relay INTEGER DEFAULT 0, -- 是否允许中转
last_report_at DATETIME, -- 最后上报时间
  report_token TEXT, -- 节点上报验证token
  network_name TEXT, -- 测试网络名称
  network_token TEXT, -- 测试网络密码
  FOREIGN KEY (user_email) REFERENCES users(email)
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS confs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_nodes_user_email ON nodes(user_email);
CREATE INDEX IF NOT EXISTS idx_nodes_region_type ON nodes(region_type);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_allow_relay ON nodes(allow_relay);
CREATE INDEX IF NOT EXISTS idx_confs_key ON confs(setting_key);

-- 插入默认系统设置
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) VALUES
  ('resend_api_key', '', 'Resend API 密钥'),
  ('resend_from_email', 'noreply@example.com', 'Resend 发件人邮箱'),
  ('resend_from_domain', 'example.com', 'Resend 发件域名'),
  ('system_initialized', '0', '系统是否已初始化'),
  ('site_name', 'EasyTier 节点管理系统', '网站名称'),
  ('site_url', 'https://example.com', '网站URL'),
  ('stats_online_nodes_history', '[]', '在线节点历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
  ('stats_connections_history', '[]', '连接数历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
  ('stats_bandwidth_history', '[]', '带宽使用历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
  ('stats_tierband_history', '[]', '阶梯带宽历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
  ('stats_last_update', '', '统计数据最后更新时间');

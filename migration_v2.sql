-- 数据库迁移脚本：从 v1.0.0 升级到 v2.0.0
-- 执行命令: npx wrangler d1 execute easytier-db --file=./migration_v2.sql

-- 1. 添加 is_super_admin 字段到 users 表
ALTER TABLE users ADD COLUMN is_super_admin INTEGER DEFAULT 0;

-- 2. 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- 4. 插入默认系统设置
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
  ('resend_api_key', '', 'Resend API 密钥'),
  ('resend_from_email', 'noreply@example.com', 'Resend 发件人邮箱'),
  ('resend_from_domain', 'example.com', 'Resend 发件域名'),
  ('system_initialized', '1', '系统是否已初始化'),
  ('site_name', 'EasyTier 节点管理系统', '网站名称'),
  ('site_url', 'https://example.com', '网站URL');

-- 5. 将现有的管理员标记为超级管理员（请根据实际情况修改邮箱）
-- UPDATE users SET is_super_admin = 1 WHERE email = 'admin@example.com';

-- 注意：
-- 1. 执行此脚本前请先备份数据库
-- 2. 如果您有多个管理员，请手动执行步骤5，将主管理员标记为超级管理员
-- 3. 执行完成后，系统将被标记为已初始化，无法再次通过 /initialize 页面初始化
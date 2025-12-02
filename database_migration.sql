-- 数据库迁移SQL - 添加通知功能相关字段
-- 执行日期: 2025-12-02
-- 说明: 添加用户联系方式字段、节点下线通知选项、系统通知配置

-- ============================================
-- 1. 更新 users 表 - 添加用户联系方式字段
-- ============================================

-- 添加 QQ 号字段
ALTER TABLE users ADD COLUMN qq_number TEXT;

-- 添加微信 UID 字段（WxPusher 的 UID）
ALTER TABLE users ADD COLUMN wechat_uid TEXT;

-- 添加 Telegram ID 字段
ALTER TABLE users ADD COLUMN telegram_id TEXT;

-- ============================================
-- 2. 更新 nodes 表 - 添加节点下线通知选项
-- ============================================

-- 添加节点下线通知选项字段
-- 0=不通知, 1=通知微信, 2=通知邮箱, 3=TG通知
ALTER TABLE nodes ADD COLUMN offline_notify INTEGER DEFAULT 0;

-- 添加最后一次下线通知时间字段
ALTER TABLE nodes ADD COLUMN last_offline_notify_at DATETIME;

-- ============================================
-- 3. 更新 confs 表 - 添加通知服务配置
-- ============================================

-- 添加 Telegram Bot Token 配置
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('telegram_bot_token', '', 'Telegram Bot Token');

-- 添加 Telegram Bot ID 配置
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('telegram_bot_id', '', 'Telegram Bot ID');

-- 添加 WxPusher 应用 Token 配置
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('wxpusher_app_token', '', 'WxPusher 应用 Token');

-- 添加 WxPusher 应用 ID 配置
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('wxpusher_app_id', '', 'WxPusher 应用 ID');

-- ============================================
-- 迁移完成
-- ============================================

-- 验证查询（可选）
-- SELECT * FROM users LIMIT 1;
-- SELECT * FROM nodes LIMIT 1;
-- SELECT * FROM confs WHERE setting_key LIKE '%telegram%' OR setting_key LIKE '%wxpusher%';

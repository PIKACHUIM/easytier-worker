-- 数据库迁移脚本：添加网络名称和密码字段
-- 执行前请备份数据库

-- 检查字段是否存在，如果不存在则添加
-- 使用 ALTER TABLE 添加 network_name 字段
ALTER TABLE nodes ADD COLUMN network_name TEXT;

-- 使用 ALTER TABLE 添加 network_token 字段  
ALTER TABLE nodes ADD COLUMN network_token TEXT;

-- 验证字段是否添加成功
.schema nodes
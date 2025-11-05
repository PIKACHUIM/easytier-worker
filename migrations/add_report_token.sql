-- 迁移脚本：添加 report_token 字段
-- 版本：v1.0.1
-- 日期：2025-01-04

-- 1. 添加 report_token 字段到 nodes 表
ALTER TABLE nodes ADD COLUMN report_token TEXT;

-- 2. 为现有节点生成随机token（需要在应用层执行）
-- 注意：SQLite 不支持直接生成随机字符串，需要通过应用程序更新
-- 可以使用以下 Wrangler 命令执行：
-- wrangler d1 execute easytier-db --file=./migrations/add_report_token.sql

-- 3. 创建索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_nodes_report_token ON nodes(report_token);

-- 使用说明：
-- 1. 执行此迁移脚本后，所有现有节点的 report_token 将为 NULL
-- 2. 用户需要在节点管理页面点击"重新生成"按钮来生成token
-- 3. 新创建的节点会自动生成token

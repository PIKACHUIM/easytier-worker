# 数据库迁移说明

## 概述

本次更新添加了通知功能，需要对数据库进行迁移以添加新的字段和配置项。

## 迁移步骤

### 方法一：使用 Wrangler CLI（推荐）

如果您使用 Cloudflare D1 数据库，可以使用 Wrangler CLI 执行迁移：

```bash
# 执行迁移 SQL
wrangler d1 execute <DATABASE_NAME> --file=database_migration.sql
```

将 `<DATABASE_NAME>` 替换为您的数据库名称。

### 方法二：手动执行 SQL

1. 登录 Cloudflare Dashboard
2. 进入 D1 数据库管理页面
3. 选择您的数据库
4. 在 SQL 控制台中，逐条执行 `database_migration.sql` 中的 SQL 语句

### 方法三：通过 API 执行

如果您有数据库管理工具或脚本，可以直接执行 `database_migration.sql` 文件中的 SQL 命令。

## 迁移内容

本次迁移将：

1. **为 users 表添加字段**：
   - `qq_number` - QQ 号
   - `wechat_uid` - 微信 UID（WxPusher）
   - `telegram_id` - Telegram ID

2. **为 nodes 表添加字段**：
   - `offline_notify` - 节点下线通知选项
   - `last_offline_notify_at` - 最后一次通知时间

3. **为 confs 表添加配置项**：
   - `telegram_bot_token` - Telegram Bot Token
   - `telegram_bot_id` - Telegram Bot ID
   - `wxpusher_app_token` - WxPusher 应用 Token
   - `wxpusher_app_id` - WxPusher 应用 ID

## 验证迁移

执行迁移后，可以运行以下 SQL 验证：

```sql
-- 检查 users 表
SELECT * FROM users LIMIT 1;

-- 检查 nodes 表
SELECT * FROM nodes LIMIT 1;

-- 检查新增的配置项
SELECT * FROM confs WHERE setting_key LIKE '%telegram%' OR setting_key LIKE '%wxpusher%';
```

## 回滚

如果需要回滚迁移，可以执行以下 SQL：

```sql
-- 删除 users 表的新字段
ALTER TABLE users DROP COLUMN qq_number;
ALTER TABLE users DROP COLUMN wechat_uid;
ALTER TABLE users DROP COLUMN telegram_id;

-- 删除 nodes 表的新字段
ALTER TABLE nodes DROP COLUMN offline_notify;
ALTER TABLE nodes DROP COLUMN last_offline_notify_at;

-- 删除新增的配置项
DELETE FROM confs WHERE setting_key IN (
  'telegram_bot_token',
  'telegram_bot_id',
  'wxpusher_app_token',
  'wxpusher_app_id'
);
```

**注意**：SQLite 的 `ALTER TABLE DROP COLUMN` 语法在某些版本中可能不支持，如果遇到问题，可能需要重建表。

## 注意事项

1. **备份数据库**：在执行迁移前，建议先备份数据库
2. **测试环境**：建议先在测试环境中执行迁移，确认无误后再在生产环境执行
3. **兼容性**：本迁移脚本使用标准 SQL 语法，兼容 SQLite 3.x
4. **幂等性**：迁移脚本使用 `INSERT OR IGNORE` 确保可以重复执行

## 问题排查

### 字段已存在错误

如果遇到"字段已存在"的错误，说明该字段已经添加过了，可以忽略该错误或跳过相应的 SQL 语句。

### 配置项已存在

`INSERT OR IGNORE` 语句会自动跳过已存在的配置项，不会报错。

## 更多信息

详细的实现说明请参考 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

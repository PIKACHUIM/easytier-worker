# 数据库迁移说明

## 概述

本文档说明如何对 EasyTier 节点管理系统的数据库进行迁移。当前迁移版本添加了通知功能所需的字段和配置项。

> ⚠️ **重要提示**：如果遇到 `no such column: wechat_uid` 等字段缺失错误，说明数据库尚未执行迁移，请按照本文档操作。

---

## 迁移内容

本次迁移将：

1. **为 `users` 表添加字段**：
   - `qq_number` — QQ 号（仅记录，暂不支持通知）
   - `wechat_uid` — 微信 UID（WxPusher）
   - `telegram_id` — Telegram ID

2. **为 `nodes` 表添加字段**：
   - `offline_notify` — 节点下线通知选项（0=不通知, 1=微信, 2=邮箱, 3=Telegram）
   - `last_offline_notify_at` — 最后一次通知时间（用于防止频繁通知）

3. **为 `confs` 表添加配置项**：
   - `telegram_bot_token` — Telegram Bot Token
   - `telegram_bot_id` — Telegram Bot ID
   - `wxpusher_app_token` — WxPusher 应用 Token
   - `wxpusher_app_id` — WxPusher 应用 ID

---

## 迁移前准备

1. **备份数据库**（强烈建议）
2. 确认您的数据库名称（查看 `wrangler.jsonc` 中的 `[[d1_databases]]` 配置）
3. 选择以下任意一种执行方式

---

## 执行方式

### 方式一：Cloudflare Dashboard（推荐，最简单）

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1**
3. 选择您的数据库，点击 **Console** 标签
4. **按顺序逐条**执行以下 SQL 语句：

```sql
-- 1. 添加用户联系方式字段
ALTER TABLE users ADD COLUMN qq_number TEXT;
ALTER TABLE users ADD COLUMN wechat_uid TEXT;
ALTER TABLE users ADD COLUMN telegram_id TEXT;

-- 2. 添加节点通知字段
ALTER TABLE nodes ADD COLUMN offline_notify INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN last_offline_notify_at DATETIME;

-- 3. 添加系统通知配置项
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('telegram_bot_token', '', 'Telegram Bot Token');

INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('telegram_bot_id', '', 'Telegram Bot ID');

INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('wxpusher_app_token', '', 'WxPusher 应用 Token');

INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('wxpusher_app_id', '', 'WxPusher 应用 ID');
```

---

### 方式二：Wrangler CLI

```bash
# 安装 Wrangler（如未安装）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 查看数据库列表，确认数据库名称
wrangler d1 list

# 执行迁移文件
wrangler d1 execute <DATABASE_NAME> --file=database_migration.sql

# 或逐条执行
wrangler d1 execute <DATABASE_NAME> --command="ALTER TABLE users ADD COLUMN qq_number TEXT;"
```

将 `<DATABASE_NAME>` 替换为您的实际数据库名称。

---

### 方式三：Wrangler 迁移管理

```bash
# 创建迁移目录
mkdir -p migrations

# 将 database_migration.sql 复制为迁移文件
cp database_migration.sql migrations/0001_add_notification_fields.sql

# 在 wrangler.jsonc 中配置迁移目录
# "migrations_dir": "migrations"

# 执行迁移
wrangler d1 migrations apply <DATABASE_NAME>
```

---

## 验证迁移

执行迁移后，运行以下 SQL 验证结果：

```sql
-- 检查 users 表结构
PRAGMA table_info(users);

-- 检查 nodes 表结构
PRAGMA table_info(nodes);

-- 检查新增的配置项
SELECT * FROM confs WHERE setting_key LIKE '%telegram%' OR setting_key LIKE '%wxpusher%';
```

验证通过后，重新部署应用：

```bash
npm run deploy
# 或
wrangler deploy
```

---

## 回滚

如需回滚迁移，执行以下 SQL：

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

> **注意**：SQLite 的 `ALTER TABLE DROP COLUMN` 在某些版本中可能不支持，如遇问题可能需要重建表。

---

## 常见问题

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| `duplicate column name` | 字段已存在 | 跳过该语句，继续执行下一条 |
| 不知道数据库名称 | — | 查看 `wrangler.jsonc` 中 `database_name` 字段 |
| 迁移后仍然报错 | 迁移未成功 / 未重新部署 | 重新检查每条 SQL，并重新部署应用 |

---

## 注意事项

1. **备份数据库**：执行迁移前务必备份
2. **测试环境优先**：建议先在测试环境验证，再在生产环境执行
3. **兼容性**：迁移脚本使用标准 SQL 语法，兼容 SQLite 3.x
4. **幂等性**：`INSERT OR IGNORE` 语句可以重复执行，不会报错

---

## 迁移清单

- [ ] 备份数据库
- [ ] 执行 `users` 表的 3 条 `ALTER TABLE` 语句
- [ ] 执行 `nodes` 表的 2 条 `ALTER TABLE` 语句
- [ ] 执行 `confs` 表的 4 条 `INSERT` 语句
- [ ] 验证迁移（执行 `PRAGMA table_info` 查询）
- [ ] 重新部署应用
- [ ] 测试通知功能是否正常

---

## 更多信息

- 通知功能的完整实现说明：[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- 定时任务配置说明：[CRON_TASK_README.md](./CRON_TASK_README.md)

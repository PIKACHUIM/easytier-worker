# 数据库迁移执行指南

## ⚠️ 重要提示

您遇到的错误：`no such column: wechat_uid` 表明数据库中还没有新添加的字段。**必须先执行数据库迁移才能使用新功能。**

## 📋 迁移前准备

1. **备份数据库**（强烈建议）
2. 确认您的数据库名称
3. 准备执行 SQL 语句

## 🚀 执行方法

### 方法一：通过 Cloudflare Dashboard（最简单）

#### 步骤：

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录您的账号
3. 进入 **Workers & Pages** → **D1**
4. 选择您的数据库（通常名称类似 `easytier-db` 或您在 wrangler.toml 中配置的名称）
5. 点击 **Console** 标签
6. 在 SQL 输入框中，**逐条**执行以下 SQL 语句：

#### SQL 语句（按顺序执行）：

```sql
-- 1. 添加用户联系方式字段
ALTER TABLE users ADD COLUMN qq_number TEXT;
```

执行后，继续执行：

```sql
ALTER TABLE users ADD COLUMN wechat_uid TEXT;
```

```sql
ALTER TABLE users ADD COLUMN telegram_id TEXT;
```

```sql
-- 2. 添加节点通知字段
ALTER TABLE nodes ADD COLUMN offline_notify INTEGER DEFAULT 0;
```

```sql
ALTER TABLE nodes ADD COLUMN last_offline_notify_at DATETIME;
```

```sql
-- 3. 添加系统配置（一次性执行）
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('telegram_bot_token', '', 'Telegram Bot Token');
```

```sql
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('telegram_bot_id', '', 'Telegram Bot ID');
```

```sql
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('wxpusher_app_token', '', 'WxPusher 应用 Token');
```

```sql
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) 
VALUES ('wxpusher_app_id', '', 'WxPusher 应用 ID');
```

#### 验证迁移：

执行以下查询验证迁移是否成功：

```sql
-- 查看 users 表结构
PRAGMA table_info(users);

-- 查看 nodes 表结构
PRAGMA table_info(nodes);

-- 查看新增的配置项
SELECT * FROM confs WHERE setting_key LIKE '%telegram%' OR setting_key LIKE '%wxpusher%';
```

---

### 方法二：使用 Wrangler CLI

如果您已安装 Wrangler CLI：

#### 1. 安装 Wrangler（如果未安装）

```bash
npm install -g wrangler
```

#### 2. 登录 Cloudflare

```bash
wrangler login
```

#### 3. 查看数据库列表

```bash
wrangler d1 list
```

#### 4. 执行迁移

```bash
# 方式 A: 执行整个文件
wrangler d1 execute <DATABASE_NAME> --file=database_migration.sql

# 方式 B: 执行单条命令
wrangler d1 execute <DATABASE_NAME> --command="ALTER TABLE users ADD COLUMN qq_number TEXT;"
```

将 `<DATABASE_NAME>` 替换为您的实际数据库名称。

---

### 方法三：通过 wrangler.toml 配置迁移

#### 1. 创建迁移文件夹

```bash
mkdir -p migrations
```

#### 2. 创建迁移文件

在 `migrations` 文件夹中创建文件 `0001_add_notification_fields.sql`，内容为 `database_migration.sql` 的内容。

#### 3. 在 wrangler.toml 中配置

```toml
[[d1_databases]]
binding = "DB"
database_name = "your-database-name"
database_id = "your-database-id"
migrations_dir = "migrations"
```

#### 4. 执行迁移

```bash
wrangler d1 migrations apply <DATABASE_NAME>
```

---

## ✅ 验证迁移成功

迁移完成后，重新部署应用：

```bash
npm run deploy
# 或
wrangler deploy
```

然后访问您的应用，尝试访问个人设置页面（`/usertoken`），如果不再出现错误，说明迁移成功。

---

## 🔍 常见问题

### Q1: 执行 ALTER TABLE 时报错 "duplicate column name"

**A:** 这说明该字段已经存在，可以跳过该语句，继续执行下一条。

### Q2: 如何确认我的数据库名称？

**A:** 查看项目根目录下的 `wrangler.toml` 文件，找到 `[[d1_databases]]` 部分：

```toml
[[d1_databases]]
binding = "DB"
database_name = "your-database-name"  # 这就是数据库名称
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Q3: 迁移后仍然报错

**A:** 可能的原因：
1. 迁移未成功执行 - 请重新检查每条 SQL 是否都执行成功
2. 应用未重新部署 - 请重新部署应用
3. 缓存问题 - 清除浏览器缓存后重试

### Q4: 如何回滚迁移？

**A:** 如果需要回滚，执行以下 SQL：

```sql
-- 注意：SQLite 的 DROP COLUMN 在某些版本中可能不支持
-- 如果不支持，可能需要重建表

ALTER TABLE users DROP COLUMN qq_number;
ALTER TABLE users DROP COLUMN wechat_uid;
ALTER TABLE users DROP COLUMN telegram_id;
ALTER TABLE nodes DROP COLUMN offline_notify;
ALTER TABLE nodes DROP COLUMN last_offline_notify_at;

DELETE FROM confs WHERE setting_key IN (
  'telegram_bot_token',
  'telegram_bot_id',
  'wxpusher_app_token',
  'wxpusher_app_id'
);
```

---

## 📞 需要帮助？

如果在迁移过程中遇到问题：

1. 检查 Cloudflare Dashboard 中的 D1 数据库日志
2. 确认 SQL 语句是否都执行成功
3. 查看应用的部署日志
4. 参考 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) 了解详细的实现说明

---

## 🎯 快速迁移清单

- [ ] 备份数据库
- [ ] 登录 Cloudflare Dashboard
- [ ] 进入 D1 数据库控制台
- [ ] 执行 users 表的 3 条 ALTER TABLE 语句
- [ ] 执行 nodes 表的 2 条 ALTER TABLE 语句
- [ ] 执行 confs 表的 4 条 INSERT 语句
- [ ] 验证迁移（执行 PRAGMA table_info 查询）
- [ ] 重新部署应用
- [ ] 测试功能是否正常

完成以上步骤后，您的应用就可以正常使用通知功能了！

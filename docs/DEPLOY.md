# 部署指南

本指南将帮助您将 EasyTier 节点管理系统部署到 Cloudflare Workers。

## 前置要求

1. Node.js 18+ 和 npm
2. Cloudflare 账户
3. Resend 账户（用于发送邮件）

## 步骤 1: 克隆项目

```bash
git clone <your-repo-url>
cd easytierwork
```

## 步骤 2: 安装依赖

```bash
npm install
```

## 步骤 3: 登录 Cloudflare

```bash
npx wrangler login
```

这将打开浏览器，让您登录 Cloudflare 账户。

## 步骤 4: 创建 D1 数据库

```bash
npx wrangler d1 create easytier-db
```

命令执行后，会返回类似以下的信息：

```
✅ Successfully created DB 'easytier-db'

[[d1_databases]]
binding = "DB"
database_name = "easytier-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要**: 复制 `database_id`，稍后需要用到。

## 步骤 5: 配置 wrangler.jsonc

编辑 `wrangler.jsonc` 文件，更新以下内容：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "easytier-worker",
  "compatibility_date": "2025-08-03",
  "main": "./src/index.tsx",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "easytier-db",
      "database_id": "your-database-id-here"  // 替换为步骤 4 中的 database_id
    }
  ],
  "vars": {
    "JWT_SECRET": "your-strong-jwt-secret-at-least-32-characters",  // 生成一个强密钥
    "ADMIN_EMAIL": "admin@yourdomain.com",  // 管理员邮箱
    "RESEND_API_KEY": "re_xxxxxxxxxxxx"  // Resend API 密钥
  }
}
```

### 生成 JWT 密钥

您可以使用以下命令生成一个随机的 JWT 密钥：

```bash
# Linux/Mac
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 获取 Resend API 密钥

1. 访问 https://resend.com
2. 注册/登录账户
3. 在 Dashboard 中创建 API Key
4. 复制 API Key 到配置文件

## 步骤 6: 初始化数据库

```bash
npx wrangler d1 execute easytier-db --file=./schema.sql
```

这将创建所有必要的表和索引。

### 验证数据库

```bash
# 查看表结构
npx wrangler d1 execute easytier-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# 查看管理员用户
npx wrangler d1 execute easytier-db --command="SELECT * FROM users WHERE is_admin=1"
```

## 步骤 7: 本地测试

```bash
npm run dev
```

访问 http://localhost:5173 测试应用。

### 测试清单

- [ ] 访问首页，查看统计信息
- [ ] 注册新用户
- [ ] 登录（使用默认管理员账户：admin@example.com / admin123）
- [ ] 创建测试节点
- [ ] 测试节点上报 API
- [ ] 测试节点查询 API

## 步骤 8: 部署到生产环境

```bash
npm run deploy
```

部署成功后，会显示您的 Workers URL：

```
Published easytier-worker (x.xx sec)
  https://easytier-worker.your-account.workers.dev
```

## 步骤 9: 配置自定义域名（可选）

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 选择您的 Worker
4. 点击 "Triggers" 标签
5. 在 "Custom Domains" 部分添加您的域名

## 步骤 10: 配置邮件发送域名

在 Resend 中配置发件域名：

1. 登录 Resend Dashboard
2. 进入 "Domains" 页面
3. 添加您的域名
4. 按照指引配置 DNS 记录
5. 验证域名

## 步骤 11: 更新管理员密码

**重要**: 首次部署后，立即更改默认管理员密码！

1. 访问您的应用
2. 使用默认账户登录（admin@example.com / admin123）
3. 修改密码

或者，直接在数据库中更新：

```bash
# 生成新密码的哈希（使用 Node.js）
node -e "const crypto = require('crypto'); const password = 'your-new-password'; const hash = crypto.createHash('sha256').update(password).digest('base64'); console.log(hash);"

# 更新数据库
npx wrangler d1 execute easytier-db --command="UPDATE users SET password_hash='your-hash-here' WHERE email='admin@example.com'"
```

## 步骤 12: 配置环境变量（生产环境）

对于生产环境，建议使用 Cloudflare Workers 的 Secrets 功能来存储敏感信息：

```bash
# 设置 JWT 密钥
npx wrangler secret put JWT_SECRET
# 输入您的密钥

# 设置 Resend API 密钥
npx wrangler secret put RESEND_API_KEY
# 输入您的 API 密钥
```

然后从 `wrangler.jsonc` 中移除这些敏感信息。

## 监控和维护

### 查看日志

```bash
npx wrangler tail
```

### 数据库备份

```bash
# 导出数据库
npx wrangler d1 export easytier-db --output=backup.sql

# 恢复数据库
npx wrangler d1 execute easytier-db --file=backup.sql
```

### 查看使用情况

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 选择您的 Worker
4. 查看 "Metrics" 标签

## 故障排除

### 问题 1: 数据库连接失败

**错误**: `Error: D1_ERROR: no such table: users`

**解决方案**: 确保已执行 schema.sql 初始化数据库

```bash
npx wrangler d1 execute easytier-db --file=./schema.sql
```

### 问题 2: JWT 验证失败

**错误**: `Error: 无效的令牌`

**解决方案**: 
1. 检查 JWT_SECRET 是否配置正确
2. 清除浏览器 localStorage 中的旧 token
3. 重新登录

### 问题 3: 邮件发送失败

**错误**: `Error: Failed to send email`

**解决方案**:
1. 检查 RESEND_API_KEY 是否有效
2. 确认 Resend 账户状态正常
3. 检查发件域名是否已验证

### 问题 4: CORS 错误

**错误**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**解决方案**: 在 `src/index.tsx` 中配置 CORS：

```typescript
app.use('/*', cors({
  origin: ['https://yourdomain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))
```

## 性能优化建议

1. **启用缓存**: 对于公开 API，可以使用 Cloudflare Cache API
2. **数据库索引**: 已在 schema.sql 中创建，确保不要删除
3. **限流**: 考虑添加 rate limiting 防止滥用
4. **CDN**: 静态资源使用 Cloudflare CDN

## 安全建议

1. ✅ 使用强 JWT 密钥（至少 32 字符）
2. ✅ 定期更换密钥
3. ✅ 启用 HTTPS（Cloudflare Workers 默认启用）
4. ✅ 配置 CORS 限制允许的域名
5. ✅ 定期备份数据库
6. ✅ 监控异常访问
7. ✅ 使用 Secrets 存储敏感信息

## 扩展功能

### 添加速率限制

可以使用 Cloudflare Workers KV 或 Durable Objects 实现速率限制。

### 添加日志记录

可以使用 Cloudflare Workers Analytics Engine 记录详细日志。

### 添加监控告警

可以集成 Sentry 或其他监控服务。

## 成本估算

Cloudflare Workers 免费套餐：
- 100,000 请求/天
- 10ms CPU 时间/请求

D1 数据库免费套餐：
- 5GB 存储
- 500 万行读取/天
- 10 万行写入/天

Resend 免费套餐：
- 100 封邮件/天
- 3,000 封邮件/月

对于小型项目，完全可以使用免费套餐。

## 升级指南

### 从开发环境升级到生产环境

1. 备份数据库
2. 更新代码
3. 运行数据库迁移（如有）
4. 部署新版本
5. 验证功能
6. 回滚（如有问题）

### 数据库迁移

创建迁移文件 `migrations/001_add_new_field.sql`：

```sql
ALTER TABLE nodes ADD COLUMN new_field TEXT;
```

执行迁移：

```bash
npx wrangler d1 execute easytier-db --file=./migrations/001_add_new_field.sql
```

## 支持

如有问题，请：
1. 查看文档
2. 搜索已有 Issues
3. 提交新 Issue
4. 联系维护者

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Hono 文档](https://hono.dev/)
- [Resend 文档](https://resend.com/docs)

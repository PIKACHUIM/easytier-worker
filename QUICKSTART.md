# 快速开始指南

本指南将帮助您快速部署和使用 EasyTier 节点管理系统。

## 前置要求

- Node.js 16+ 
- npm 或 yarn
- Cloudflare 账户
- Wrangler CLI

## 步骤 1: 克隆项目

```bash
git clone https://github.com/yourusername/easytier-worker.git
cd easytier-worker
```

## 步骤 2: 安装依赖

```bash
npm install
```

## 步骤 3: 创建 D1 数据库

```bash
# 登录 Cloudflare
npx wrangler login

# 创建数据库
npx wrangler d1 create easytier-db
```

记录返回的 `database_id`，例如：
```
✅ Successfully created DB 'easytier-db'
database_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 步骤 4: 配置环境变量

复制示例配置文件：
```bash
cp wrangler.example.jsonc wrangler.test.jsonc
```

编辑 `wrangler.jsonc`，填入以下信息：

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
      "database_id": "your-database-id-here"  // 替换为步骤3中的 database_id
    }
  ],
  "vars": {
    "JWT_SECRET": "your-random-secret-key-here",  // 生成一个强随机密钥
    "ADMIN_EMAIL": "admin@example.com",
    "RESEND_API_KEY": ""  // 可选，也可以在系统设置中配置
  }
}
```

### 生成 JWT 密钥

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

将生成的密钥填入 `JWT_SECRET`。

## 步骤 5: 初始化数据库

```bash
# 执行 schema.sql
npx wrangler d1 execute easytier-db --file=./schema.sql
```

如果成功，您会看到：
```
🌀 Executing on easytier-db (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
🌀 To execute on your local development database, pass the --local flag to 'wrangler d1 execute'
🚣 Executed 6 commands in 0.123s
```

## 步骤 6: 本地测试

```bash
npm run dev
```

访问 http://localhost:8787

## 步骤 7: 初始化系统

1. 在浏览器中访问 http://localhost:8787/initialize
2. 填写以下信息：
   - **JWT 密钥**: 输入 `wrangler.jsonc` 中的 `JWT_SECRET`
   - **管理员邮箱**: 例如 `admin@example.com`
   - **密码**: 至少 6 位，建议使用强密码
   - **确认密码**: 再次输入密码
3. 点击"初始化系统"
4. 初始化成功后会自动跳转到登录页面

## 步骤 8: 登录系统

1. 使用刚才创建的管理员邮箱和密码登录
2. 登录成功后会跳转到仪表板

## 步骤 9: 配置邮件服务（可选）

如果需要发送验证邮件，需要配置 Resend：

1. 访问 [Resend](https://resend.com) 注册账户
2. 创建 API 密钥
3. 添加并验证域名
4. 在系统中访问 `/settings` 页面
5. 填写 Resend 配置：
   - **Resend API 密钥**: 从 Resend 控制台获取
   - **发件人邮箱**: 例如 `noreply@yourdomain.com`
   - **发件域名**: 例如 `yourdomain.com`
6. 点击"保存设置"

## 步骤 10: 部署到 Cloudflare Workers

```bash
npm run deploy
```

部署成功后，您会看到：
```
✨ Deployment complete!
🌎 https://easytier-worker.your-subdomain.workers.dev
```

访问部署后的 URL，重复步骤 7-9 完成线上环境的初始化。

## 下一步

### 添加节点

1. 登录系统
2. 访问仪表板
3. 点击"添加节点"
4. 填写节点信息
5. 保存

### 节点上报

使用提供的 Python 脚本上报节点状态：

```bash
cd examples
python node_reporter.py
```

编辑脚本中的配置：
```python
API_URL = "https://your-domain.workers.dev"
NODE_ID = 1  # 您的节点 ID
```

### 客户端查询

使用提供的 Python 脚本查询节点：

```bash
cd examples
python client_query.py
```

## 常见问题

### Q: 数据库初始化失败

**A:** 检查以下几点：
- 确认 `database_id` 正确
- 确认已登录 Cloudflare (`npx wrangler login`)
- 尝试使用 `--local` 参数在本地测试

### Q: 初始化页面提示 JWT 密钥错误

**A:** 确保输入的密钥与 `wrangler.jsonc` 中的 `JWT_SECRET` 完全一致。

### Q: 本地开发端口被占用

**A:** 修改 `package.json` 中的 dev 命令，添加 `--port` 参数：
```json
"dev": "wrangler dev --port 8788"
```

### Q: 部署后无法访问

**A:** 检查以下几点：
- 确认部署成功
- 检查 Cloudflare Workers 控制台是否有错误
- 使用 `npx wrangler tail` 查看实时日志

## 获取帮助

- 查看 [完整文档](./README.md)
- 查看 [API 文档](./API.md)
- 查看 [初始化指南](./INITIALIZATION.md)
- 提交 [Issue](https://github.com/yourusername/easytier-worker/issues)

## 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Hono 文档](https://hono.dev/)
- [Resend 文档](https://resend.com/docs)
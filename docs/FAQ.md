# 常见问题解答 (FAQ)

## 一般问题

### Q1: 这个项目是做什么的？

A: EasyTier 节点管理系统是一个基于 Cloudflare Workers 的节点信息管理和 API 下放系统。它允许用户：
- 注册和管理自己的 EasyTier 节点
- 节点自动上报状态（带宽、流量、连接数等）
- 客户端智能查询可用节点（支持多种负载均衡策略）
- 管理员统一管理所有节点

### Q2: 为什么选择 Cloudflare Workers？

A: Cloudflare Workers 提供：
- 全球边缘网络，低延迟
- 免费套餐足够小型项目使用
- 无需管理服务器
- 自动扩展
- 内置 D1 数据库

### Q3: 这个项目是免费的吗？

A: 是的，项目代码是开源的（GPL-3.0 许可证）。使用 Cloudflare 免费套餐可以零成本运行：
- Workers: 100,000 请求/天
- D1: 5GB 存储，500 万行读取/天
- Resend: 100 封邮件/天

## 安装和配置

### Q4: 如何开始使用？

A: 按照以下步骤：
1. 克隆项目
2. 运行 `npm install`
3. 配置 Cloudflare 和 D1 数据库
4. 更新 `wrangler.jsonc` 配置
5. 初始化数据库
6. 本地测试或直接部署

详细步骤请查看 [DEPLOY.md](DEPLOY.md)

### Q5: 需要什么前置条件？

A: 您需要：
- Node.js 18+
- Cloudflare 账户（免费）
- Resend 账户（免费，用于发送邮件）
- 基本的命令行知识

### Q6: 如何生成 JWT 密钥？

A: 使用以下命令之一：

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 在线工具
# 访问 https://generate-random.org/api-token-generator
```

### Q7: 如何获取 Resend API 密钥？

A:
1. 访问 https://resend.com
2. 注册/登录账户
3. 进入 Dashboard
4. 点击 "API Keys"
5. 创建新的 API Key
6. 复制密钥到 `wrangler.jsonc`

## 使用问题

### Q8: 默认管理员账户是什么？

A:
- 邮箱: `admin@example.com`
- 密码: `admin123`

**⚠️ 重要**: 首次登录后请立即修改密码！

### Q9: 如何添加节点？

A:
1. 注册并登录账户
2. 进入仪表板
3. 点击"添加节点"
4. 填写节点信息
5. 保存

### Q10: 节点如何上报状态？

A: 有两种方式：

1. **使用示例脚本**:
   ```bash
   python3 examples/node_reporter.py --node-id 1 --api-url https://your-domain.workers.dev
   ```

2. **自己实现**:
   发送 POST 请求到 `/api/report`，参考 [API.md](API.md)

### Q11: 如何查询可用节点？

A: 发送 POST 请求到 `/api/query`：

```bash
curl -X POST https://your-domain.workers.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "region": "domestic",
    "priority": "traffic",
    "relay_only": false
  }'
```

或使用示例脚本：
```bash
python3 examples/client_query.py --api-url https://your-domain.workers.dev query --region domestic
```

### Q12: 负载均衡算法是如何工作的？

A: 系统支持三种优先级：

1. **流量优先**: 计算人均日流量 = (最大流量 - 已用流量) / 剩余天数 / 当前连接数
2. **带宽优先**: 计算人均带宽 = 阶梯带宽 / 当前连接数
3. **延迟优先**: 简化实现，返回连接数最少的节点

## 技术问题

### Q13: 数据库连接失败怎么办？

A: 检查：
1. `wrangler.jsonc` 中的 `database_id` 是否正确
2. 数据库是否已创建：`npx wrangler d1 list`
3. 数据库是否已初始化：`npx wrangler d1 execute easytier-db --command="SELECT name FROM sqlite_master WHERE type='table'"`

### Q14: JWT 验证失败怎么办？

A: 可能的原因：
1. `JWT_SECRET` 配置错误
2. Token 已过期
3. Token 格式不正确

解决方法：
1. 检查配置
2. 清除浏览器 localStorage
3. 重新登录

### Q15: 邮件发送失败怎么办？

A: 检查：
1. `RESEND_API_KEY` 是否正确
2. Resend 账户是否正常
3. 发件域名是否已验证
4. 是否超出免费额度

### Q16: 如何查看日志？

A: 使用 Cloudflare Workers 日志：

```bash
npx wrangler tail
```

或在 Cloudflare Dashboard 中查看。

### Q17: 如何备份数据库？

A: 导出数据库：

```bash
npx wrangler d1 export easytier-db --output=backup.sql
```

恢复数据库：

```bash
npx wrangler d1 execute easytier-db --file=backup.sql
```

### Q18: 如何更新数据库结构？

A:
1. 创建迁移文件（如 `migrations/001_add_field.sql`）
2. 执行迁移：
   ```bash
   npx wrangler d1 execute easytier-db --file=./migrations/001_add_field.sql
   ```
3. 更新 TypeScript 类型定义

### Q19: 如何添加自定义域名？

A:
1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 选择您的 Worker
4. 点击 "Triggers" 标签
5. 在 "Custom Domains" 添加域名

### Q20: 如何限制 API 访问频率？

A: 当前版本未实现速率限制。您可以：
1. 使用 Cloudflare Workers KV 实现
2. 使用 Cloudflare Rate Limiting 规则
3. 集成第三方服务

## 开发问题

### Q21: 如何添加新的 API 路由？

A:
1. 在 `src/routes/` 创建新文件
2. 实现路由逻辑
3. 在 `src/index.tsx` 中注册：
   ```typescript
   import newRoute from './routes/new-route'
   app.route('/api/new', newRoute)
   ```
4. 更新 `API.md` 文档

### Q22: 如何修改前端页面？

A:
1. 编辑 `src/index.tsx` 中的组件
2. 修改 `src/style.css` 样式
3. 更新 `src/client/` 中的脚本

### Q23: 如何添加新的数据库表？

A:
1. 在 `schema.sql` 中添加表定义
2. 在 `src/types.ts` 中添加类型定义
3. 创建相应的 API 路由
4. 更新文档

### Q24: 如何集成其他服务？

A: 可以集成：
- Sentry（错误监控）
- Cloudflare Analytics（分析）
- Telegram Bot（通知）
- 其他 API 服务

在 `src/utils.ts` 或创建新的工具文件。

## 性能和优化

### Q25: 如何提高性能？

A:
1. 使用数据库索引（已在 schema.sql 中创建）
2. 启用 Cloudflare Cache API
3. 优化查询语句
4. 减少不必要的数据传输

### Q26: 免费套餐够用吗？

A: 对于小型项目：
- 每天 10 万请求足够
- D1 免费套餐支持 500 万行读取/天
- 如果超出，可以升级到付费套餐

### Q27: 如何监控使用情况？

A:
1. Cloudflare Dashboard 查看 Workers 指标
2. D1 Dashboard 查看数据库使用情况
3. 集成 Analytics Engine 记录详细日志

## 安全问题

### Q28: 这个系统安全吗？

A: 系统实现了基本的安全措施：
- JWT 认证
- 密码哈希
- HTTPS（Cloudflare 默认）
- 权限控制

但建议：
- 使用强密码
- 定期更换密钥
- 配置 CORS
- 定期备份数据

### Q29: 如何防止 API 滥用？

A: 建议：
1. 实现速率限制
2. 添加 API Key 认证
3. 使用 Cloudflare WAF
4. 监控异常访问

### Q30: 密码是如何存储的？

A: 当前使用 SHA-256 哈希。建议升级到 bcrypt（需要 Workers 兼容的实现）。

## 其他问题

### Q31: 如何贡献代码？

A: 请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

### Q32: 在哪里报告 Bug？

A: 在 GitHub Issues 中报告，包含：
- Bug 描述
- 复现步骤
- 环境信息
- 相关日志

### Q33: 如何获取帮助？

A:
1. 查看文档（README.md, API.md, DEPLOY.md）
2. 搜索已有 Issues
3. 创建新 Issue
4. 联系维护者

### Q34: 项目的未来计划？

A: 可能的改进：
- 更完善的前端 UI
- 更多的负载均衡策略
- 节点健康检查
- 图表和可视化
- 多语言支持
- 移动端适配

### Q35: 可以商用吗？

A: 可以，但请遵守 GPL-3.0 许可证。如果您修改了代码并分发，需要开源您的修改。

---

## 还有问题？

如果您的问题没有在这里找到答案：

1. 查看完整文档
2. 搜索 GitHub Issues
3. 创建新 Issue
4. 联系维护者

我们会持续更新这个 FAQ！

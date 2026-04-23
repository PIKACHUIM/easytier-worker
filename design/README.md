## 📚 EasyTier 节点管理系统 - 核心文档

> 本文档包含系统使用、管理和开发的核心信息。

---

## 📂 文档索引

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | **本文档** — 系统概览、快速开始、用户/节点管理、常见问题 |
| [API.md](./API.md) | 完整 API 接口文档（认证、节点、公开接口、系统管理） |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南（开发规范、提交流程、代码风格） |
| [CRON_TASK_README.md](./CRON_TASK_README.md) | 定时任务说明（节点状态检查、统计数据更新、历史记录） |
| [DATABASE_MIGRATION_README.md](./DATABASE_MIGRATION_README.md) | 数据库迁移指南（通知功能字段迁移） |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | 通知功能说明（微信/邮件/Telegram 下线通知配置） |
| [ET协议/](./ET协议/) | EasyTier 协议设计文档（节点认证、安全模式、中继管理） |

---

## 🚀 快速开始

### 1️⃣ 部署系统

```bash
# 克隆项目
git clone https://github.com/yourusername/easytierwork.git
cd easytierwork
npm install

# 创建数据库
npx wrangler d1 create easytier-db
# 记录返回的 database_id

# 配置环境（编辑 wrangler.jsonc）
# 填入 database_id 和生成 JWT_SECRET

# 初始化数据库
npx wrangler d1 execute easytier-db --file=./schema.sql

# 部署到 Cloudflare
npm run deploy
```

### 2️⃣ 系统初始化

1. 访问 `https://your-domain.workers.dev/initialize`
2. 输入 JWT 密钥（来自配置文件）
3. 设置超级管理员账户
4. 完成初始化

### 3️⃣ 开始使用

- **管理员**: 登录后台管理系统
- **用户**: 注册账户并添加节点
- **开发者**: 使用 API 接入

---

## 👥 用户管理

### 权限体系

```
超级管理员 ──┬── 管理所有用户
            ├── 修改系统设置
            └── 查看所有节点

普通管理员 ──┬── 查看所有节点
            ├── 修改系统设置
            └── 管理自己的节点

普通用户 ─────┴── 管理自己的节点
```

### 用户操作

| 操作 | 超级管理员 | 普通管理员 | 普通用户 |
|------|------------|------------|----------|
| 查看所有节点 | ✅ | ✅ | ❌ |
| 修改系统设置 | ✅ | ✅ | ❌ |
| 管理用户权限 | ✅ | ❌ | ❌ |
| 删除用户 | ✅ | ❌ | ❌ |
| 管理自己的节点 | ✅ | ✅ | ✅ |

---

## 🖥️ 节点管理

### 添加节点

```json
{
  "node_name": "北京节点1",
  "region_type": "domestic",
  "region_detail": "北京",
  "connections": [
    {"type": "TCP", "ip": "1.2.3.4", "port": 8080},
    {"type": "WS", "ip": "1.2.3.4", "port": 8081}
  ],
  "tier_bandwidth": 100,
  "max_bandwidth": 1000,
  "max_traffic": 1000,
  "reset_cycle": 30,
  "max_connections": 100,
  "allow_relay": true,
  "tags": "高速,稳定",
  "valid_until": "2025-12-31"
}
```

### 节点状态

- **在线**: 节点正常工作
- **离线**: 节点未上报或异常
- **负荷**: 2-9级，数字越大负载越高

---

## 🔌 API 使用

### 节点上报

```bash
curl -X POST https://your-domain.workers.dev/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "node_name": "beijing-node-1",
    "email": "user@example.com",
    "token": "your-report-token",
    "current_bandwidth": 50.5,
    "reported_traffic": 0.5,
    "connection_count": 5,
    "status": "online"
  }'
```

### 智能查询

```bash
# 流量优先
curl -X POST https://your-domain.workers.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{"region": "domestic", "priority": "traffic"}'

# 带宽优先
curl -X POST https://your-domain.workers.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{"priority": "bandwidth"}'

# 延迟优先
curl -X POST https://your-domain.workers.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{"priority": "latency"}'
```

### 获取统计

```bash
curl https://your-domain.workers.dev/api/stats
```

---

## 🔑 Token 管理

### 获取 Token

1. 登录系统
2. 进入"我的节点"
3. 查看节点卡片的"上报Token"
4. 复制32位十六进制Token

### 重新生成 Token

1. 在节点列表中找到目标节点
2. 点击"重新生成Token"
3. 复制新Token并更新上报脚本

⚠️ **注意**: 重新生成后旧Token立即失效！

---

## ⚙️ 系统配置

### 邮件服务 (Resend)

```json
{
  "resend_api_key": "re_xxxxx",
  "resend_from_email": "noreply@yourdomain.com",
  "resend_from_domain": "yourdomain.com"
}
```

配置步骤：
1. 注册 [Resend](https://resend.com) 账户
2. 创建 API 密钥
3. 添加并验证域名
4. 在系统设置中填写配置

### 网站设置

```json
{
  "site_name": "EasyTier 节点管理系统",
  "site_url": "https://easytier.example.com"
}
```

---

## 🛠️ 开发指南

### 项目结构

```
src/
├── routes/          # API 路由
│   ├── auth.ts     # 用户认证
│   ├── nodes.ts    # 节点管理
│   ├── api.ts      # 公开 API
│   └── system.ts   # 系统管理
├── client/         # 前端脚本
├── index.tsx       # 应用入口
├── types.ts        # 类型定义
├── utils.ts        # 工具函数
└── style.css       # 样式文件
```

### 本地开发

```bash
npm run dev
# 访问 http://localhost:8787
```

### 添加新功能

1. 在 `src/routes/` 创建路由文件
2. 在 `src/index.tsx` 注册路由
3. 更新前端组件和样式
4. 测试并更新文档

---

## 📊 负载均衡算法

### 流量优先
```
人均日流量 = (最大流量 - 已用流量) / 剩余天数 / 当前连接数
```
优先分配人均日流量最高的节点

### 带宽优先
```
人均带宽 = 当前阶梯带宽 / 当前连接数
```
优先分配人均带宽最高的节点

### 延迟优先
返回连接数最少的节点（简化实现，实际应基于地理距离）

---

## 🔒 安全最佳实践

### 必须配置
- ✅ 使用强随机 JWT_SECRET
- ✅ 启用 HTTPS（Cloudflare 默认）
- ✅ 配置邮件验证（可选但推荐）

### 建议措施
- 🔐 定期更换密钥
- 🔐 使用强密码
- 🔐 谨慎授予管理员权限
- 🔐 定期备份数据

### 安全检查清单
- [ ] JWT_SECRET 足够复杂（32字符以上）
- [ ] 超级管理员使用强密码
- [ ] Resend API 密钥已配置
- [ ] 用户权限分配合理
- [ ] 定期查看系统日志

---

## ❓ 常见问题

### 系统初始化

**Q: 忘记 JWT 密钥怎么办？**
A: 查看 `wrangler.jsonc` 中的 `JWT_SECRET` 配置

**Q: 可以重新初始化系统吗？**
A: 需要手动在数据库中重置初始化状态，不建议重复初始化

### 节点管理

**Q: 节点显示离线怎么办？**
A: 检查上报脚本、Token是否正确、网络连接是否正常

**Q: 如何批量添加节点？**
A: 当前版本仅支持单个添加，可以通过 API 批量导入

### API 使用

**Q: 查询返回空结果？**
A: 检查节点状态、地域筛选、查询条件是否正确

**Q: Token 验证失败？**
A: 确认节点名称、邮箱、Token三者匹配

### 邮件服务

**Q: 邮件发送失败？**
A: 检查 Resend API 密钥、域名验证、发送频率限制

---

## 📈 性能监控

### 关键指标

| 指标 | 监控方法 | 正常范围 |
|------|----------|----------|
| 响应时间 | `npx wrangler tail` | < 100ms |
| 错误率 | Cloudflare Dashboard | < 1% |
| 数据库查询 | D1 Dashboard | < 50ms |
| 内存使用 | Workers Dashboard | < 128MB |

### 优化建议

- 🚀 使用数据库索引
- 🚀 启用 Cloudflare 缓存
- 🚀 减少 API 响应大小
- 🚀 优化查询语句

---

## 🆘 故障排除

### 数据库问题

```bash
# 检查数据库连接
npx wrangler d1 list
npx wrangler d1 execute easytier-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# 备份数据库
npx wrangler d1 export easytier-db --output=backup.sql

# 恢复数据库
npx wrangler d1 execute easytier-db --file=backup.sql
```

### 日志查看

```bash
# 实时日志
npx wrangler tail

# 按条件过滤
npx wrangler tail --format=pretty
```

### 常见错误代码

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| 401 | 未授权 | 检查 JWT Token |
| 403 | 权限不足 | 检查用户权限 |
| 404 | 资源不存在 | 检查 API 路径 |
| 500 | 服务器错误 | 查看日志 |

---

## 📞 获取帮助

### 文档资源
- 📖 [API 文档](API.md)
- 🔔 [通知功能说明](IMPLEMENTATION_SUMMARY.md)
- ⏱️ [定时任务说明](CRON_TASK_README.md)
- 🗄️ [数据库迁移指南](DATABASE_MIGRATION_README.md)
- 🤝 [贡献指南](CONTRIBUTING.md)
- 💻 [示例代码](../examples/)

### 社区支持
- 🐛 [GitHub Issues](https://github.com/yourusername/easytierwork/issues)
- 💬 [GitHub Discussions](https://github.com/yourusername/easytierwork/discussions)
- 📧 邮箱: your-email@example.com

### 贡献指南
- 🍴 Fork 项目
- 🌿 创建特性分支
- 📝 提交更改
- 🔄 发起 Pull Request

---

## 📝 版本信息

- **当前版本**: v2.0.0
- **最后更新**: 2025-01-04
- **维护状态**: 🟢 活跃开发
- **许可证**: GPL-3.0

---

<div align="center">

**感谢使用 EasyTier 节点管理系统！**

如果这个项目对您有帮助，请给我们一个 ⭐

Made with ❤️ by EasyTier Team

</div>
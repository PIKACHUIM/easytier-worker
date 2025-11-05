# EasyTier 节点管理系统

一个基于 Hono 和 Cloudflare Workers 的 EasyTier 节点信息管理和 API 下放系统。

## 功能特性

### 系统管理
- ✅ 系统初始化（使用 JWT 密钥验证）
- ✅ 超级管理员账户创建
- ✅ 系统设置管理（Resend 配置、网站配置）
- ✅ 用户权限管理（授予/撤销管理员权限）
- ✅ 用户删除功能

### 用户管理
- ✅ 用户注册（邮箱 + 密码）
- ✅ 邮箱验证（使用 Resend）
- ✅ 用户登录
- ✅ JWT 认证
- ✅ 三级权限系统（超级管理员/管理员/普通用户）

### 节点管理
- ✅ 节点信息管理（名称、地域、连接方式等）
- ✅ 多种连接方式支持（TCP/UDP/WS/WSS/WG）
- ✅ 带宽和流量监控
- ✅ 连接数管理
- ✅ 节点状态追踪（在线/离线）
- ✅ 30天负荷历史记录
- ✅ 节点标签和备注
- ✅ 中转功能开关
- ✅ 上报Token管理（查看、复制、重新生成）

### API 功能
- ✅ 节点上报接口（带宽、流量、连接数、状态）
  - 🔐 Token验证机制（每个节点独立Token）
  - 📝 使用节点名称+邮箱+Token进行验证
- ✅ 智能负载均衡查询
  - 流量优先：基于人均日流量分配
  - 带宽优先：基于人均带宽分配
  - 延迟优先：基于物理距离分配
- ✅ 地域筛选（国内/海外/全部）
- ✅ 中转节点筛选
- ✅ 公开节点列表
- ✅ 统计信息接口

## 技术栈

- **后端框架**: Hono
- **运行环境**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **前端**: 原生 TypeScript + JSX
- **邮件服务**: Resend
- **认证**: JWT

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 创建 D1 数据库

```bash
# 创建数据库
npx wrangler d1 create easytier-db

# 记录返回的 database_id，更新到 wrangler.test.jsonc 中
```

### 3. 初始化数据库

```bash
# 执行 schema.sql 初始化数据库
npx wrangler d1 execute easytier-db --file=./schema.sql
```

### 4. 配置环境变量

编辑 `wrangler.jsonc`，设置以下变量：

```jsonc
{
  "vars": {
    "JWT_SECRET": "your-random-secret-key-here",  // 生成强随机密钥
    "ADMIN_EMAIL": "admin@example.com",
    "RESEND_API_KEY": ""  // 可选，也可以在系统设置中配置
  }
}
```

**生成 JWT 密钥：**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 5. 本地开发

```bash
npm run dev
```

访问 http://localhost:8787

### 6. 系统初始化

首次使用需要初始化系统：

1. 访问 `/initialize` 页面
2. 输入 JWT 密钥（wrangler.jsonc 中的 JWT_SECRET）
3. 设置超级管理员邮箱和密码
4. 完成初始化

详细说明请查看 [INITIALIZATION.md](./INITIALIZATION.md)

### 7. 配置邮件服务（可选）

登录后访问 `/settings` 页面配置 Resend 邮件服务：

1. 在 [Resend](https://resend.com) 注册账户
2. 创建 API 密钥
3. 验证域名
4. 在系统设置中填写配置

### 8. 部署到 Cloudflare Workers

```bash
npm run deploy
```

## 数据库结构

### users 表
- `id`: 用户 ID（自增主键）
- `email`: 邮箱（唯一）
- `password_hash`: 密码哈希
- `is_admin`: 是否为管理员
- `is_super_admin`: 是否为超级管理员
- `is_verified`: 邮箱是否已验证
- `verification_token`: 验证令牌
- `created_at`: 创建时间

### system_settings 表
- `id`: 设置 ID（自增主键）
- `setting_key`: 设置键（唯一）
- `setting_value`: 设置值
- `description`: 描述
- `updated_at`: 更新时间

### nodes 表
- `id`: 节点 ID（自增主键）
- `user_email`: 所属用户邮箱
- `node_name`: 节点名称
- `region_type`: 地域类型（domestic/overseas）
- `region_detail`: 具体地区
- `connections`: 连接方式列表（JSON）
- `current_bandwidth`: 当前带宽（Mbps）
- `tier_bandwidth`: 当前阶梯带宽（Mbps）
- `max_bandwidth`: 服务器最大带宽（Mbps）
- `used_traffic`: 已用流量（GB）
- `correction_traffic`: 修正流量（GB）
- `max_traffic`: 最大流量（GB）
- `reset_cycle`: 重置周期（天）
- `reset_date`: 下次重置日期
- `connection_count`: 当前连接数
- `max_connections`: 最大允许连接数
- `tags`: 标签
- `created_at`: 创建时间
- `valid_until`: 有效期至
- `status`: 当前状态（online/offline）
- `recent_status`: 近期状态（30天负荷历史）
- `notes`: 备注信息
- `allow_relay`: 是否允许中转
- `last_report_at`: 最后上报时间

## 📚 完整文档

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 快速开始指南 - 新手必读 ⭐ |
| [INITIALIZATION.md](./INITIALIZATION.md) | 系统初始化和管理详细指南 ⭐ |
| [API.md](./API.md) | 完整的 API 文档 |
| [OVERVIEW.md](./OVERVIEW.md) | 项目概览和架构说明 ⭐ |
| [CHANGELOG.md](./CHANGELOG.md) | 版本更新日志 ⭐ |
| [VERSION_HISTORY.md](./VERSION_HISTORY.md) | 版本历史和规划 ⭐ |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | 管理员使用指南 ⭐ |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | 部署检查清单 ⭐ |
| [SUMMARY.md](./SUMMARY.md) | 功能实现总结 ⭐ |
| [examples/README.md](./examples/README.md) | 示例脚本使用说明 |

⭐ 标记为本次更新新增的文档

## 权限系统

### 超级管理员 (Super Admin)
- 通过初始化页面创建（使用 JWT 密钥验证）
- 拥有所有权限
- 可以管理用户（授予/撤销管理员权限、删除用户）
- 无法被删除或降权

### 普通管理员 (Admin)
- 由超级管理员授予权限
- 可以查看所有节点
- 可以修改系统设置
- 不能管理用户

### 普通用户 (User)
- 通过注册页面注册
- 只能管理自己的节点
- 需要验证邮箱后才能登录

## 项目结构

```
easytierwork/
├── src/
│   ├── client/          # 客户端脚本
│   │   ├── home.ts      # 首页脚本
│   │   ├── login.ts     # 登录页面脚本
│   │   ├── register.ts  # 注册页面脚本
│   │   ├── dashboard.ts # 用户仪表板脚本
│   │   ├── admin.ts     # 管理员页面脚本
│   │   ├── initialize.ts # 初始化页面脚本
│   │   └── settings.ts  # 系统设置页面脚本
│   ├── routes/          # API 路由
│   │   ├── auth.ts      # 认证相关路由
│   │   ├── nodes.ts     # 节点管理路由
│   │   ├── api.ts       # 公开 API 路由
│   │   └── system.ts    # 系统管理路由
│   ├── index.tsx        # 主入口文件
│   ├── renderer.tsx     # JSX 渲染器
│   ├── types.ts         # TypeScript 类型定义
│   ├── utils.ts         # 工具函数
│   └── style.css        # 样式文件
├── schema.sql           # 数据库 schema
├── wrangler.jsonc       # Cloudflare Workers 配置
├── package.json         # 项目依赖
├── README.md            # 项目文档
├── INITIALIZATION.md    # 初始化和管理指南
└── API.md               # API 文档
```

## 开发指南

### 添加新的 API 路由

1. 在 `src/routes/` 目录下创建新的路由文件
2. 在 `src/index.tsx` 中注册路由
3. 更新 API 文档

### 添加新的页面

1. 在 `src/index.tsx` 中添加新的页面组件
2. 在 `src/client/` 目录下创建对应的客户端脚本
3. 更新样式文件（如需要）

### 数据库迁移

```bash
# 执行 SQL 文件
wrangler d1 execute easytier-db --file=./migration.sql

# 或直接执行 SQL 命令
wrangler d1 execute easytier-db --command="ALTER TABLE nodes ADD COLUMN new_field TEXT"
```

## 安全建议

1. **保护 JWT 密钥**：使用强随机密钥（至少 32 字符），不要分享给他人
2. **超级管理员账户**：使用强密码，定期修改
3. **Resend API 密钥**：妥善保管，定期检查使用情况
4. **配置 CORS**：根据实际需求限制允许的域名
5. **启用 HTTPS**：Cloudflare Workers 默认启用
6. **定期备份数据库**：使用 `npx wrangler d1 export` 命令
7. **谨慎授予管理员权限**：定期审查用户列表

## 性能优化

- 使用 Cloudflare Workers 的全球边缘网络
- D1 数据库索引优化
- 客户端缓存策略
- API 响应压缩

## 故障排除

### 数据库连接失败
- 检查 `wrangler.jsonc` 中的 `database_id` 是否正确
- 确认数据库已创建并初始化

### JWT 验证失败
- 检查 `JWT_SECRET` 是否配置正确
- 确认 token 格式正确

### 邮件发送失败
- 检查 `RESEND_API_KEY` 是否有效
- 确认 Resend 账户状态正常

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

GPL-3.0 License

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。

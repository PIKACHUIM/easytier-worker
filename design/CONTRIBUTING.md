# 贡献指南

感谢您对 EasyTier 节点管理系统的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请：

1. 检查 [Issues](../../issues) 中是否已有相关报告
2. 如果没有，创建新的 Issue，包含：
   - Bug 的详细描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、Node.js 版本等）
   - 相关日志或截图

### 提出新功能

如果您有新功能建议：

1. 检查 [Issues](../../issues) 中是否已有类似建议
2. 创建新的 Issue，标记为 `enhancement`
3. 详细描述功能需求和使用场景
4. 如果可能，提供设计方案或示例代码

### 提交代码

#### 准备工作

1. Fork 本仓库
2. 克隆您的 Fork：
   ```bash
   git clone https://github.com/your-username/easytierwork.git
   cd easytierwork
   ```
3. 添加上游仓库：
   ```bash
   git remote add upstream https://github.com/original-owner/easytierwork.git
   ```
4. 安装依赖：
   ```bash
   npm install
   ```

#### 开发流程

1. 创建新分支：
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

2. 进行开发：
   - 遵循代码规范
   - 添加必要的注释
   - 编写测试（如适用）

3. 提交更改：
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # 或
   git commit -m "fix: fix bug description"
   ```

4. 推送到您的 Fork：
   ```bash
   git push origin feature/your-feature-name
   ```

5. 创建 Pull Request：
   - 访问 GitHub 上的原仓库
   - 点击 "New Pull Request"
   - 选择您的分支
   - 填写 PR 描述

#### Commit 规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat: add node status visualization
fix: correct traffic calculation in report API
docs: update deployment guide
```

#### 代码规范

1. **TypeScript**:
   - 使用 TypeScript 类型注解
   - 避免使用 `any` 类型
   - 导出的函数和类必须有 JSDoc 注释

2. **命名规范**:
   - 变量和函数：camelCase
   - 类和接口：PascalCase
   - 常量：UPPER_SNAKE_CASE
   - 文件名：kebab-case

3. **代码风格**:
   - 使用 2 空格缩进
   - 使用单引号
   - 每行最多 100 字符
   - 函数最多 50 行

4. **注释**:
   - 复杂逻辑必须添加注释
   - 公开 API 必须有 JSDoc
   - 使用中文注释

#### 测试

在提交 PR 前，请确保：

1. 代码能够正常编译：
   ```bash
   npm run build
   ```

2. 本地测试通过：
   ```bash
   npm run dev
   ```

3. 如果添加了新功能，请添加相应的测试

### 文档贡献

文档同样重要！您可以：

1. 修正文档中的错误
2. 改进文档的清晰度
3. 添加示例代码
4. 翻译文档

### 审查流程

1. 提交 PR 后，维护者会进行审查
2. 可能会要求修改
3. 所有讨论解决后，PR 会被合并
4. 您的贡献会被记录在 Contributors 中

## 开发环境设置

### 必需工具

- Node.js 18+
- npm 或 yarn
- Git
- Cloudflare 账户（用于测试）

### 推荐工具

- VS Code
- VS Code 扩展：
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### 本地开发

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 http://localhost:5173

3. 修改代码后会自动重新加载

### 数据库开发

1. 创建本地测试数据库：
   ```bash
   npx wrangler d1 create easytier-db-dev
   ```

2. 初始化数据库：
   ```bash
   npx wrangler d1 execute easytier-db-dev --file=./schema.sql
   ```

3. 查询数据库：
   ```bash
   npx wrangler d1 execute easytier-db-dev --command="SELECT * FROM users"
   ```

## 项目结构

```
easytierwork/
├── src/
│   ├── client/          # 客户端脚本
│   ├── routes/          # API 路由
│   ├── index.tsx        # 主入口
│   ├── types.ts         # 类型定义
│   ├── utils.ts         # 工具函数
│   └── style.css        # 样式
├── examples/            # 示例脚本
├── schema.sql           # 数据库 schema
├── wrangler.jsonc       # Cloudflare 配置
└── package.json         # 项目配置
```

## 常见问题

### Q: 如何添加新的 API 路由？

A: 
1. 在 `src/routes/` 创建新文件
2. 在 `src/index.tsx` 中注册路由
3. 更新 `API.md` 文档

### Q: 如何修改数据库结构？

A:
1. 创建迁移文件 `migrations/xxx.sql`
2. 更新 `schema.sql`
3. 更新相关的 TypeScript 类型

### Q: 如何测试 API？

A:
1. 使用 `curl` 或 Postman
2. 查看 `API.md` 中的示例
3. 使用 `examples/` 中的脚本

## 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 人身攻击或侮辱性评论
- 公开或私下骚扰
- 未经许可发布他人的私人信息
- 其他不道德或不专业的行为

## 许可证

通过贡献代码，您同意您的贡献将在 GPL-3.0 许可证下发布。

## 联系方式

如有问题，请：
- 创建 Issue
- 发送邮件到维护者
- 加入讨论组

## 致谢

感谢所有贡献者！您的贡献让这个项目变得更好。

---

再次感谢您的贡献！🎉

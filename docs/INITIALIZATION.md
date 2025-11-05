# 系统初始化和管理指南

## 目录
- [首次初始化](#首次初始化)
- [系统设置](#系统设置)
- [用户管理](#用户管理)
- [权限说明](#权限说明)

## 首次初始化

### 1. 部署数据库

首先需要创建 D1 数据库并执行 schema：

```bash
# 创建 D1 数据库
npx wrangler d1 create easytier-db

# 记录返回的 database_id，更新到 wrangler.test.jsonc 中

# 执行数据库 schema
npx wrangler d1 execute easytier-db --file=./schema.sql
```

### 2. 配置环境变量

编辑 `wrangler.jsonc` 文件：

```jsonc
{
  "name": "easytier-worker",
  "compatibility_date": "2025-08-03",
  "main": "./src/index.tsx",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "easytier-db",
      "database_id": "your-database-id-here"  // 替换为实际的 database_id
    }
  ],
  "vars": {
    "JWT_SECRET": "your-random-secret-key-here",  // 生成一个随机密钥
    "ADMIN_EMAIL": "admin@example.com",
    "RESEND_API_KEY": ""  // 可选，也可以在系统设置中配置
  }
}
```

**重要：** 请生成一个强随机的 JWT_SECRET，例如：
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. 访问初始化页面

部署完成后，访问 `/initialize` 页面进行系统初始化：

1. 输入 JWT 密钥（即 wrangler.jsonc 中的 JWT_SECRET）
2. 输入超级管理员邮箱
3. 设置管理员密码（至少 6 位）
4. 确认密码

点击"初始化系统"按钮完成初始化。

**注意：** 
- JWT 密钥用于验证初始化请求，确保只有知道密钥的人才能初始化系统
- 初始化只能执行一次，完成后无法再次初始化
- 超级管理员账户拥有最高权限，无法被删除或降权

## 系统设置

登录后，超级管理员和普通管理员都可以访问 `/settings` 页面进行系统设置。

### 邮件服务配置 (Resend)

配置 Resend 邮件服务用于发送用户验证邮件：

1. **Resend API 密钥**
   - 在 [Resend 控制台](https://resend.com/api-keys) 创建 API 密钥
   - 将密钥粘贴到此处

2. **发件人邮箱**
   - 格式：`noreply@yourdomain.com`
   - 必须使用已验证的域名

3. **发件域名**
   - 格式：`yourdomain.com`
   - 需要在 Resend 中添加并验证域名
   - 验证步骤：
     - 登录 [Resend 控制台](https://resend.com/domains)
     - 添加域名
     - 按照提示添加 DNS 记录（SPF、DKIM、DMARC）
     - 等待验证通过

### 网站配置

1. **网站名称**
   - 显示在邮件和页面标题中

2. **网站 URL**
   - 完整的网站地址，例如：`https://easytier.example.com`
   - 用于生成邮件中的验证链接

## 用户管理

在系统设置页面的"用户管理"部分，可以管理所有用户。

### 用户列表

显示所有注册用户的信息：
- 邮箱
- 是否为管理员
- 是否为超级管理员
- 邮箱验证状态
- 注册时间

### 管理员权限管理

**只有超级管理员可以执行以下操作：**

1. **授予管理员权限**
   - 点击"设为管理员"按钮
   - 该用户将获得管理员权限，可以：
     - 查看所有节点
     - 修改系统设置
     - 但不能管理其他用户

2. **撤销管理员权限**
   - 点击"撤销管理员"按钮
   - 该用户将变为普通用户，只能管理自己的节点

3. **删除用户**
   - 点击"删除"按钮
   - 将删除用户及其所有节点
   - **此操作不可恢复，请谨慎操作**

**限制：**
- 超级管理员的权限无法被修改
- 超级管理员账户无法被删除
- 普通管理员无法管理用户

## 权限说明

### 超级管理员 (Super Admin)

- 通过初始化页面创建，使用 JWT 密钥验证
- 环境变量 `ADMIN_EMAIL` 中配置的邮箱永远是超级管理员
- 拥有所有权限：
  - ✅ 管理自己的节点
  - ✅ 查看所有节点
  - ✅ 修改系统设置
  - ✅ 管理用户（授予/撤销管理员权限）
  - ✅ 删除用户
- 无法被删除或降权

### 普通管理员 (Admin)

- 由超级管理员授予权限
- 拥有部分管理权限：
  - ✅ 管理自己的节点
  - ✅ 查看所有节点
  - ✅ 修改系统设置
  - ❌ 不能管理用户
- 可以被超级管理员撤销权限或删除

### 普通用户 (User)

- 通过注册页面注册
- 需要验证邮箱后才能登录
- 只能管理自己的节点：
  - ✅ 添加节点
  - ✅ 修改自己的节点
  - ✅ 删除自己的节点
  - ❌ 不能查看其他用户的节点
  - ❌ 不能修改系统设置
  - ❌ 不能管理用户

## 安全建议

1. **JWT 密钥安全**
   - 使用强随机密钥（至少 32 字符）
   - 不要在代码中硬编码
   - 不要分享给他人
   - 定期更换（需要重新部署）

2. **超级管理员账户**
   - 使用强密码（建议 12 位以上）
   - 不要使用常见邮箱
   - 定期修改密码
   - 不要分享账户

3. **Resend API 密钥**
   - 妥善保管 API 密钥
   - 定期检查使用情况
   - 如有泄露立即重置

4. **用户管理**
   - 谨慎授予管理员权限
   - 定期审查用户列表
   - 及时删除不活跃用户

## 常见问题

### Q: 忘记了 JWT 密钥怎么办？

A: JWT 密钥存储在 `wrangler.jsonc` 中，可以查看该文件获取。如果文件丢失，需要重新生成密钥并重新部署。

### Q: 可以修改超级管理员邮箱吗？

A: 可以，但需要：
1. 修改 `wrangler.jsonc` 中的 `ADMIN_EMAIL`
2. 在数据库中更新用户邮箱
3. 重新部署应用

### Q: 系统已初始化，如何重新初始化？

A: 需要在数据库中执行：
```sql
UPDATE system_settings SET setting_value = '0' WHERE setting_key = 'system_initialized';
```
然后重新访问 `/initialize` 页面。

### Q: Resend 邮件发送失败怎么办？

A: 检查以下几点：
1. API 密钥是否正确
2. 域名是否已验证
3. 发件人邮箱格式是否正确
4. DNS 记录是否配置正确
5. 查看 Resend 控制台的日志

### Q: 如何查看系统日志？

A: 使用 Cloudflare Workers 的日志功能：
```bash
npx wrangler tail
```

## 相关链接

- [Resend 文档](https://resend.com/docs)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [项目 GitHub](https://github.com/yourusername/easytier-worker)
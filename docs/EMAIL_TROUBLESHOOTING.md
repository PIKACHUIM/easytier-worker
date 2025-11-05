# 邮件发送故障排查指南

## 概述

本文档帮助你排查和解决 EasyTier 节点管理系统中 Resend 邮件发送失败的问题。

---

## 1. 邮件验证开关

### 1.1 环境变量配置

系统现在支持通过环境变量控制是否启用邮件验证功能：

**环境变量名称**: `ENABLE_EMAIL_VERIFICATION`

**可选值**:
- `false` 或 不设置 - **默认值**，禁用邮件验证，用户注册后自动激活
- `true` 或 `1` - 启用邮件验证，用户需要点击邮件链接才能激活账户

### 1.2 配置方法

#### 方法1: 在 wrangler.jsonc 中配置

```json
{
  "vars": {
    "JWT_SECRET": "your-secret-key",
    "ENABLE_EMAIL_VERIFICATION": "false"  // 禁用邮件验证
  }
}
```

#### 方法2: 使用 Cloudflare Dashboard

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 选择你的项目
4. 进入 Settings → Variables
5. 添加环境变量：
   - 变量名: `ENABLE_EMAIL_VERIFICATION`
   - 值: `false`

#### 方法3: 使用 wrangler CLI

```bash
npx wrangler secret put ENABLE_EMAIL_VERIFICATION
# 输入: false
```

### 1.3 行为说明

**禁用邮件验证时 (ENABLE_EMAIL_VERIFICATION=false)**:
- ✅ 用户注册后立即激活，无需邮件验证
- ✅ 可以直接登录使用
- ✅ 不会尝试发送验证邮件
- ✅ 适合开发环境或不需要邮件验证的场景

**启用邮件验证时 (ENABLE_EMAIL_VERIFICATION=true)**:
- 📧 用户注册后需要验证邮箱
- 📧 系统会发送验证邮件
- 📧 用户必须点击邮件中的链接才能激活账户
- 📧 未验证的用户无法登录

---

## 2. Resend 邮件发送问题排查

如果你启用了邮件验证但邮件发送失败，请按以下步骤排查：

### 2.1 检查 Resend API Key

#### 问题症状
- 注册时提示"邮件发送失败：邮件服务未配置"
- 日志显示: `[邮件验证] 错误: Resend API Key 未配置`

#### 解决方法

1. **获取 Resend API Key**
   - 访问 https://resend.com
   - 注册/登录账户
   - 进入 API Keys 页面
   - 创建新的 API Key
   - 复制 API Key（格式: `re_xxxxxxxxxxxx`）

2. **配置 API Key**
   - 登录系统管理员账户
   - 进入"系统设置"页面
   - 在"邮件服务配置 (Resend)"部分
   - 填写"Resend API 密钥"
   - 点击"保存设置"

3. **验证配置**
   ```bash
   # 查看日志，应该显示:
   # [邮件验证] Resend配置: { hasApiKey: true, apiKeyLength: 32, ... }
   ```

### 2.2 检查发件人邮箱

#### 问题症状
- 邮件发送失败，返回 403 或 401 错误
- 日志显示: `[邮件验证] 警告: 发件人邮箱未正确配置`

#### 解决方法

1. **在 Resend 中验证域名**
   - 登录 Resend Dashboard
   - 进入 Domains 页面
   - 点击"Add Domain"
   - 输入你的域名（例如: `yourdomain.com`）
   - 按照提示添加 DNS 记录：
     - SPF 记录
     - DKIM 记录
     - DMARC 记录（可选）
   - 等待 DNS 生效（通常几分钟到几小时）
   - 验证域名状态为"Verified"

2. **配置发件人邮箱**
   - 在系统设置中填写"发件人邮箱"
   - 格式: `noreply@yourdomain.com`
   - **必须使用已验证的域名**
   - 点击"保存设置"

3. **常见错误**
   - ❌ `noreply@example.com` - 示例域名，无法发送
   - ❌ `user@gmail.com` - 未验证的第三方域名
   - ✅ `noreply@yourdomain.com` - 已验证的自有域名

### 2.3 检查 Resend API 响应

#### 问题症状
- 邮件发送失败，但 API Key 和域名都已配置

#### 排查步骤

1. **查看详细日志**
   ```bash
   # 系统会输出详细的调试信息:
   [邮件验证] 开始发送验证邮件到: user@example.com
   [邮件验证] Resend配置: { hasApiKey: true, apiKeyLength: 32, fromEmail: "noreply@yourdomain.com", siteUrl: "https://yoursite.com" }
   [邮件验证] 发送请求到 Resend API...
   [邮件验证] Resend API 响应状态: 200
   [邮件验证] Resend API 响应内容: {"id":"xxx"}
   [邮件验证] 验证邮件发送成功
   ```

2. **常见错误代码**

   | 状态码 | 错误原因 | 解决方法 |
   |--------|----------|----------|
   | 401 | API Key 无效 | 重新生成 API Key |
   | 403 | 域名未验证 | 在 Resend 中验证域名 |
   | 422 | 请求参数错误 | 检查发件人邮箱格式 |
   | 429 | 超出配额限制 | 升级 Resend 套餐或等待重置 |
   | 500 | Resend 服务器错误 | 稍后重试或联系 Resend 支持 |

3. **检查 Resend Dashboard**
   - 登录 Resend Dashboard
   - 进入 Logs 页面
   - 查看最近的邮件发送记录
   - 检查失败原因

### 2.4 检查网络连接

#### 问题症状
- 邮件发送超时
- 日志显示网络错误

#### 解决方法

1. **测试 Resend API 连接**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "noreply@yourdomain.com",
       "to": "test@example.com",
       "subject": "Test",
       "html": "<p>Test</p>"
     }'
   ```

2. **检查防火墙规则**
   - 确保 Cloudflare Workers 可以访问 `api.resend.com`
   - 检查是否有网络策略限制

### 2.5 检查 Resend 配额

#### 问题症状
- 返回 429 错误
- 提示超出配额

#### 解决方法

1. **查看当前配额**
   - 登录 Resend Dashboard
   - 查看 Usage 页面
   - 检查已使用的邮件数量

2. **Resend 免费套餐限制**
   - 每天 100 封邮件
   - 每月 3,000 封邮件
   - 如果超出，需要升级套餐

3. **优化邮件发送**
   - 考虑禁用邮件验证（设置 `ENABLE_EMAIL_VERIFICATION=false`）
   - 或升级到付费套餐

---

## 3. 测试邮件发送

### 3.1 测试注册流程

1. **启用邮件验证**
   ```json
   {
     "vars": {
       "ENABLE_EMAIL_VERIFICATION": "true"
     }
   }
   ```

2. **注册测试账户**
   - 访问注册页面
   - 输入邮箱和密码
   - 点击注册

3. **检查响应**
   - 成功: `{ "message": "注册成功，请查收验证邮件" }`
   - 失败: 会返回详细的错误信息

4. **查看日志**
   - 在 Cloudflare Dashboard 中查看 Workers 日志
   - 或使用 `wrangler tail` 实时查看日志

### 3.2 手动验证邮箱

如果邮件发送失败，可以手动验证用户：

```sql
-- 查看用户的验证token
SELECT email, verification_token, is_verified FROM users WHERE email = 'user@example.com';

-- 手动激活用户
UPDATE users SET is_verified = 1, verification_token = NULL WHERE email = 'user@example.com';
```

---

## 4. 推荐配置

### 4.1 开发环境

**推荐禁用邮件验证**，方便快速测试：

```json
{
  "vars": {
    "ENABLE_EMAIL_VERIFICATION": "false"
  }
}
```

### 4.2 生产环境

**推荐启用邮件验证**，确保邮箱真实性：

```json
{
  "vars": {
    "ENABLE_EMAIL_VERIFICATION": "true"
  }
}
```

同时确保：
- ✅ Resend API Key 已配置
- ✅ 域名已在 Resend 中验证
- ✅ 发件人邮箱使用已验证的域名
- ✅ 网站 URL 已正确配置

---

## 5. 常见问题 FAQ

### Q1: 为什么我收不到验证邮件？

**A**: 请按以下顺序检查：
1. 检查垃圾邮件文件夹
2. 确认 Resend API Key 已配置
3. 确认域名已在 Resend 中验证
4. 查看系统日志，确认邮件已发送
5. 在 Resend Dashboard 中查看发送记录

### Q2: 可以使用 Gmail 作为发件人吗？

**A**: 不可以。Resend 要求使用已验证的自有域名。你需要：
1. 拥有一个域名（例如: `yourdomain.com`）
2. 在 Resend 中验证该域名
3. 使用该域名的邮箱作为发件人（例如: `noreply@yourdomain.com`）

### Q3: 如何临时禁用邮件验证？

**A**: 设置环境变量 `ENABLE_EMAIL_VERIFICATION=false`，用户注册后会自动激活。

### Q4: 邮件发送失败会影响注册吗？

**A**: 
- 如果 `ENABLE_EMAIL_VERIFICATION=false`，不影响，用户直接激活
- 如果 `ENABLE_EMAIL_VERIFICATION=true`，用户会注册成功但无法登录，需要手动激活或修复邮件服务

### Q5: 如何查看详细的邮件发送日志？

**A**: 
```bash
# 实时查看日志
npx wrangler tail

# 或在 Cloudflare Dashboard 中查看
# Workers & Pages → 你的项目 → Logs
```

### Q6: Resend 免费套餐够用吗？

**A**: 
- 免费套餐: 100封/天，3000封/月
- 如果用户量不大，免费套餐足够
- 如果超出，可以考虑：
  - 禁用邮件验证
  - 升级到付费套餐（$20/月起）

---

## 6. 联系支持

如果以上方法都无法解决问题，请：

1. **收集信息**
   - 完整的错误日志
   - Resend API 响应
   - 系统配置截图

2. **联系渠道**
   - GitHub Issues: 提交问题报告
   - Resend Support: 如果是 Resend 服务问题

---

## 7. 更新日志

- **2025-11-05**: 添加 `ENABLE_EMAIL_VERIFICATION` 环境变量，默认禁用邮件验证
- **2025-11-05**: 增强邮件发送错误日志，便于排查问题
- **2025-11-05**: 创建本故障排查文档

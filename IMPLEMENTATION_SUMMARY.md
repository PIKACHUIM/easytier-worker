# EasyTier 节点管理系统 - 通知功能实现总结

## 功能概述

本次更新为 EasyTier 节点管理系统添加了完整的通知功能，包括：

1. **用户个人信息管理**：用户可以在个人设置页面添加 QQ 号、微信 UID（WxPusher）、Telegram ID
2. **系统通知服务配置**：管理员可以在系统设置中配置 Telegram Bot 和 WxPusher 应用
3. **节点下线通知**：节点首次下线时，系统可以通过微信、邮箱或 Telegram 通知节点提供者

## 数据库变更

### 1. users 表新增字段

```sql
ALTER TABLE users ADD COLUMN qq_number TEXT;
ALTER TABLE users ADD COLUMN wechat_uid TEXT;
ALTER TABLE users ADD COLUMN telegram_id TEXT;
```

### 2. nodes 表新增字段

```sql
ALTER TABLE nodes ADD COLUMN offline_notify INTEGER DEFAULT 0;
ALTER TABLE nodes ADD COLUMN last_offline_notify_at DATETIME;
```

- `offline_notify`: 通知选项（0=不通知, 1=通知微信, 2=通知邮箱, 3=TG通知）
- `last_offline_notify_at`: 最后一次下线通知时间（用于防止频繁通知）

### 3. confs 表新增配置项

```sql
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) VALUES
  ('telegram_bot_token', '', 'Telegram Bot Token'),
  ('telegram_bot_id', '', 'Telegram Bot ID'),
  ('wxpusher_app_token', '', 'WxPusher 应用 Token'),
  ('wxpusher_app_id', '', 'WxPusher 应用 ID');
```

## 后端实现

### 1. 类型定义更新 (types.ts)

- 更新 `User` 接口，添加 `qq_number`, `wechat_uid`, `telegram_id` 字段
- 更新 `Node` 接口，添加 `offline_notify`, `last_offline_notify_at` 字段
- 更新 `SystemSettingsUpdateRequest` 接口，添加通知服务配置字段
- 更新 `NodeCreateRequest` 和 `NodeUpdateRequest` 接口

### 2. API 路由更新

#### auth.ts
- `GET /api/auth/me`: 返回用户联系方式信息
- `PUT /api/auth/profile`: 更新用户个人信息（QQ/微信/TG）

#### system.ts
- 更新系统初始化时的默认配置，添加通知服务配置项
- 系统设置的获取和保存接口自动支持新配置项

#### nodes.ts
- 创建节点时支持 `offline_notify` 字段
- 更新节点时支持 `offline_notify` 字段

### 3. 通知功能实现 (utils.ts)

#### WxPusher 通知
```typescript
sendWxPusherNotification(appToken, uid, content, summary, url)
```
- 使用 WxPusher API 发送微信通知
- 支持文本、HTML、Markdown 格式

#### Telegram Bot 通知
```typescript
sendTelegramNotification(botToken, chatId, message, parseMode)
```
- 使用 Telegram Bot API 发送通知
- 支持 HTML、Markdown 格式

#### 通知内容生成
```typescript
generateOfflineNotificationContent(nodeName, nodeRegion, offlineTime, siteUrl)
```
- 生成统一格式的通知内容
- 返回文本、HTML、Markdown 三种格式

### 4. 定时任务更新 (index.tsx)

在 `scheduled()` 函数中添加节点下线通知逻辑：

1. 检测超过 10 分钟未上报的在线节点
2. 查询节点的通知配置和用户联系方式
3. 根据配置发送相应的通知（微信/邮箱/Telegram）
4. 记录通知时间，1 小时内最多通知一次

## 前端实现

### 1. 个人设置页面 (UserToken.tsx + usertoken.ts)

新增个人信息区域：
- QQ 号输入框（暂不支持通知，仅记录）
- 微信 UID 输入框（WxPusher）
- Telegram ID 输入框

功能：
- 加载用户个人信息
- 更新个人信息
- 提供获取 UID/ID 的帮助链接

### 2. 系统设置页面 (HostAdmin.tsx + settings.ts)

新增通知服务配置区域：

#### Telegram Bot 配置
- Bot Token 输入框
- Bot ID 输入框
- 提供 @BotFather 创建 Bot 的链接

#### WxPusher 配置
- 应用 Token 输入框
- 应用 ID 输入框
- 提供 WxPusher 管理后台链接

### 3. 节点编辑界面 (NodeEdits.tsx)

新增节点下线通知选项：
- 下拉选择框，包含 4 个选项：
  - 不通知（默认）
  - 通知微信（WxPusher）
  - 通知邮箱
  - Telegram 通知
- 说明文字：节点超过 10 分钟未上报时发送通知，1 小时内最多通知一次

## 使用说明

### 管理员配置步骤

1. **配置 Telegram Bot（可选）**
   - 访问 [@BotFather](https://t.me/BotFather) 创建 Bot
   - 获取 Bot Token
   - 在系统设置中填入 Token 和 Bot ID

2. **配置 WxPusher（可选）**
   - 访问 [WxPusher 管理后台](https://wxpusher.zjiecode.com)
   - 创建应用，获取 App Token 和 App ID
   - 在系统设置中填入配置

3. **配置邮件服务（已有功能）**
   - 确保 Resend API 已配置

### 用户使用步骤

1. **设置联系方式**
   - 进入个人设置页面（/usertoken）
   - 根据需要填写：
     - QQ 号（仅记录）
     - 微信 UID：关注 WxPusher 公众号，发送"我的 UID"获取
     - Telegram ID：向 @userinfobot 发送消息获取

2. **配置节点通知**
   - 创建或编辑节点时
   - 在"节点首次下线通知"下拉框中选择通知方式
   - 保存节点

3. **接收通知**
   - 节点超过 10 分钟未上报时，系统自动发送通知
   - 1 小时内最多通知一次，避免频繁打扰

## 通知触发条件

1. 节点状态从 `online` 变为 `offline`（超过 10 分钟未上报）
2. 节点的 `offline_notify` 不为 0
3. 距离上次通知超过 1 小时（或首次通知）
4. 用户已配置相应的联系方式
5. 系统已配置相应的通知服务

## 通知内容示例

### 微信/Telegram 通知
```
【节点下线通知】

节点名称：北京节点1
节点地区：国内 - 北京
下线时间：2025-12-02 10:55:29

请及时检查节点状态。

查看详情：https://example.com/dashboard
```

### 邮件通知
包含完整的 HTML 格式，带有样式和链接按钮。

## 注意事项

1. **QQ 通知暂不支持**：QQ 号字段仅用于记录，暂无通知功能
2. **邮箱通知默认隐藏**：邮箱选项存在但对普通用户隐藏（选项值为 2）
3. **通知频率限制**：1 小时内最多通知一次，避免频繁打扰
4. **配置优先级**：如果用户选择了通知方式但未配置联系方式，或系统未配置通知服务，则不会发送通知
5. **定时任务**：通知功能依赖定时任务（每 10 分钟执行一次），需要确保 Cloudflare Workers 的 Cron Trigger 已配置

## 数据库迁移

执行 `database_migration.sql` 文件中的 SQL 命令，或手动执行以下步骤：

1. 为 users 表添加新字段
2. 为 nodes 表添加新字段
3. 为 confs 表插入新配置项

## 测试建议

1. **测试微信通知**：
   - 配置 WxPusher
   - 用户设置微信 UID
   - 创建测试节点并设置通知方式为"通知微信"
   - 停止节点上报，等待 10 分钟

2. **测试 Telegram 通知**：
   - 配置 Telegram Bot
   - 用户设置 Telegram ID
   - 创建测试节点并设置通知方式为"Telegram 通知"
   - 停止节点上报，等待 10 分钟

3. **测试邮件通知**：
   - 确保 Resend 已配置
   - 创建测试节点并设置通知方式为"通知邮箱"
   - 停止节点上报，等待 10 分钟

## 文件清单

### 修改的文件
- `src/types.ts` - 类型定义
- `src/routes/auth.ts` - 用户认证和个人信息 API
- `src/routes/system.ts` - 系统设置 API
- `src/routes/nodes.ts` - 节点管理 API
- `src/utils.ts` - 通知功能实现
- `src/index.tsx` - 定时任务和通知逻辑
- `src/components/UserToken.tsx` - 个人设置页面
- `src/components/HostAdmin.tsx` - 系统设置页面
- `src/components/NodeEdits.tsx` - 节点编辑表单
- `src/client/settings.ts` - 系统设置客户端脚本

### 新增的文件
- `database_migration.sql` - 数据库迁移 SQL
- `src/client/usertoken.ts` - 个人设置客户端脚本
- `IMPLEMENTATION_SUMMARY.md` - 本文档

## 后续优化建议

1. **QQ 通知支持**：集成 QQ 机器人 API 实现 QQ 通知
2. **通知模板**：支持自定义通知内容模板
3. **通知历史**：记录通知发送历史，方便用户查看
4. **批量通知**：支持批量节点下线时的聚合通知
5. **通知测试**：在个人设置页面添加"发送测试通知"按钮
6. **多种通知场景**：除了下线通知，还可以添加流量告警、带宽告警等

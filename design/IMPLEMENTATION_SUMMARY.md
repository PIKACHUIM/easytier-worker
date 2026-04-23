# 通知功能实现说明

## 功能概述

EasyTier 节点管理系统支持节点下线通知功能，当节点超过 10 分钟未上报时，系统可通过以下方式通知节点提供者：

- **微信通知**（通过 WxPusher）
- **邮件通知**（通过 Resend）
- **Telegram 通知**（通过 Telegram Bot API）

---

## 数据库变更

执行 `database_migration.sql` 完成以下变更（详见 [DATABASE_MIGRATION_README.md](./DATABASE_MIGRATION_README.md)）：

| 表 | 新增字段 | 说明 |
|----|----------|------|
| `users` | `qq_number` | QQ 号（仅记录） |
| `users` | `wechat_uid` | 微信 UID（WxPusher） |
| `users` | `telegram_id` | Telegram ID |
| `nodes` | `offline_notify` | 通知方式（0=不通知, 1=微信, 2=邮箱, 3=Telegram） |
| `nodes` | `last_offline_notify_at` | 最后一次通知时间 |
| `confs` | `telegram_bot_token` | Telegram Bot Token |
| `confs` | `telegram_bot_id` | Telegram Bot ID |
| `confs` | `wxpusher_app_token` | WxPusher 应用 Token |
| `confs` | `wxpusher_app_id` | WxPusher 应用 ID |

---

## 通知触发条件

1. 节点状态从 `online` 变为 `offline`（超过 10 分钟未上报）
2. 节点的 `offline_notify` 不为 0
3. 距离上次通知超过 1 小时（或首次通知）
4. 用户已配置相应的联系方式
5. 系统已配置相应的通知服务

---

## 通知内容示例

```
【节点下线通知】

节点名称：北京节点1
节点地区：国内 - 北京
下线时间：2025-12-02 10:55:29

请及时检查节点状态。

查看详情：https://example.com/dashboard
```

邮件通知包含完整的 HTML 格式，带有样式和链接按钮。

---

## 配置步骤

### 管理员配置

1. **配置 Telegram Bot（可选）**
   - 访问 [@BotFather](https://t.me/BotFather) 创建 Bot，获取 Token
   - 在系统设置中填入 Bot Token 和 Bot ID

2. **配置 WxPusher（可选）**
   - 访问 [WxPusher 管理后台](https://wxpusher.zjiecode.com) 创建应用
   - 在系统设置中填入 App Token 和 App ID

3. **配置邮件服务（已有功能）**
   - 确保 Resend API 已在系统设置中配置

### 用户配置

1. 进入个人设置页面（`/usertoken`）
2. 根据需要填写联系方式：
   - **微信 UID**：关注 WxPusher 公众号，发送"我的 UID"获取
   - **Telegram ID**：向 [@userinfobot](https://t.me/userinfobot) 发送消息获取
3. 创建或编辑节点时，在"节点首次下线通知"下拉框中选择通知方式

---

## 相关 API

### 获取/更新个人信息

- `GET /api/auth/me` — 获取用户联系方式信息
- `PUT /api/auth/profile` — 更新用户个人信息（QQ/微信/TG）

### 节点通知配置

- 创建节点 `POST /api/nodes/` 和更新节点 `PUT /api/nodes/{id}` 均支持 `offline_notify` 字段

---

## 注意事项

1. **QQ 通知暂不支持**：QQ 号字段仅用于记录，暂无通知功能
2. **通知频率限制**：1 小时内最多通知一次，避免频繁打扰
3. **依赖定时任务**：通知功能依赖每 10 分钟执行一次的定时任务，需确保 Cloudflare Workers Cron Trigger 已配置（详见 [CRON_TASK_README.md](./CRON_TASK_README.md)）
4. **配置优先级**：如果用户选择了通知方式但未配置联系方式，或系统未配置通知服务，则不会发送通知

---

## 后续优化建议

- **QQ 通知支持**：集成 QQ 机器人 API
- **通知模板**：支持自定义通知内容模板
- **通知历史**：记录通知发送历史
- **批量通知**：支持批量节点下线时的聚合通知
- **通知测试**：在个人设置页面添加"发送测试通知"按钮
- **更多通知场景**：流量告警、带宽告警等

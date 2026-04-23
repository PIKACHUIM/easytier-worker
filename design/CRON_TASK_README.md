# Cloudflare Workers 定时任务功能说明

## 功能概述

系统集成了 Cloudflare Workers 定时任务功能，每 10 分钟自动执行以下操作：

1. **节点状态检查**：将 10 分钟未上报的节点标记为离线，并触发下线通知
2. **统计数据更新**：统计当前在线节点数、总连接数、当前带宽使用量和阶梯带宽
3. **历史数据记录**：将统计数据保存到历史记录中，保留 24 小时（144 个数据点）

---

## 实现细节

### 定时任务函数

在 `src/index.tsx` 中实现了 `scheduled` 函数，这是 Cloudflare Workers 的标准定时任务处理函数：

```typescript
export async function scheduled(event: any, env: Env, ctx: any): Promise<void> {
  // 1. 检测超过 10 分钟未上报的在线节点，标记为离线
  // 2. 查询节点的通知配置和用户联系方式，发送下线通知
  // 3. 更新统计数据并记录历史
}
```

### 配置文件

在 `wrangler.jsonc` 中添加定时触发器配置：

```jsonc
{
  "triggers": {
    "crons": ["*/10 * * * *"]  // 每 10 分钟执行一次
  }
}
```

---

## 数据库配置

系统初始化时会自动在 `confs` 表中创建以下配置项：

```sql
-- 在线节点历史数据
INSERT INTO confs (setting_key, setting_value, description) VALUES
('stats_online_nodes_history', '[]', '在线节点历史数据，JSON数组，每10分钟一个数据点，保存24小时');

-- 连接数历史数据
INSERT INTO confs (setting_key, setting_value, description) VALUES
('stats_connections_history', '[]', '连接数历史数据，JSON数组，每10分钟一个数据点，保存24小时');

-- 带宽使用历史数据
INSERT INTO confs (setting_key, setting_value, description) VALUES
('stats_bandwidth_history', '[]', '带宽使用历史数据，JSON数组，每10分钟一个数据点，保存24小时');

-- 阶梯带宽历史数据
INSERT INTO confs (setting_key, setting_value, description) VALUES
('stats_tierband_history', '[]', '阶梯带宽历史数据，JSON数组，每10分钟一个数据点，保存24小时');

-- 统计数据最后更新时间
INSERT INTO confs (setting_key, setting_value, description) VALUES
('stats_last_update', '', '统计数据最后更新时间');
```

---

## 定时任务执行流程

### 1. 节点离线检查

```sql
UPDATE nodes 
SET status = 'offline', connection_count = 0, current_bandwidth = 0
WHERE status = 'online' AND last_report_at < ?
```

### 2. 下线通知发送

- 检测超过 10 分钟未上报的在线节点
- 查询节点的 `offline_notify` 配置和用户联系方式
- 根据配置发送相应通知（微信 / 邮箱 / Telegram）
- 记录通知时间，1 小时内最多通知一次

### 3. 统计数据收集

- 统计总节点数 / 在线节点数
- 汇总当前连接数
- 汇总当前带宽使用量
- 汇总阶梯带宽

### 4. 历史数据更新

- 保持最近 144 个数据点（24 小时）
- 每 10 分钟添加一个新的数据点
- 自动删除超过 24 小时的旧数据

---

## API 接口

### 手动触发定时任务

**POST** `/api/system/cron/update-stats`

**请求头**：
```
Authorization: Bearer {JWT_SECRET}
```

**响应示例**：
```json
{
  "message": "统计数据更新成功",
  "offline_nodes_updated": 2,
  "current_stats": {
    "total_nodes": 10,
    "online_nodes": 8,
    "connections": 156,
    "bandwidth": 245.5,
    "tierband": 500
  },
  "history_updated": true
}
```

### 获取统计数据

**GET** `/api/stats`

**响应示例**：
```json
{
  "total_nodes": 10,
  "online_nodes": 8,
  "connection_count_total": 156,
  "max_connections_total": 500,
  "current_bandwidth_total": 245.5,
  "max_bandwidth_total": 1000,
  "history": {
    "online_nodes": [
      {"value": 8, "timestamp": "2025-11-18T14:20:00.000Z"},
      {"value": 7, "timestamp": "2025-11-18T14:10:00.000Z"}
    ],
    "connections": [...],
    "bandwidth": [...],
    "tierband": [...]
  }
}
```

---

## 前端界面

首页统计卡片采用垂直布局：

- **左侧**：饼状图（上方）+ 数据文本（下方）
- **右侧**：24 小时趋势图（占满宽度）

---

## 部署步骤

### 1. 配置环境变量

```bash
JWT_SECRET=your-jwt-secret-here
ENABLE_EMAIL_VERIFICATION=false
```

### 2. 部署到 Cloudflare Workers

```bash
npm run build
wrangler deploy
```

### 3. 验证定时任务

部署后，定时任务会自动开始运行。可以：

1. 在 Cloudflare Workers 控制台查看日志
2. 使用手动触发 API 验证功能
3. 通过 `/api/stats` 接口查看统计数据

---

## 测试验证

### 手动调用 API

```bash
# 触发定时任务
curl -X POST "https://your-domain.workers.dev/api/system/cron/update-stats" \
  -H "Authorization: Bearer your-jwt-secret" \
  -H "Content-Type: application/json"

# 获取统计数据
curl "https://your-domain.workers.dev/api/stats"
```

### 使用测试脚本

```bash
cd examples
python test_system.py
```

### 查看日志

在 Cloudflare Workers 控制台中，应能看到类似日志：

```
[定时任务] 开始执行统计数据更新任务
[定时任务] 更新了 2 个离线节点
[定时任务] 统计数据更新完成: 在线节点=8, 连接数=156, 带宽=245.5Mbps, 阶梯带宽=500Mbps
```

---

## 故障排查

### 常见问题

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| 定时任务未执行 | crons 配置错误 / JWT_SECRET 未设置 | 检查 `wrangler.jsonc` 配置和环境变量 |
| 历史数据未更新 | 数据库连接失败 / confs 表配置缺失 | 检查数据库连接，验证 confs 表配置项 |
| 节点未正确标记离线 | last_report_at 字段异常 / 时区问题 | 检查节点上报时间字段和时区设置 |
| 前端图表不显示 | Chart.js 未加载 / API 数据格式错误 | 检查浏览器控制台错误信息 |

### 日志查看

```bash
# 实时日志
npx wrangler tail

# 格式化输出
npx wrangler tail --format=pretty
```

---

## 注意事项

1. **时区处理**：所有时间戳使用 UTC 时间
2. **数据保留**：历史数据只保留 24 小时（144 个数据点）
3. **离线判断**：节点 10 分钟未上报即被标记为离线
4. **通知频率**：1 小时内最多通知一次，避免频繁打扰
5. **性能优化**：使用数据库索引优化查询性能

---

## 扩展功能建议

- **告警功能**：当节点离线时发送通知（已实现，见通知功能说明）
- **数据导出**：支持导出历史统计数据
- **自定义统计周期**：支持不同的统计时间间隔
- **更多统计指标**：如流量使用情况、地区分布等
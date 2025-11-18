# Cloudflare Workers 定时任务功能说明

## 功能概述

本项目已成功集成了Cloudflare Workers定时任务功能，每10分钟自动执行以下操作：

1. **节点状态检查**：将10分钟未上报的节点标记为离线
2. **统计数据更新**：统计当前在线节点数、总连接数、当前带宽使用量和阶梯带宽
3. **历史数据记录**：将统计数据保存到历史记录中，保留24小时（144个数据点）

## 实现细节

### 1. 定时任务函数

在 `src/index.tsx` 中添加了 `scheduled` 函数，这是Cloudflare Workers的标准定时任务处理函数：

```typescript
export async function scheduled(event: any, env: Env, ctx: any): Promise<void> {
  // 定时任务逻辑
}
```

### 2. 配置文件

在 `wrangler.jsonc` 中添加了定时触发器配置：

```jsonc
{
  "triggers": {
    "crons": ["*/10 * * * *"]  // 每10分钟执行一次
  }
}
```

### 3. 数据库配置

系统初始化时会自动创建以下配置项：

- `stats_online_nodes_history`: 在线节点历史数据
- `stats_connections_history`: 连接数历史数据  
- `stats_bandwidth_history`: 带宽使用历史数据
- `stats_tierband_history`: 阶梯带宽历史数据
- `stats_last_update`: 统计数据最后更新时间

## 定时任务执行流程

### 1. 节点离线检查
```sql
UPDATE nodes 
SET status = 'offline', connection_count = 0, current_bandwidth = 0
WHERE status = 'online' AND last_report_at < ?
```

### 2. 统计数据收集
- 统计总节点数
- 统计在线节点数
- 汇总当前连接数
- 汇总当前带宽使用量
- 汇总阶梯带宽

### 3. 历史数据更新
- 保持最近144个数据点（24小时）
- 每10分钟添加一个新的数据点
- 自动删除超过24小时的旧数据

## 部署步骤

### 1. 配置环境变量

确保在Cloudflare Workers中设置了以下环境变量：

```bash
JWT_SECRET=your-jwt-secret-here
ENABLE_EMAIL_VERIFICATION=false
```

### 2. 部署到Cloudflare Workers

```bash
npm run build
wrangler deploy
```

### 3. 验证定时任务

部署后，定时任务会自动开始运行。你可以：

1. 在Cloudflare Workers控制台查看日志
2. 使用提供的测试脚本验证功能
3. 通过API接口查看统计数据

## 测试验证

### 1. 使用测试脚本

```bash
# 修改test_cron.js中的BASE_URL和JWT_SECRET
# 然后运行测试
node test_cron.js
```

### 2. 手动调用API

```bash
# 触发定时任务
curl -X POST "https://your-domain.workers.dev/api/system/cron/update-stats" \
  -H "Authorization: Bearer your-jwt-secret" \
  -H "Content-Type: application/json"

# 获取统计数据
curl "https://your-domain.workers.dev/api/stats"
```

### 3. 查看日志

在Cloudflare Workers控制台中，你应该能看到类似的日志：

```
[定时任务] 开始执行统计数据更新任务
[定时任务] 更新了 2 个离线节点
[定时任务] 统计数据更新完成: 在线节点=8, 连接数=156, 带宽=245.5Mbps, 阶梯带宽=500Mbps
```

## API接口

### 1. 定时任务接口

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

### 2. 获取统计数据接口

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

## 注意事项

1. **时区处理**：所有时间戳使用UTC时间
2. **数据保留**：历史数据只保留24小时（144个数据点）
3. **离线判断**：节点10分钟未上报即被标记为离线
4. **性能优化**：使用数据库索引优化查询性能
5. **错误处理**：包含完善的错误处理和日志记录

## 故障排查

### 常见问题

1. **定时任务未执行**
   - 检查wrangler.jsonc中的crons配置
   - 验证JWT_SECRET环境变量
   - 查看Cloudflare Workers日志

2. **历史数据未更新**
   - 检查数据库连接
   - 验证confs表中的配置项
   - 查看定时任务执行日志

3. **节点未正确标记为离线**
   - 检查节点的last_report_at字段
   - 验证时区设置
   - 确认定时任务正常执行

### 监控建议

1. 设置Cloudflare Workers的日志监控
2. 定期检查统计数据的准确性
3. 监控定时任务的执行频率和成功率

## 扩展功能

未来可以考虑添加：

1. **告警功能**：当节点离线时发送通知
2. **数据导出**：支持导出历史统计数据
3. **自定义统计周期**：支持不同的统计时间间隔
4. **更多统计指标**：如流量使用情况、地区分布等
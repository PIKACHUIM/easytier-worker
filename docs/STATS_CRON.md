# 统计数据定时任务配置

## 功能概述

系统新增了统计数据定时任务功能，每10分钟自动执行以下操作：

1. **节点状态检查**：将10分钟未上报的节点标记为离线
2. **统计数据更新**：更新在线节点数、总连接数、总带宽使用量的实时统计
3. **历史数据记录**：将当前统计数据记录到历史数据表中，保存24小时（144个数据点，每10分钟一个）

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

-- 统计数据最后更新时间
INSERT INTO confs (setting_key, setting_value, description) VALUES
('stats_last_update', '', '统计数据最后更新时间');
```

## API 接口

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
    "bandwidth": 245.5
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
      {"value": 8, "timestamp": "2025-11-18T13:20:00.000Z"},
      {"value": 7, "timestamp": "2025-11-18T13:10:00.000Z"},
      // ... 最多144个数据点
    ],
    "connections": [
      {"value": 156, "timestamp": "2025-11-18T13:20:00.000Z"},
      {"value": 142, "timestamp": "2025-11-18T13:10:00.000Z"},
      // ... 最多144个数据点
    ],
    "bandwidth": [
      {"value": 245.5, "timestamp": "2025-11-18T13:20:00.000Z"},
      {"value": 238.2, "timestamp": "2025-11-18T13:10:00.000Z"},
      // ... 最多144个数据点
    ]
  }
}
```

## 前端界面更新

首页统计卡片已重构为垂直布局：

1. **左侧**：饼状图（上方）+ 数据文本（下方）
2. **右侧**：24小时趋势图（占满宽度）

### 统计卡片结构

```tsx
<div class="stat-card-item">
  <div class="stat-card-content-vertical">
    <div class="stat-chart-top">
      <canvas id="nodes-chart" width="120" height="120"></canvas>
    </div>
    <div class="stat-info-bottom">
      <h3>在线节点</h3>
      <div class="stat-value" id="nodes-text">-/-</div>
    </div>
  </div>
  <div class="stat-trend-side">
    <canvas id="nodes-trend-chart" width="300" height="160"></canvas>
  </div>
</div>
```

## 部署配置

### 1. Cloudflare Workers Cron Triggers

在 `wrangler.jsonc` 中添加定时触发器：

```jsonc
{
  // ... 其他配置 ...
  "triggers": {
    "crons": ["*/10 * * * *"]  // 每10分钟执行一次
  }
}
```

### 2. 环境变量

确保设置了以下环境变量：

```bash
JWT_SECRET=your-jwt-secret-here
```

### 3. 手动触发

也可以使用测试脚本手动触发定时任务：

```bash
cd examples
python test_system.py
```

## 测试验证

系统提供了完整的测试功能：

1. **检查初始化状态**：验证数据库表和配置是否正确创建
2. **执行定时任务**：手动触发统计数据更新
3. **获取统计数据**：验证前端数据展示是否正常

## 注意事项

1. **数据保留期限**：历史数据只保留24小时（144个数据点）
2. **节点离线判断**：10分钟未上报的节点会被标记为离线
3. **性能优化**：使用索引优化查询性能
4. **错误处理**：完善的错误处理和日志记录

## 故障排查

### 常见问题

1. **定时任务未执行**
   - 检查 Cloudflare Workers Cron Triggers 配置
   - 验证 JWT_SECRET 环境变量设置
   - 查看 Workers 日志

2. **历史数据未更新**
   - 检查数据库连接
   - 验证 confs 表中的配置项是否存在
   - 查看定时任务执行日志

3. **前端图表不显示**
   - 检查 Chart.js 是否正确加载
   - 验证 API 响应数据格式
   - 查看浏览器控制台错误信息

### 日志查看

在 Cloudflare Workers 控制台查看日志：

```
[定时任务] 更新了 2 个离线节点
[定时任务] 统计数据更新完成: 在线节点=8, 连接数=156, 带宽=245.5Mbps
```
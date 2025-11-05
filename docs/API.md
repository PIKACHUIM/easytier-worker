# API 文档

## 基础信息

- **Base URL**: `https://your-domain.workers.dev`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## 认证 API

### 1. 用户注册

**POST** `/api/auth/register`

注册新用户账户。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "message": "注册成功，请查收验证邮件",
  "verification_token": "token_string"
}
```

**状态码**:
- `201`: 注册成功
- `400`: 请求参数错误
- `500`: 服务器错误

---

### 2. 用户登录

**POST** `/api/auth/login`

用户登录获取 JWT token。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "token": "jwt_token_string",
  "user": {
    "email": "user@example.com",
    "is_admin": false
  }
}
```

**状态码**:
- `200`: 登录成功
- `401`: 邮箱或密码错误
- `403`: 邮箱未验证
- `500`: 服务器错误

---

### 3. 验证邮箱

**GET** `/api/auth/verify?token={verification_token}`

验证用户邮箱。

**查询参数**:
- `token`: 验证令牌（从注册邮件中获取）

**响应**:
```json
{
  "message": "邮箱验证成功"
}
```

**状态码**:
- `200`: 验证成功
- `400`: 验证令牌无效
- `500`: 服务器错误

---

## 节点管理 API

所有节点管理 API 都需要在请求头中包含 JWT token：
```
Authorization: Bearer {your_jwt_token}
```

### 4. 获取我的节点列表

**GET** `/api/nodes/my`

获取当前用户的所有节点。

**响应**:
```json
{
  "nodes": [
    {
      "id": 1,
      "user_email": "user@example.com",
      "node_name": "节点1",
      "region_type": "domestic",
      "region_detail": "北京",
      "connections": [
        {
          "type": "TCP",
          "ip": "1.2.3.4",
          "port": 8080
        }
      ],
      "current_bandwidth": 50.5,
      "tier_bandwidth": 100,
      "max_bandwidth": 1000,
      "used_traffic": 50.2,
      "correction_traffic": 0,
      "max_traffic": 1000,
      "reset_cycle": 30,
      "reset_date": "2025-12-04T00:00:00.000Z",
      "connection_count": 5,
      "max_connections": 100,
      "tags": "高速,稳定",
      "created_at": "2025-11-04T12:00:00.000Z",
      "valid_until": "2026-11-04T12:00:00.000Z",
      "status": "online",
      "recent_status": "2222333...",
      "notes": "测试节点",
      "allow_relay": 1,
      "last_report_at": "2025-11-04T12:30:00.000Z"
    }
  ]
}
```

**状态码**:
- `200`: 成功
- `401`: 未授权
- `500`: 服务器错误

---

### 5. 获取所有节点（管理员）

**GET** `/api/nodes/all`

获取系统中的所有节点（仅管理员）。

**响应**: 同上

**状态码**:
- `200`: 成功
- `401`: 未授权
- `403`: 需要管理员权限
- `500`: 服务器错误

---

### 6. 获取单个节点详情

**GET** `/api/nodes/{id}`

获取指定节点的详细信息。

**路径参数**:
- `id`: 节点 ID

**响应**:
```json
{
  "node": {
    "id": 1,
    "user_email": "user@example.com",
    "node_name": "节点1",
    ...
  }
}
```

**状态码**:
- `200`: 成功
- `401`: 未授权
- `403`: 无权访问此节点
- `404`: 节点不存在
- `500`: 服务器错误

---

### 7. 创建节点

**POST** `/api/nodes/`

创建新节点。

**请求体**:
```json
{
  "node_name": "节点1",
  "region_type": "domestic",
  "region_detail": "北京",
  "connections": [
    {
      "type": "TCP",
      "ip": "1.2.3.4",
      "port": 8080
    },
    {
      "type": "WS",
      "ip": "1.2.3.4",
      "port": 8081
    }
  ],
  "tier_bandwidth": 100,
  "max_bandwidth": 1000,
  "max_traffic": 1000,
  "reset_cycle": 30,
  "max_connections": 100,
  "tags": "高速,稳定",
  "valid_until": "2026-11-04",
  "notes": "测试节点",
  "allow_relay": 1
}
```

**响应**:
```json
{
  "message": "节点创建成功",
  "node_id": 1
}
```

**状态码**:
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `500`: 服务器错误

---

### 8. 更新节点

**PUT** `/api/nodes/{id}`

更新节点信息。

**路径参数**:
- `id`: 节点 ID

**请求体**: 同创建节点，所有字段都是可选的

**响应**:
```json
{
  "message": "节点更新成功"
}
```

**状态码**:
- `200`: 更新成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 无权修改此节点
- `404`: 节点不存在
- `500`: 服务器错误

---

### 9. 删除节点

**DELETE** `/api/nodes/{id}`

删除节点。

**路径参数**:
- `id`: 节点 ID

**响应**:
```json
{
  "message": "节点删除成功"
}
```

**状态码**:
- `200`: 删除成功
- `401`: 未授权
- `403`: 无权删除此节点
- `404`: 节点不存在
- `500`: 服务器错误

---

### 9.1 重新生成节点Token

**POST** `/api/nodes/{id}/regenerate-token`

重新生成节点的上报验证Token。旧Token将立即失效。

**路径参数**:
- `id`: 节点 ID

**响应**:
```json
{
  "message": "Token重新生成成功",
  "token": "new-token-string"
}
```

**状态码**:
- `200`: 重新生成成功
- `401`: 未授权
- `403`: 无权修改此节点
- `404`: 节点不存在
- `500`: 服务器错误

**注意事项**:
1. 重新生成Token后，旧Token将立即失效
2. 需要更新节点上报脚本中的Token配置
3. 只有节点所有者或管理员可以重新生成Token

---

## 公开 API

以下 API 不需要认证。

### 10. 节点上报

**POST** `/api/report`

节点上报当前状态。

**请求体**:
```json
{
  "node_name": "my-node",
  "email": "user@example.com",
  "token": "your-report-token",
  "current_bandwidth": 50.5,
  "reported_traffic": 0.5,
  "connection_count": 5,
  "status": "online"
}
```

**字段说明**:
- `node_name`: 节点名称（必填）
- `email`: 用户邮箱（必填）
- `token`: 节点上报验证Token（必填，从节点管理页面获取）
- `current_bandwidth`: 当前带宽（Mbps）
- `reported_traffic`: 本次上报的流量增量（GB）
- `connection_count`: 当前连接数
- `status`: 当前状态（online/offline）

**响应**:
```json
{
  "message": "上报成功",
  "used_traffic": 50.7,
  "max_traffic": 1000,
  "reset_date": "2025-12-04T00:00:00.000Z"
}
```

**状态码**:
- `200`: 上报成功
- `400`: 请求参数错误
- `403`: Token验证失败或节点已过期
- `404`: 节点不存在
- `500`: 服务器错误

**注意事项**:
1. 每个节点都有唯一的上报Token，可在节点管理页面查看和重新生成
2. Token验证失败时，请检查节点名称、邮箱和Token是否正确
3. 建议使用提供的示例脚本进行上报：`examples/node_report_v2.py`

---

### 11. 查询节点

**POST** `/api/query`

客户端查询可用节点（智能负载均衡）。

**请求体**:
```json
{
  "region": "domestic",
  "priority": "traffic",
  "relay_only": false
}
```

**字段说明**:
- `region`: 地域筛选（domestic/overseas/all），可选
- `priority`: 优先级（traffic/bandwidth/latency），可选
  - `traffic`: 流量优先，返回人均日流量最高的节点
  - `bandwidth`: 带宽优先，返回人均带宽最高的节点
  - `latency`: 延迟优先，返回连接数最少的节点
- `relay_only`: 是否只返回支持中转的节点，可选

**响应**:
```json
{
  "nodes": [
    {
      "id": 1,
      "node_name": "节点1",
      "region_type": "domestic",
      "region_detail": "北京",
      "connections": [
        {
          "type": "TCP",
          "ip": "1.2.3.4",
          "port": 8080
        }
      ],
      "current_bandwidth": 50.5,
      "tier_bandwidth": 100,
      "connection_count": 5,
      "max_connections": 100,
      "used_traffic": 50.2,
      "max_traffic": 1000,
      "tags": "高速,稳定",
      "allow_relay": 1
    }
  ]
}
```

**说明**: 返回最多 10 个节点，按优先级排序

**状态码**:
- `200`: 查询成功
- `500`: 服务器错误

---

### 12. 获取公开节点列表

**GET** `/api/public`

获取所有在线的公开节点列表。

**响应**:
```json
{
  "nodes": [
    {
      "id": 1,
      "node_name": "节点1",
      "region_type": "domestic",
      "region_detail": "北京",
      "current_bandwidth": 50.5,
      "tier_bandwidth": 100,
      "max_bandwidth": 1000,
      "used_traffic": 50.2,
      "max_traffic": 1000,
      "connection_count": 5,
      "max_connections": 100,
      "tags": "高速,稳定",
      "status": "online",
      "recent_status": "2222333...",
      "allow_relay": 1,
      "reset_date": "2025-12-04T00:00:00.000Z"
    }
  ]
}
```

**状态码**:
- `200`: 成功
- `500`: 服务器错误

---

### 13. 获取统计信息

**GET** `/api/stats`

获取系统统计信息。

**响应**:
```json
{
  "total_nodes": 100,
  "online_nodes": 80,
  "domestic_nodes": 60,
  "overseas_nodes": 40,
  "total_bandwidth": 10000.5
}
```

**字段说明**:
- `total_nodes`: 总节点数
- `online_nodes`: 在线节点数
- `domestic_nodes`: 国内节点数
- `overseas_nodes`: 海外节点数
- `total_bandwidth`: 总带宽（Mbps）

**状态码**:
- `200`: 成功
- `500`: 服务器错误

---

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "error": "错误描述信息"
}
```

## 负载均衡算法说明

### 流量优先（traffic）

计算每个节点的人均日流量：

```
人均日流量 = (最大流量 - 已用流量) / 剩余天数 / 当前连接数
```

返回人均日流量最高的节点。

### 带宽优先（bandwidth）

计算每个节点的人均带宽：

```
人均带宽 = 当前阶梯带宽 / 当前连接数
```

返回人均带宽最高的节点。

### 延迟优先（latency）

简化实现，返回连接数最少的节点（实际应该根据客户端 IP 计算物理距离）。

## 近期状态（recent_status）说明

`recent_status` 字段记录节点最近 30 天内每 10 分钟的负荷情况，使用单个字符表示：

- `0`: 未知
- `1`: 离线
- `2-9`: 在线，数字越大表示负荷越高

负荷计算公式：
```
负荷 = min(9, max(2, ceil(带宽负荷 + 流量负荷 + 连接数负荷)))

其中：
- 带宽负荷 = (当前带宽 / 阶梯带宽) * 3
- 流量负荷 = (已用流量 / 最大流量) * 3
- 连接数负荷 = (当前连接数 / 最大连接数) * 3
```

## 使用示例

### 示例 1: 用户注册和登录

```bash
# 1. 注册
curl -X POST https://your-domain.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. 验证邮箱（使用邮件中的 token）
curl https://your-domain.workers.dev/api/auth/verify?token=verification_token

# 3. 登录
curl -X POST https://your-domain.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### 示例 2: 创建和管理节点

```bash
# 1. 创建节点
curl -X POST https://your-domain.workers.dev/api/nodes/ \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "node_name": "测试节点",
    "region_type": "domestic",
    "region_detail": "北京",
    "connections": [{"type":"TCP","ip":"1.2.3.4","port":8080}],
    "tier_bandwidth": 100,
    "max_bandwidth": 1000,
    "max_traffic": 1000,
    "reset_cycle": 30,
    "max_connections": 100,
    "valid_until": "2026-11-04",
    "allow_relay": 1
  }'

# 2. 获取我的节点
curl https://your-domain.workers.dev/api/nodes/my \
  -H "Authorization: Bearer your_jwt_token"

# 3. 更新节点
curl -X PUT https://your-domain.workers.dev/api/nodes/1 \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"tier_bandwidth": 200}'

# 4. 删除节点
curl -X DELETE https://your-domain.workers.dev/api/nodes/1 \
  -H "Authorization: Bearer your_jwt_token"
```

### 示例 3: 节点上报

```bash
# 使用节点名称、邮箱和Token进行上报
curl -X POST https://your-domain.workers.dev/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "node_name": "my-node",
    "email": "user@example.com",
    "token": "your-report-token-here",
    "current_bandwidth": 50.5,
    "reported_traffic": 0.5,
    "connection_count": 5,
    "status": "online"
  }'
```

### 示例 4: 客户端查询节点

```bash
# 查询国内流量优先的节点
curl -X POST https://your-domain.workers.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "region": "domestic",
    "priority": "traffic",
    "relay_only": false
  }'

# 查询所有支持中转的节点，带宽优先
curl -X POST https://your-domain.workers.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "region": "all",
    "priority": "bandwidth",
    "relay_only": true
  }'
```

---

## 系统管理 API

### 1. 检查系统初始化状态

**GET** `/api/system/check-init`

检查系统是否已初始化。

**响应**:
```json
{
  "initialized": true
}
```

**状态码**:
- `200`: 成功

---

### 2. 初始化系统

**POST** `/api/system/initialize`

使用 JWT 密钥验证并初始化系统。此接口会自动完成以下操作：
1. 导入数据库表结构（users、nodes、system_settings）
2. 创建超级管理员账户
3. 完成系统初始化配置

**请求体**:
```json
{
  "jwt_secret": "your-jwt-secret",
  "email": "admin@example.com",
  "password": "admin123456"
}
```

**响应**:
```json
{
  "message": "系统初始化成功",
  "admin_email": "admin@example.com"
}
```

**状态码**:
- `201`: 初始化成功
- `400`: 系统已初始化或参数错误
- `401`: JWT 密钥验证失败
- `500`: 服务器错误

**注意事项**:
1. 系统初始化只能执行一次
2. 初始化检测基于 `system_settings` 表是否存在
3. 如果数据库未初始化，访问其他页面会自动跳转到初始化页面
4. 初始化完成后会自动跳转到登录页面

---

### 3. 获取系统设置

**GET** `/api/system/settings`

获取系统设置（需要管理员权限）。

**请求头**:
```
Authorization: Bearer {your_jwt_token}
```

**响应**:
```json
{
  "resend_api_key": "re_xxx",
  "resend_from_email": "noreply@example.com",
  "resend_from_domain": "example.com",
  "site_name": "EasyTier 节点管理系统",
  "site_url": "https://example.com"
}
```

**状态码**:
- `200`: 成功
- `401`: 未授权
- `403`: 需要管理员权限
- `500`: 服务器错误

---

### 4. 更新系统设置

**PUT** `/api/system/settings`

更新系统设置（需要管理员权限）。

**请求头**:
```
Authorization: Bearer {your_jwt_token}
```

**请求体**:
```json
{
  "resend_api_key": "re_xxx",
  "resend_from_email": "noreply@example.com",
  "resend_from_domain": "example.com",
  "site_name": "EasyTier 节点管理系统",
  "site_url": "https://example.com"
}
```

**响应**:
```json
{
  "message": "系统设置更新成功"
}
```

**状态码**:
- `200`: 成功
- `401`: 未授权
- `403`: 需要管理员权限
- `500`: 服务器错误

---

### 5. 获取用户列表

**GET** `/api/system/users`

获取所有用户列表（需要管理员权限）。

**请求头**:
```
Authorization: Bearer {your_jwt_token}
```

**响应**:
```json
[
  {
    "id": 1,
    "email": "admin@example.com",
    "is_admin": 1,
    "is_super_admin": 1,
    "is_verified": 1,
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "email": "user@example.com",
    "is_admin": 0,
    "is_super_admin": 0,
    "is_verified": 1,
    "created_at": "2025-01-02T00:00:00.000Z"
  }
]
```

**状态码**:
- `200`: 成功
- `401`: 未授权
- `403`: 需要管理员权限
- `500`: 服务器错误

---

### 6. 设置用户管理员权限

**PUT** `/api/system/users/{email}/admin`

授予或撤销用户的管理员权限（需要超级管理员权限）。

**请求头**:
```
Authorization: Bearer {your_jwt_token}
```

**路径参数**:
- `email`: 用户邮箱

**请求体**:
```json
{
  "is_admin": true
}
```

**响应**:
```json
{
  "message": "已授予用户 user@example.com 的管理员权限"
}
```

**状态码**:
- `200`: 成功
- `401`: 未授权
- `403`: 需要超级管理员权限
- `404`: 用户不存在
- `500`: 服务器错误

---

### 7. 删除用户

**DELETE** `/api/system/users/{email}`

删除用户及其所有节点（需要超级管理员权限）。

**请求头**:
```
Authorization: Bearer {your_jwt_token}
```

**路径参数**:
- `email`: 用户邮箱

**响应**:
```json
{
  "message": "用户 user@example.com 已删除"
}
```

**状态码**:
- `200`: 成功
- `401`: 未授权
- `403`: 需要超级管理员权限或不能删除超级管理员
- `404`: 用户不存在
- `500`: 服务器错误

---

## 注意事项

1. 所有时间字段都使用 ISO 8601 格式（UTC 时区）
2. JWT token 需要在每次请求时包含在 Authorization 头中
3. 流量单位统一使用 GB，带宽单位统一使用 Mbps
4. 节点上报建议间隔：10 分钟
5. 客户端查询建议缓存：5 分钟
6. 系统初始化只能执行一次
7. 超级管理员无法被删除或降权
8. JWT 密钥请妥善保管，不要泄露

# 示例脚本使用说明

本目录包含了 EasyTier 节点管理系统的示例脚本。

## 文件列表

- `node_reporter.py`: 节点上报脚本
- `client_query.py`: 客户端查询脚本
- `test_system.py`: 系统功能测试脚本（新增）

## 节点上报脚本

### 安装依赖

```bash
pip install requests psutil
```

### 使用方法

#### 单次上报

```bash
python3 node_reporter.py \
  --node-id 1 \
  --api-url https://your-domain.workers.dev
```

#### 定期上报（每 10 分钟）

```bash
python3 node_reporter.py \
  --node-id 1 \
  --api-url https://your-domain.workers.dev \
  --interval 600
```

### 使用 Cron 定期执行

编辑 crontab：

```bash
crontab -e
```

添加以下行（每 10 分钟执行一次）：

```cron
*/10 * * * * /usr/bin/python3 /path/to/node_reporter.py --node-id 1 --api-url https://your-domain.workers.dev
```

### 使用 Systemd Timer

创建服务文件 `/etc/systemd/system/easytier-reporter.service`：

```ini
[Unit]
Description=EasyTier Node Reporter
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /path/to/node_reporter.py --node-id 1 --api-url https://your-domain.workers.dev
User=nobody
Group=nogroup

[Install]
WantedBy=multi-user.target
```

创建定时器文件 `/etc/systemd/system/easytier-reporter.timer`：

```ini
[Unit]
Description=EasyTier Node Reporter Timer
Requires=easytier-reporter.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=10min
Unit=easytier-reporter.service

[Install]
WantedBy=timers.target
```

启用并启动定时器：

```bash
sudo systemctl daemon-reload
sudo systemctl enable easytier-reporter.timer
sudo systemctl start easytier-reporter.timer

# 查看状态
sudo systemctl status easytier-reporter.timer
sudo systemctl list-timers
```

## 客户端查询脚本

### 安装依赖

```bash
pip install requests
```

### 使用方法

#### 查询可用节点

```bash
# 查询国内流量优先的节点
python3 client_query.py \
  --api-url https://your-domain.workers.dev \
  query --region domestic --priority traffic

# 查询海外带宽优先的节点
python3 client_query.py \
  --api-url https://your-domain.workers.dev \
  query --region overseas --priority bandwidth

# 查询所有支持中转的节点
python3 client_query.py \
  --api-url https://your-domain.workers.dev \
  query --region all --relay-only
```

#### 获取所有公开节点

```bash
python3 client_query.py \
  --api-url https://your-domain.workers.dev \
  public
```

#### 获取统计信息

```bash
python3 client_query.py \
  --api-url https://your-domain.workers.dev \
  stats
```

## 集成到您的应用

### Python 示例

```python
import requests

# 查询节点
response = requests.post(
    'https://your-domain.workers.dev/api/query',
    json={
        'region': 'domestic',
        'priority': 'traffic',
        'relay_only': False
    }
)
nodes = response.json()['nodes']

# 选择第一个节点
if nodes:
    node = nodes[0]
    print(f"连接到节点: {node['node_name']}")
    
    # 使用节点的连接信息
    for conn in node['connections']:
        print(f"  {conn['type']}: {conn['ip']}:{conn['port']}")
```

### Shell 脚本示例

```bash
#!/bin/bash

API_URL="https://your-domain.workers.dev"

# 查询节点
response=$(curl -s -X POST "$API_URL/api/query" \
  -H "Content-Type: application/json" \
  -d '{"region":"domestic","priority":"traffic"}')

# 解析 JSON（需要 jq）
node_name=$(echo "$response" | jq -r '.nodes[0].node_name')
node_ip=$(echo "$response" | jq -r '.nodes[0].connections[0].ip')
node_port=$(echo "$response" | jq -r '.nodes[0].connections[0].port')

echo "连接到节点: $node_name"
echo "地址: $node_ip:$node_port"
```

### JavaScript/Node.js 示例

```javascript
const fetch = require('node-fetch');

async function queryNodes() {
  const response = await fetch('https://your-domain.workers.dev/api/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      region: 'domestic',
      priority: 'traffic',
      relay_only: false,
    }),
  });
  
  const data = await response.json();
  const nodes = data.nodes;
  
  if (nodes.length > 0) {
    const node = nodes[0];
    console.log(`连接到节点: ${node.node_name}`);
    
    node.connections.forEach(conn => {
      console.log(`  ${conn.type}: ${conn.ip}:${conn.port}`);
    });
  }
}

queryNodes();
```

## 注意事项

1. **节点 ID**: 在使用上报脚本前，需要先在管理系统中创建节点，获取节点 ID
2. **API URL**: 替换为您实际部署的 API 地址
3. **上报频率**: 建议每 10 分钟上报一次，不要过于频繁
4. **错误处理**: 生产环境中应添加更完善的错误处理和日志记录
5. **安全性**: 如果需要，可以为上报 API 添加认证机制

## 自定义开发

您可以基于这些示例脚本进行自定义开发：

1. **添加更多监控指标**: CPU、内存、磁盘使用率等
2. **自定义负载计算**: 根据实际业务需求调整负载计算方式
3. **添加告警功能**: 当节点异常时发送通知
4. **集成到现有系统**: 将查询功能集成到您的应用中

## 故障排除

### 上报失败

1. 检查节点 ID 是否正确
2. 检查 API URL 是否可访问
3. 检查网络连接
4. 查看错误日志

### 查询无结果

1. 确认有在线节点
2. 检查查询条件是否过于严格
3. 使用 `public` 命令查看所有公开节点

## 系统功能测试脚本

### 安装依赖

```bash
pip install requests
```

### 使用方法

测试脚本用于验证系统初始化和管理功能是否正常工作。

#### 配置脚本

编辑 `test_system.py`，修改以下配置：

```python
API_URL = "http://localhost:8787"  # 本地开发环境
# API_URL = "https://your-domain.workers.dev"  # 生产环境

JWT_SECRET = "your-jwt-secret-here"  # 从 wrangler.jsonc 获取
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123456"
```

#### 运行测试

```bash
python3 test_system.py
```

#### 测试内容

脚本会自动测试以下功能：

1. ✅ 检查系统初始化状态
2. ✅ 系统初始化（如果未初始化）
3. ✅ 超级管理员登录
4. ✅ 获取系统设置
5. ✅ 更新系统设置
6. ✅ 获取用户列表
7. ✅ 注册普通用户
8. ✅ 授予管理员权限
9. ✅ 撤销管理员权限

#### 预期输出

```
============================================================
EasyTier 系统初始化和管理功能测试
============================================================
1. 测试检查初始化状态...
   状态码: 200
   响应: {'initialized': False}

2. 测试系统初始化...
   状态码: 201
   响应: {'message': '系统初始化成功', 'admin_email': 'admin@example.com'}

✓ 初始化成功

3. 测试登录...
   状态码: 200
   ✓ 登录成功
   ✓ 邮箱: admin@example.com
   ✓ 管理员: True
   ✓ 超级管理员: True

...

============================================================
✅ 所有测试通过！
============================================================
```

## 贡献

欢迎提交改进建议和 Pull Request！

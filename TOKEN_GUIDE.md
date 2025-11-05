# 节点上报Token快速参考

## 🔑 什么是上报Token？

上报Token是每个节点的唯一验证密钥，用于确保只有授权的节点才能上报数据到系统。

## 📍 在哪里找到Token？

1. 登录系统
2. 进入"我的节点"页面
3. 在节点卡片中找到"上报Token"区域
4. Token显示为32位十六进制字符串

## 📋 如何使用Token？

### Python脚本示例

```python
import requests

# 配置信息
API_URL = "https://your-domain.workers.dev/api/report"
NODE_NAME = "my-node"
USER_EMAIL = "user@example.com"
REPORT_TOKEN = "your-token-here"

# 上报数据
data = {
    "node_name": NODE_NAME,
    "email": USER_EMAIL,
    "token": REPORT_TOKEN,
    "current_bandwidth": 50.5,
    "reported_traffic": 0.5,
    "connection_count": 5,
    "status": "online"
}

response = requests.post(API_URL, json=data)
print(response.json())
```

### Curl示例

```bash
curl -X POST https://your-domain.workers.dev/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "node_name": "my-node",
    "email": "user@example.com",
    "token": "your-token-here",
    "current_bandwidth": 50.5,
    "reported_traffic": 0.5,
    "connection_count": 5,
    "status": "online"
  }'
```

## 🔄 如何重新生成Token？

1. 进入"我的节点"页面
2. 找到需要重新生成Token的节点
3. 点击"重新生成"按钮
4. 确认操作
5. 复制新Token并更新上报脚本

⚠️ **注意**: 重新生成后，旧Token立即失效！

## 📄 如何复制Token？

### 方法一：使用复制按钮
1. 点击Token旁边的"复制"按钮
2. Token自动复制到剪贴板

### 方法二：手动复制
1. 选中Token文本
2. 右键 → 复制
3. 或使用快捷键 Ctrl+C (Windows/Linux) 或 Cmd+C (Mac)

## ❌ 常见错误

### 错误1: Token验证失败

```json
{
  "error": "Token验证失败"
}
```

**原因**:
- Token不正确
- Token已被重新生成
- 节点名称或邮箱不匹配

**解决方法**:
1. 检查Token是否正确复制
2. 确认节点名称和邮箱是否正确
3. 尝试重新生成Token

### 错误2: 节点不存在

```json
{
  "error": "节点不存在"
}
```

**原因**:
- 节点名称拼写错误
- 邮箱地址错误
- 节点已被删除

**解决方法**:
1. 检查节点名称是否正确
2. 确认邮箱地址是否正确
3. 登录系统确认节点是否存在

### 错误3: 缺少必填字段

```json
{
  "error": "缺少必填字段"
}
```

**原因**:
- 请求数据不完整

**解决方法**:
确保包含所有必填字段：
- `node_name` (节点名称)
- `email` (用户邮箱)
- `token` (上报Token)
- `current_bandwidth` (当前带宽)
- `reported_traffic` (上报流量)
- `connection_count` (连接数)
- `status` (状态)

## 🔒 安全建议

### ✅ 应该做的
- ✅ 妥善保管Token，不要泄露
- ✅ 使用HTTPS进行上报
- ✅ 定期检查上报日志
- ✅ 怀疑泄露时立即重新生成

### ❌ 不应该做的
- ❌ 不要在公开场合分享Token
- ❌ 不要将Token提交到代码仓库
- ❌ 不要在不安全的网络环境下传输Token
- ❌ 不要使用HTTP（明文）上报

## 📊 Token格式

- **长度**: 32个字符
- **字符集**: 0-9, a-f (十六进制)
- **示例**: `a1b2c3d4e5f6789012345678901234ab`
- **生成方式**: 加密安全的随机数生成器

## 🔧 高级用法

### 环境变量配置

```bash
# Linux/Mac
export EASYTIER_NODE_NAME="my-node"
export EASYTIER_EMAIL="user@example.com"
export EASYTIER_TOKEN="your-token-here"

# Windows
set EASYTIER_NODE_NAME=my-node
set EASYTIER_EMAIL=user@example.com
set EASYTIER_TOKEN=your-token-here
```

### 配置文件

```ini
# config.ini
[easytier]
node_name = my-node
email = user@example.com
token = your-token-here
api_url = https://your-domain.workers.dev/api/report
```

### Systemd服务

```ini
# /etc/systemd/system/easytier-reporter.service
[Unit]
Description=EasyTier Node Reporter
After=network.target

[Service]
Type=simple
User=easytier
Environment="NODE_NAME=my-node"
Environment="EMAIL=user@example.com"
Environment="TOKEN=your-token-here"
ExecStart=/usr/bin/python3 /opt/easytier/node_report_v2.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## 📚 相关文档

- [API文档](./API.md) - 完整的API说明
- [更新说明](./UPDATE_v1.0.2.md) - v1.0.2版本详情
- [升级指南](./UPGRADE_v1.0.2.md) - 如何从旧版本升级
- [示例脚本](./examples/node_report_v2.py) - Python上报脚本

## 💡 提示

- 💾 建议将Token保存在安全的密码管理器中
- 🔄 定期检查节点上报状态
- 📝 记录Token重新生成的时间和原因
- 🚨 发现异常上报立即重新生成Token

## 📞 获取帮助

如有问题，请：
- 📖 查看[完整文档](./README.md)
- 🐛 提交Issue
- 📧 联系管理员

---

**版本**: v1.0.2  
**更新时间**: 2025-01-04

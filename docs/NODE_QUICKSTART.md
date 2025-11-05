# 节点管理快速开始

本指南将帮助您快速上手使用EasyTier节点管理系统的节点管理功能。

## 前提条件

- 已完成系统初始化
- 已注册并登录账户

## 5分钟快速上手

### 1. 添加第一个节点（2分钟）

1. 登录系统后，点击导航栏的"我的节点"
2. 点击页面顶部的蓝色"添加节点"按钮
3. 填写基本信息：
   ```
   节点名称：测试节点1
   地域类型：大陆
   具体地区：北京
   ```

4. 添加连接方式（点击"+ 添加连接"）：
   ```
   协议：TCP
   IP：192.168.1.100
   端口：8080
   ```

5. 设置带宽和流量：
   ```
   阶梯带宽：100 Mbps
   最大带宽：1000 Mbps
   最大流量：1000 GB
   重置周期：30 天
   最大连接数：100
   ```

6. 选择有效期（建议选择未来一年的日期）

7. 点击"保存节点"按钮

✅ 完成！您的第一个节点已创建成功。

### 2. 查看节点详情（1分钟）

1. 在节点列表中找到刚创建的节点
2. 点击"查看详情"按钮
3. 您将看到：
   - 📋 完整的节点信息
   - 🔗 所有连接方式
   - 📊 带宽和流量统计
   - 🔑 上报Token

4. 点击"复制Token"按钮，保存Token用于后续节点上报

### 3. 编辑节点（1分钟）

1. 点击节点卡片上的"编辑"按钮
2. 修改任何需要更改的信息，例如：
   - 增加最大流量配额
   - 添加新的连接方式
   - 修改标签或备注
3. 点击"保存节点"完成修改

### 4. 使用Token上报数据（1分钟）

使用您复制的Token，通过API上报节点数据：

```bash
curl -X POST https://your-domain.com/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "node_name": "测试节点1",
    "email": "your-email@example.com",
    "token": "your-token-here",
    "current_bandwidth": 50.5,
    "reported_traffic": 10.2,
    "connection_count": 25,
    "status": "online"
  }'
```

## 常用操作

### 添加多个连接方式

节点可以配置多种连接方式，提高可用性：

1. 在添加/编辑节点时，点击"+ 添加连接"
2. 为每个连接选择不同的协议：
   - TCP：适用于稳定连接
   - UDP：适用于低延迟场景
   - WS/WSS：适用于Web环境
   - WG：适用于WireGuard

示例配置：
```
连接1：TCP - 192.168.1.100:8080
连接2：UDP - 192.168.1.100:8081
连接3：WSS - example.com:443
```

### 管理Token

#### 查看Token
1. 点击"查看详情"
2. 在"上报Token"部分查看完整Token
3. 点击"复制Token"一键复制

#### 重新生成Token
如果Token泄露或需要更换：
1. 在详情页面点击"重新生成Token"
2. 确认操作
3. 复制新Token
4. ⚠️ 注意：旧Token将立即失效

### 监控节点状态

在节点列表中可以实时查看：
- 🟢 在线/🔴 离线状态
- 当前带宽使用情况
- 流量使用进度
- 连接数统计

## 实用技巧

### 1. 使用标签分类节点

为节点添加标签，便于管理：
```
标签示例：
- "高速"、"稳定"
- "测试"、"生产"
- "北京"、"上海"
```

### 2. 添加详细备注

在备注中记录重要信息：
```
备注示例：
- 服务器配置：8核16G
- 运营商：电信
- 用途：主要用于测试环境
- 联系人：张三 (13800138000)
```

### 3. 合理设置流量配额

根据实际需求设置流量：
- 测试节点：100-500 GB
- 小型节点：500-1000 GB
- 中型节点：1000-5000 GB
- 大型节点：5000+ GB

### 4. 定期检查节点状态

建议每天检查：
- 节点在线状态
- 流量使用情况
- 带宽使用情况
- 连接数统计

## 节点上报集成

### Python示例

```python
import requests
import json

def report_node_status(node_name, email, token):
    url = "https://your-domain.com/api/report"
    data = {
        "node_name": node_name,
        "email": email,
        "token": token,
        "current_bandwidth": 50.5,
        "reported_traffic": 10.2,
        "connection_count": 25,
        "status": "online"
    }
    
    response = requests.post(url, json=data)
    return response.json()

# 使用示例
result = report_node_status(
    "测试节点1",
    "user@example.com",
    "your-token-here"
)
print(result)
```

### Shell脚本示例

```bash
#!/bin/bash

NODE_NAME="测试节点1"
EMAIL="user@example.com"
TOKEN="your-token-here"
API_URL="https://your-domain.com/api/report"

# 获取当前带宽（示例）
BANDWIDTH=$(echo "50.5")

# 获取流量增量（示例）
TRAFFIC=$(echo "10.2")

# 获取连接数（示例）
CONNECTIONS=$(echo "25")

# 上报数据
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"node_name\": \"$NODE_NAME\",
    \"email\": \"$EMAIL\",
    \"token\": \"$TOKEN\",
    \"current_bandwidth\": $BANDWIDTH,
    \"reported_traffic\": $TRAFFIC,
    \"connection_count\": $CONNECTIONS,
    \"status\": \"online\"
  }"
```

### 定时上报（Crontab）

```bash
# 每10分钟上报一次
*/10 * * * * /path/to/report-script.sh

# 每小时上报一次
0 * * * * /path/to/report-script.sh
```

## 故障排查

### 问题1：节点显示离线

**可能原因：**
- 节点未上报数据
- Token错误
- 网络问题

**解决方法：**
1. 检查上报脚本是否正常运行
2. 验证Token是否正确
3. 检查网络连接
4. 查看API响应错误信息

### 问题2：无法添加节点

**可能原因：**
- 必填字段未填写
- 连接方式格式错误
- 网络问题

**解决方法：**
1. 确保所有必填字段都已填写
2. 检查IP地址和端口格式
3. 至少添加一个连接方式
4. 查看浏览器控制台错误信息

### 问题3：Token复制失败

**解决方法：**
1. 手动选择Token文本复制
2. 使用浏览器的复制功能
3. 检查浏览器权限设置

## 下一步

- 📖 阅读[完整节点管理指南](./NODE_MANAGEMENT.md)
- 🔧 查看[API文档](./API.md)了解更多API用法
- 👨‍💼 如果您是管理员，查看[管理员指南](./ADMIN_GUIDE.md)
- ❓ 遇到问题？查看[常见问题](./FAQ.md)

## 获取帮助

如果您在使用过程中遇到问题：

1. 查看[常见问题文档](./FAQ.md)
2. 查看[完整文档](./NODE_MANAGEMENT.md)
3. 联系系统管理员
4. 提交Issue到项目仓库

## 最佳实践

### 安全建议
- ✅ 定期更换Token
- ✅ 不要在公开场合分享Token
- ✅ 使用强密码保护账户
- ✅ 定期检查节点状态

### 性能建议
- ✅ 合理设置带宽限制
- ✅ 根据实际需求设置流量配额
- ✅ 定期清理不用的节点
- ✅ 使用标签分类管理节点

### 维护建议
- ✅ 定期检查节点在线状态
- ✅ 监控流量使用情况
- ✅ 及时更新节点配置
- ✅ 保持备注信息更新

---

🎉 恭喜！您已经掌握了节点管理的基本操作。开始管理您的节点吧！

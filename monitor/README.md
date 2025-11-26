# EasyTier 节点监控程序

## 快速入门

### 准备工作

#### 确认文件结构

确保以下文件在 `monitor` 目录中：

```
monitor/
├── monitor.py              # 主程序
├── service.exe             # Windows service 程序
├── service                 # Linux service 程序
├── start_monitor.bat       # Windows 启动脚本
├── start_monitor.sh        # Linux 启动脚本
├── test_monitor.py         # 测试脚本
└── README.md               # 本文件
```

#### 获取必要信息

你需要准备：
- **API_URL**: 你的 API 基础地址（例如：`https://your-api.workers.dev`）
- **JWT_TOKEN**: 你的 JWT 认证令牌

### Windows 快速启动

#### 方法 1: 使用启动脚本（推荐）

```cmd
start_monitor.bat https://your-api.workers.dev your_jwt_token_here
```

#### 方法 2: 直接运行 Python

```cmd
python monitor.py https://your-api.workers.dev your_jwt_token_here
```

### Linux 快速启动

#### 方法 1: 使用启动脚本（推荐）

```bash
# 首次运行需要添加执行权限
chmod +x start_monitor.sh

# 运行
./start_monitor.sh https://your-api.workers.dev your_jwt_token_here
```

#### 方法 2: 直接运行 Python

```bash
python3 monitor.py https://your-api.workers.dev your_jwt_token_here
```

### 验证运行

程序启动后，你应该看到类似以下的输出：

```
2025-11-26 14:00:00 - INFO - 启动EasyTier节点监控程序
2025-11-26 14:00:00 - INFO - API地址: https://your-api.workers.dev
2025-11-26 14:00:00 - INFO - 本地Service地址: http://127.0.0.1:8080
2025-11-26 14:00:00 - INFO - 启动service进程: ./service.exe
2025-11-26 14:00:01 - INFO - Service进程已启动，PID: 12345
2025-11-26 14:00:02 - INFO - Service启动成功
```

### 停止程序

- **前台运行**: 按 `Ctrl+C` 停止
- **后台运行**: 使用 `kill <PID>` 或 `sudo systemctl stop easytier-monitor`

---

## 功能说明

这是一个用于监控 EasyTier 节点的 Python 程序，主要功能包括：

1. **后台运行 service 进程**
   - Windows: 运行 `service.exe`
   - Linux: 运行 `./service`

2. **定时任务（每1分钟执行一次）**
   - 从 API 查询所有节点并缓存到本地
   - 维护本地 service 的节点列表（增加新节点、删除不存在的节点）
   - 从本地 service (127.0.0.1:8080) 读取节点健康状态
   - 上报节点数据到 API

3. **日志输出**
   - 详细的节点操作日志
   - 健康检查状态日志
   - 上报结果日志

## 依赖要求

- Python 3.7+
- 标准库（无需额外安装第三方包）

## 使用方法

### 基本用法

```bash
python monitor.py <API_URL> <JWT_TOKEN>
```

### 参数说明

- `API_URL`: API 基础地址，例如 `https://your-api.workers.dev`
- `JWT_TOKEN`: JWT 认证令牌
- `--log-level`: 日志级别，可选值：DEBUG, INFO, WARNING, ERROR（默认：INFO）

### 示例

```bash
# Windows
python monitor.py https://api.example.com your_jwt_token_here

# Linux
python3 monitor.py https://api.example.com your_jwt_token_here --log-level DEBUG
```

### 运行测试

在正式使用前，建议先运行测试脚本：

```bash
# Windows
python test_monitor.py

# Linux
python3 test_monitor.py
```

测试脚本会验证：
- Service 启动和停止
- API 请求功能
- 本地 Service API
- 节点同步逻辑
- 状态更新功能

### 后台运行

#### Windows - 使用 VBS 脚本

创建 `start_hidden.vbs` 文件：

```vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c start_monitor.bat https://your-api.workers.dev your_token", 0
Set WshShell = Nothing
```

双击运行即可在后台启动。

#### Linux - 使用 nohup

```bash
nohup ./start_monitor.sh https://your-api.workers.dev your_token > monitor.log 2>&1 &
```

查看日志：

```bash
tail -f monitor.log
```

停止程序：

```bash
# 查找进程
ps aux | grep monitor.py

# 停止进程
kill <PID>
```

#### Linux - 使用 systemd（推荐）

创建服务文件 `/etc/systemd/system/easytier-monitor.service`：

```ini
[Unit]
Description=EasyTier Node Monitor
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/monitor
ExecStart=/usr/bin/python3 /path/to/monitor/monitor.py https://your-api.workers.dev your_token
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable easytier-monitor
sudo systemctl start easytier-monitor
```

查看状态和日志：

```bash
# 查看状态
sudo systemctl status easytier-monitor

# 查看日志
sudo journalctl -u easytier-monitor -f
```

停止服务：

```bash
sudo systemctl stop easytier-monitor
```

## 工作流程

```
启动 Monitor
    ↓
启动 service.exe/service 进程
    ↓
等待 service 启动完成（检查 /health 接口）
    ↓
进入主循环（每60秒一次）：
    ├─ 1. 从 API 获取所有节点列表
    ├─ 2. 同步节点到本地 service
    │     ├─ 添加 API 中有但本地没有的节点
    │     └─ 删除本地有但 API 中没有的节点
    ├─ 3. 等待10秒让健康检查执行
    ├─ 4. 从本地 service 读取节点状态
    │     └─ 更新本地缓存
    └─ 5. 上报节点数据到 API
```

### 监控周期详细说明

程序每 60 秒执行一次完整的监控周期：

1. **0-5秒**: 从 API 获取节点列表
2. **5-10秒**: 同步节点到本地 service（增删节点）
3. **10-20秒**: 等待健康检查执行
4. **20-25秒**: 读取节点状态并更新缓存
5. **25-30秒**: 上报数据到 API
6. **30-60秒**: 等待下一个周期

## API 接口说明

### 远程 API 接口

Monitor 程序会调用以下远程 API：

- `GET /api/nodes/all` - 获取所有节点列表
- `POST /api/report` - 上报节点状态

### 本地 Service API 接口 (127.0.0.1:8080)

Monitor 程序会调用本地 service 的以下接口：

- `GET /health` - 健康检查
- `GET /api/nodes` - 获取节点列表
- `POST /api/nodes` - 添加节点
- `DELETE /api/nodes/{id}` - 删除节点

## 节点数据结构

### 从 API 获取的节点数据

```json
{
  "id": 1,
  "node_name": "节点名称",
  "ip_address": "192.168.1.1",
  "port": 11010,
  "protocol": "tcp",
  "description": "节点描述",
  "max_connections": 100,
  "allow_relay": true,
  "network_name": "my_network",
  "network_secret": "secret"
}
```

### 上报到 API 的数据

```json
{
  "node_id": 1,
  "node_name": "节点名称",
  "status": "healthy",
  "last_check": "2025-11-26T14:00:00Z",
  "response_time": 50,
  "health_percentage_24h": 99.5,
  "is_active": true,
  "timestamp": "2025-11-26T14:01:00Z"
}
```


## 注意事项

1. **service 文件位置**：确保 `service.exe`（Windows）或 `service`（Linux）与 Monitor.py 在同一目录下
2. **Linux 权限**：在 Linux 上，程序会自动为 service 文件添加执行权限
3. **端口占用**：确保 8080 端口未被占用
4. **网络连接**：确保能够访问 API 地址和本地 service
5. **JWT Token**：确保 JWT Token 有效且具有相应权限

## 常见问题与故障排查

### Q: Service 启动失败

**A:** 检查：
- service.exe/service 文件是否存在
- 8080 端口是否被占用（使用 `netstat -ano | findstr 8080` 或 `lsof -i :8080`）
- 是否有执行权限（Linux: `chmod +x service`）
- 查看 service 进程的错误输出

### Q: API 请求失败

**A:** 检查：
- 网络连接是否正常
- API URL 是否正确（包括 https:// 前缀）
- JWT Token 是否有效（未过期）
- 防火墙是否阻止了连接

### Q: 节点同步失败

**A:** 检查：
- 本地 service 是否正常运行（访问 http://127.0.0.1:8080/health）
- 使用 `--log-level DEBUG` 查看详细日志
- 确认节点数据格式是否正确
- 检查是否有数据库唯一约束冲突（重复的 host+port+protocol）

### Q: 数据库唯一约束错误

**A:** 错误信息：`UNIQUE constraint failed: shared_nodes.host, shared_nodes.port, shared_nodes.protocol`

解决方法：
- 程序会自动跳过重复的节点
- 检查日志中的 "跳过节点" 信息
- 如需重新添加，先删除本地数据库中的重复节点

### Q: 如何查看详细日志

**A:** 启动时添加 `--log-level DEBUG` 参数：

```bash
python monitor.py https://api.example.com your_token --log-level DEBUG
```

### Q: 如何查看帮助信息

**A:** 运行：

```bash
python monitor.py --help
```

输出：

```
usage: monitor.py [-h] [--log-level {DEBUG,INFO,WARNING,ERROR}] api_url jwt_token

EasyTier节点监控程序

positional arguments:
  api_url               API基础地址
  jwt_token             JWT认证令牌

optional arguments:
  -h, --help            show this help message and exit
  --log-level {DEBUG,INFO,WARNING,ERROR}
                        日志级别
```

## 许可证

根据项目主许可证

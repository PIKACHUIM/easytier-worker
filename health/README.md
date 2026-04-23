# EasyTier 健康检查 CLI 工具

这是一个独立的命令行工具，用于检查 EasyTier 节点的健康状态。

## 功能特性

- 独立的二进制程序，无需依赖数据库
- 通过命令行参数指定服务器地址、网络名称和密码
- 返回节点在线状态和连接数
- 支持自定义超时时间
- 可选的详细日志输出

## 依赖

本工具依赖 EasyTier 核心库。Cargo.toml 中已配置为从 GitHub 仓库获取：

```toml
easytier = { git = "https://github.com/EasyTier/EasyTier.git" }
```

如果你有本地的 EasyTier 源码，可以修改为本地路径：

```toml
easytier = { path = "../../easytier" }
```

## 编译

### 使用构建脚本（推荐）

**Linux/macOS:**
```bash
cd health-check-cli
chmod +x build.sh
./build.sh
```

**Windows:**
```cmd
cd health-check-cli
build.bat
```

### 手动编译

```bash
cd health-check-cli
cargo build --release
```

编译后的二进制文件位于：`target/release/health-check` (Linux/macOS) 或 `target/release/health-check.exe` (Windows)

**注意**: 首次编译会从 GitHub 下载 EasyTier 源码并编译所有依赖，可能需要较长时间（10-30分钟）。

## 使用方法

### 基本用法

```bash
health-check -s <服务器地址> -n <网络名称> -p <网络密码>
```

### 参数说明

- `-s, --server <SERVER>`: 服务器地址，格式：`协议://IP:端口`
  - 例如：`tcp://192.168.1.1:11010`
  - 例如：`wg://example.com:11011`
  - 例如：`ws://192.168.1.1:11012`

- `-n, --network-name <NETWORK_NAME>`: 网络名称

- `-p, --network-secret <NETWORK_SECRET>`: 网络密码

- `-t, --timeout <TIMEOUT>`: 超时时间（秒），默认 30 秒

- `-v, --verbose`: 启用详细日志输出

### 输出格式

程序输出一行文本，包含 5 个空格分隔的数字：

```
<是否在线> <当前连接数> <占用带宽> <阶梯带宽> <已用流量>
```

- **是否在线**: `1` 表示在线，`0` 表示离线
- **当前连接数**: 节点的当前连接数量
- **占用带宽**: 固定为 `0`（预留字段）
- **阶梯带宽**: 固定为 `0`（预留字段）
- **已用流量**: 固定为 `0`（预留字段）

### 示例

#### 成功检查（节点在线）

```bash
$ health-check -s tcp://192.168.1.1:11010 -n MyNetwork -p MyPassword
1 100 0 0 0
```

表示：节点在线，有 100 个连接

#### 失败检查（节点离线）

```bash
$ health-check -s tcp://192.168.1.1:11010 -n MyNetwork -p MyPassword
0 0 0 0 0
```

表示：节点离线

#### 使用详细日志

```bash
$ health-check -s tcp://192.168.1.1:11010 -n MyNetwork -p MyPassword -v
```

#### 自定义超时时间

```bash
$ health-check -s tcp://192.168.1.1:11010 -n MyNetwork -p MyPassword -t 60
```

等待最多 60 秒

## 退出码

- `0`: 检查成功，节点在线
- `1`: 检查失败，节点离线或发生错误

## 在脚本中使用

### Bash 示例

```bash
#!/bin/bash

SERVER="tcp://192.168.1.1:11010"
NETWORK="MyNetwork"
PASSWORD="MyPassword"

# 执行健康检查
result=$(./health-check -s "$SERVER" -n "$NETWORK" -p "$PASSWORD")

# 解析结果
read -r online conn_count bandwidth tier_bandwidth traffic <<< "$result"

if [ "$online" -eq 1 ]; then
    echo "节点在线，连接数: $conn_count"
else
    echo "节点离线"
fi
```

### Python 示例

```python
import subprocess
import sys

def check_node_health(server, network_name, network_secret):
    """检查节点健康状态"""
    try:
        result = subprocess.run(
            [
                './health-check',
                '-s', server,
                '-n', network_name,
                '-p', network_secret
            ],
            capture_output=True,
            text=True,
            timeout=35
        )
        
        # 解析输出
        parts = result.stdout.strip().split()
        if len(parts) == 5:
            is_online = int(parts[0]) == 1
            conn_count = int(parts[1])
            return {
                'online': is_online,
                'connections': conn_count,
                'bandwidth': int(parts[2]),
                'tier_bandwidth': int(parts[3]),
                'traffic': int(parts[4])
            }
        else:
            return None
            
    except Exception as e:
        print(f"检查失败: {e}", file=sys.stderr)
        return None

# 使用示例
status = check_node_health(
    'tcp://192.168.1.1:11010',
    'MyNetwork',
    'MyPassword'
)

if status and status['online']:
    print(f"节点在线，连接数: {status['connections']}")
else:
    print("节点离线")
```

## 技术细节

- 使用 EasyTier 核心库进行网络连接
- 禁用 TUN 设备（`no_tun = true`）
- 禁用 P2P 连接（`disable_p2p = true`）
- 禁用 UDP 打洞（`disable_udp_hole_punching = true`）
- 仅检查直接连接的对等节点

## 故障排除

### 连接超时

如果经常遇到超时，可以尝试：
1. 增加超时时间：`-t 60`
2. 检查网络连接
3. 验证服务器地址是否正确
4. 使用 `-v` 参数查看详细日志

### 无法连接

1. 确认服务器地址格式正确
2. 确认网络名称和密码正确
3. 检查防火墙设置
4. 使用 `-v` 参数查看详细错误信息

## 许可证

与 EasyTier 项目保持一致

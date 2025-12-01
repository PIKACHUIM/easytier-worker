use std::time::{Duration, Instant};
use anyhow::Context;
use clap::Parser;
use easytier::{
    common::{
        config::{ConfigFileControl, ConfigLoader, NetworkIdentity, PeerConfig, TomlConfigLoader},
    },
    instance_manager::NetworkInstanceManager,
};
use tracing::{error, info, warn};

#[derive(Parser, Debug)]
#[command(name = "health-check")]
#[command(about = "EasyTier 节点健康检查工具", long_about = None)]
struct Args {
    /// 服务器地址，格式：协议://IP:端口 (例如: tcp://192.168.1.1:11010)
    #[arg(short = 's', long)]
    server: String,

    /// 网络名称
    #[arg(short = 'n', long)]
    network_name: String,

    /// 网络密码
    #[arg(short = 'p', long)]
    network_secret: String,

    /// 超时时间（秒），默认 30 秒
    #[arg(short = 't', long, default_value = "30")]
    timeout: u64,

    /// 启用详细日志
    #[arg(short = 'v', long)]
    verbose: bool,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

// 设置全局 panic hook，防止程序因 pnet_datalink 等库的 panic 而崩溃
    // 这对于健康检查工具特别重要，因为我们需要优雅地处理错误
    std::panic::set_hook(Box::new(|panic_info| {
        let payload = panic_info.payload();
        let msg = if let Some(s) = payload.downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = payload.downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic".to_string()
        };
        
        // 检查是否是网络接口相关的panic
        if msg.contains("interface list") || 
           msg.contains("pnet_datalink") || 
           msg.contains("Unable to get interface") ||
           msg.contains("buffer size") {
            eprintln!("网络接口枚举失败: {}", msg);
            eprintln!("这可能是由于权限不足或网络驱动程序问题导致的");
            // 对于网络接口相关的panic，我们输出离线状态
            std::process::exit(1);
        } else {
            eprintln!("捕获到 panic: {}", msg);
            if let Some(location) = panic_info.location() {
                eprintln!("位置: {}:{}:{}", location.file(), location.line(), location.column());
            }
        }
    }));

    // 初始化日志
    let log_level = if args.verbose { "debug" } else { "warn" };
    tracing_subscriber::fmt()
        .with_env_filter(log_level)
        .with_target(false)
        .with_thread_ids(false)
        .with_line_number(false)
        .init();

    match run_health_check(&args).await {
        Ok((is_online, conn_count)) => {
            // 输出格式：是否在线 当前连接数 占用带宽(固定0) 阶梯带宽(固定0) 已用流量(固定0)
            println!("{} {} 0 0 0", if is_online { 1 } else { 0 }, conn_count);
            std::process::exit(0);
        }
        Err(e) => {
            if args.verbose {
                error!("健康检查失败: {}", e);
            }
            // 离线状态
            println!("0 0 0 0 0");
            std::process::exit(1);
        }
    }
}

async fn run_health_check(args: &Args) -> anyhow::Result<(bool, u32)> {
    // 创建配置
    let cfg = create_config(&args.server, &args.network_name, &args.network_secret)
        .with_context(|| "创建配置失败")?;

let inst_id = cfg.get_id();
    let instance_mgr = NetworkInstanceManager::new();

    // 启动网络实例（使用 true 参数启用自动重连）
    // 使用 catch_unwind 来捕获可能的 panic，特别是 pnet_datalink 相关的
    let start_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        instance_mgr.run_network_instance(cfg.clone(), true, ConfigFileControl::STATIC_CONFIG)
    }));

let _instance_handle = match start_result {
        Ok(handle) => handle.with_context(|| "启动网络实例失败")?,
        Err(panic_info) => {
            let msg = if let Some(s) = panic_info.downcast_ref::<&str>() {
                *s
            } else if let Some(s) = panic_info.downcast_ref::<String>() {
                s.as_str()
            } else {
                "Unknown panic during instance startup"
            };
            
            if msg.contains("interface") || msg.contains("pnet_datalink") {
                return Err(anyhow::anyhow!("网络接口枚举失败，可能需要管理员权限或检查网络驱动程序: {}", msg));
            } else {
                return Err(anyhow::anyhow!("启动网络实例时发生panic: {}", msg));
            }
        }
    };

    // 确保实例在退出时被清理
    let _cleanup = CleanupGuard {
        instance_mgr: &instance_mgr,
        inst_id,
    };

    // 等待实例完全启动
    let timeout = Duration::from_secs(args.timeout);
    let start_time = Instant::now();
    let max_startup_wait = Duration::from_secs(30);

    info!("等待实例启动...");
    while start_time.elapsed() < max_startup_wait && start_time.elapsed() < timeout {
        if instance_mgr.get_network_info(&inst_id).await.is_some() {
            info!("实例启动成功");
            break;
        }
        tokio::time::sleep(Duration::from_secs(1)).await;
    }

    if instance_mgr.get_network_info(&inst_id).await.is_none() {
        return Err(anyhow::anyhow!("实例启动超时"));
    }

    // 执行健康检查
    info!("开始健康检查，超时时间: {} 秒", args.timeout);

    while start_time.elapsed() < timeout {
        match test_node_healthy(inst_id, &instance_mgr).await {
            Ok(conn_count) => {
                info!("节点在线，连接数: {}", conn_count);
                return Ok((true, conn_count));
            }
            Err(e) => {
                if args.verbose {
                    warn!("健康检查尝试失败: {}", e);
                }
            }
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    Err(anyhow::anyhow!("健康检查超时"))
}

fn create_config(
    server_uri: &str,
    network_name: &str,
    network_secret: &str,
) -> anyhow::Result<TomlConfigLoader> {
    let cfg = TomlConfigLoader::default();

    // 设置对等节点
    cfg.set_peers(vec![PeerConfig {
        uri: server_uri
            .parse()
            .with_context(|| format!("无效的服务器地址: {}", server_uri))?,
    }]);

    // 设置实例 ID
    cfg.set_id(uuid::Uuid::new_v4());

    // 设置网络身份
    cfg.set_network_identity(NetworkIdentity::new(
        network_name.to_string(),
        network_secret.to_string(),
    ));

    // 设置主机名
    cfg.set_hostname(Some("HealthCheckCLI".to_string()));

// 设置标志
    let mut flags = cfg.get_flags();
    flags.no_tun = true;
    flags.disable_p2p = true;
    flags.disable_udp_hole_punching = true;
    flags.bind_device = false;  // 禁用设备绑定，避免网络接口枚举
    flags.use_smoltcp = true;   // 使用smoltcp栈，避免系统网络接口依赖
    flags.enable_ipv6 = false;  // 禁用IPv6，减少网络复杂性
    flags.proxy_forward_by_system = false;  // 禁用系统代理转发
    flags.accept_dns = false;   // 禁用DNS接受
    flags.private_mode = true;  // 启用私有模式，可能减少某些网络探测
    flags.latency_first = false; // 禁用延迟优先，减少网络探测
    flags.enable_exit_node = false; // 禁用出口节点功能
    cfg.set_flags(flags);

    // 设置 IPv4 STUN 服务器，避免尝试解析可能失败的 IPv6 服务器
    cfg.set_stun_servers(Some(vec![
        "stun.miwifi.com".to_string(),
        "stun.chat.bilibili.com".to_string(),
        "stun.hitv.com".to_string(),
        "stun.nextcloud.com".to_string(),
    ]));

    // 禁用 IPv6 STUN 服务器，避免尝试解析 IPv6 地址
    cfg.set_stun_servers_v6(Some(vec![]));

    Ok(cfg)
}

async fn test_node_healthy(
    inst_id: uuid::Uuid,
    instance_mgr: &NetworkInstanceManager,
) -> anyhow::Result<u32> {
    // 使用 get_network_info 获取实例信息（参考 easytier-uptime 的实现）
    let Some(instance) = instance_mgr.get_network_info(&inst_id).await else {
        anyhow::bail!("健康检查节点未启动");
    };

    let running = instance.running;
    // 检查实例是否正在运行
    if !running {
        anyhow::bail!("健康检查节点未运行");
    }

    // 检查是否有错误消息
    if let Some(err) = instance.error_msg {
        anyhow::bail!("健康检查节点有错误: {}", err);
    }

    let p = instance.peer_route_pairs;
    // 检查目标节点是否在线
    // 我们禁用了 p2p，所以只检查直接连接的 peer
    let Some(dst_node) = p.iter().find(|x| {
        x.route.as_ref().is_some_and(|route| {
            !route.feature_flag.as_ref().map(|f| f.is_public_server).unwrap_or(false)
                && route.hostname != "HealthCheckCLI"
        }) && x.peer.as_ref().is_some_and(|p| !p.conns.is_empty())
    }) else {
        anyhow::bail!("目标节点不在线");
    };

    let Some(_peer_info) = &dst_node.peer else {
        anyhow::bail!("目标节点 peer 信息未找到");
    };

    // 获取连接数
    let peer_id = _peer_info.peer_id;
    let conn_count = if let Some(summary) = instance.foreign_network_summary {
        summary
            .info_map
            .get(&peer_id)
            .map(|x| x.network_count)
            .unwrap_or(0)
    } else {
        0
    };

    Ok(conn_count)
}

// 清理守卫，确保实例在退出时被删除
struct CleanupGuard<'a> {
    instance_mgr: &'a NetworkInstanceManager,
    inst_id: uuid::Uuid,
}

impl<'a> Drop for CleanupGuard<'a> {
    fn drop(&mut self) {
        let _ = self.instance_mgr.delete_network_instance(vec![self.inst_id]);
    }
}
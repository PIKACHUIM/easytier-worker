import type {Env} from './types';

/**
 * EdgeOne 云函数检测结果
 */
export interface EdgeOneCheckResult {
    is_online: boolean;
    connection_count: number;
    latency_ms: number;
    check_time: string;
    error?: string;
}

/**
 * 批量检测结果
 */
export interface EdgeOneBatchCheckResult {
    results: EdgeOneCheckResult[];
}

/**
 * 判断是否配置了 EdgeOne 检测 API
 */
export function isEdgeOneCheckEnabled(env: Env): boolean {
    return !!env.EDGEONE_CHECK_API && env.EDGEONE_CHECK_API.trim() !== '';
}

/**
 * 获取 EdgeOne 检测超时时间（毫秒）
 */
export function getEdgeOneCheckTimeout(env: Env): number {
    const timeoutSeconds = parseInt(env.EDGEONE_CHECK_TIMEOUT || '30', 10);
    return (isNaN(timeoutSeconds) ? 30 : timeoutSeconds) * 1000;
}

/**
 * 通过 EdgeOne 云函数检测单个节点的在线状态
 * @param env 环境变量
 * @param server 节点连接地址（如 tcp://1.2.3.4:11010）
 * @param network_name 网络名称
 * @param network_secret 网络密码
 */
export async function checkNodeViaEdgeOne(
    env: Env,
    server: string,
    network_name: string,
    network_secret: string
): Promise<EdgeOneCheckResult> {
    const apiUrl = env.EDGEONE_CHECK_API!.replace(/\/$/, '');
    const timeout = getEdgeOneCheckTimeout(env);
    const checkTime = new Date().toISOString();

    const url = `${apiUrl}/check?server=${encodeURIComponent(server)}&network_name=${encodeURIComponent(network_name)}&network_secret=${encodeURIComponent(network_secret)}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // 携带 API Key 鉴权
    if (env.EDGEONE_CHECK_API_KEY) {
        headers['X-API-Key'] = env.EDGEONE_CHECK_API_KEY;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => '未知错误');
            console.error(`[EdgeOne检测] 请求失败: ${response.status} ${errorText}`);
            return {
                is_online: false,
                connection_count: 0,
                latency_ms: -1,
                check_time: checkTime,
                error: `HTTP ${response.status}: ${errorText}`,
            };
        }

        const data = await response.json() as EdgeOneCheckResult;
        return {
            is_online: data.is_online,
            connection_count: data.connection_count ?? 0,
            latency_ms: data.latency_ms ?? -1,
            check_time: data.check_time || checkTime,
            error: data.error,
        };
    } catch (error: any) {
        const errorMsg = error.name === 'AbortError' ? '检测超时' : (error.message || '未知错误');
        console.error(`[EdgeOne检测] 异常: ${errorMsg}`);
        return {
            is_online: false,
            connection_count: 0,
            latency_ms: -1,
            check_time: checkTime,
            error: errorMsg,
        };
    }
}

/**
 * 批量检测节点（通过 EdgeOne 云函数）
 * @param env 环境变量
 * @param nodes 节点列表，每个节点包含 server、network_name、network_secret
 */
export async function batchCheckViaEdgeOne(
    env: Env,
    nodes: { server: string; network_name: string; network_secret: string }[]
): Promise<EdgeOneCheckResult[]> {
    const apiUrl = env.EDGEONE_CHECK_API!.replace(/\/$/, '');
    const timeout = getEdgeOneCheckTimeout(env);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // 携带 API Key 鉴权
    if (env.EDGEONE_CHECK_API_KEY) {
        headers['X-API-Key'] = env.EDGEONE_CHECK_API_KEY;
    }

    const url = `${apiUrl}/batch-check`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout * 2); // 批量检测给更长的超时

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({nodes}),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => '未知错误');
            console.error(`[EdgeOne批量检测] 请求失败: ${response.status} ${errorText}`);
            // 批量检测失败时，回退到逐个检测
            return await fallbackIndividualCheck(env, nodes);
        }

        const data = await response.json() as EdgeOneBatchCheckResult;
        return data.results || [];
    } catch (error: any) {
        const errorMsg = error.name === 'AbortError' ? '批量检测超时' : (error.message || '未知错误');
        console.error(`[EdgeOne批量检测] 异常: ${errorMsg}，回退到逐个检测`);
        // 批量检测异常时，回退到逐个检测
        return await fallbackIndividualCheck(env, nodes);
    }
}

/**
 * 回退到逐个检测（当批量检测接口不可用时）
 */
async function fallbackIndividualCheck(
    env: Env,
    nodes: { server: string; network_name: string; network_secret: string }[]
): Promise<EdgeOneCheckResult[]> {
    // 并发检测，但限制并发数为 5
    const batchSize = 5;
    const results: EdgeOneCheckResult[] = [];

    for (let i = 0; i < nodes.length; i += batchSize) {
        const batch = nodes.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(node => checkNodeViaEdgeOne(env, node.server, node.network_name, node.network_secret))
        );
        results.push(...batchResults);
    }

    return results;
}

/**
 * 验证 EdgeOne API Key（用于一体化部署模式下的路由鉴权）
 */
export function verifyEdgeOneApiKey(env: Env, requestApiKey: string | null): boolean {
    // 如果未配置 API Key，则不鉴权
    if (!env.EDGEONE_CHECK_API_KEY) {
        return true;
    }
    // 请求未携带 API Key
    if (!requestApiKey) {
        return false;
    }
    // 简单字符串比较
    return requestApiKey === env.EDGEONE_CHECK_API_KEY;
}

// ============================================================
// 节点检测模式（与 confs.node_check_mode 对应）
// ============================================================

export type NodeCheckMode = 'internal' | 'local' | 'remote';

/**
 * 解析连接地址，返回 {protocol, host, port}
 * 支持 tcp/ws/wss/udp 协议，无协议头时按 tcp 处理
 */
export function parseServerAddress(server: string): { protocol: string; host: string; port: number } | null {
    const m = server.match(/^([a-zA-Z]+):\/\/([^:/?#]+):(\d+)/);
    if (m) {
        return {protocol: m[1].toLowerCase(), host: m[2], port: parseInt(m[3], 10)};
    }
    // 兼容裸 host:port
    const m2 = server.match(/^([^:/?#]+):(\d+)/);
    if (m2) {
        return {protocol: 'tcp', host: m2[1], port: parseInt(m2[2], 10)};
    }
    return null;
}

/**
 * 内置可达性检测（仅判断节点端口是否可连）
 *
 * - tcp/ws/wss：使用 Cloudflare Workers `cloudflare:sockets.connect()`
 *   做一次 TCP 三次握手探测，成功即视为节点在线，但无法获取连接数。
 * - udp：Workers 平台不支持原始 UDP 出站，无法在内置模式下检测，返回 skipped。
 *
 * 仅用作"节点是否可达"的健康检查，connection_count 始终为 0。
 */
export async function checkNodeViaTcp(server: string, timeoutMs = 5000): Promise<EdgeOneCheckResult> {
    const checkTime = new Date().toISOString();
    const addr = parseServerAddress(server);
    if (!addr) {
        return {is_online: false, connection_count: 0, latency_ms: -1, check_time: checkTime, error: '无效的连接地址格式'};
    }

    // UDP 在 Workers 平台不可达，由上层标记跳过
    if (addr.protocol === 'udp') {
        return {is_online: false, connection_count: 0, latency_ms: -1, check_time: checkTime, error: '内置模式不支持 UDP 节点检测'};
    }

    const start = Date.now();
    let socket: any = null;
    try {
        // 动态导入 cloudflare:sockets，避免在不支持的环境（本地 Node 测试）下静态报错
        // @ts-ignore - cloudflare 内置模块
        const mod = await import('cloudflare:sockets');
        socket = mod.connect({hostname: addr.host, port: addr.port}, {secureTransport: 'off', allowHalfOpen: false});

        // 等待 opened 完成或超时
        const opened = socket.opened as Promise<any>;
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('连接超时')), timeoutMs)
        );
        await Promise.race([opened, timeoutPromise]);

        const latency = Date.now() - start;
        try {
            await socket.close();
        } catch {
            // 忽略关闭异常
        }
        return {is_online: true, connection_count: 0, latency_ms: latency, check_time: checkTime};
    } catch (err: any) {
        const msg = err?.message || String(err);
        try {
            if (socket) await socket.close();
        } catch {
            // 忽略
        }
        return {
            is_online: false,
            connection_count: 0,
            latency_ms: Date.now() - start,
            check_time: checkTime,
            error: msg.includes('cloudflare:sockets') ? '当前运行环境不支持原始 TCP 出站' : msg,
        };
    }
}

/**
 * 内置批量检测（并发上限 5）
 */
export async function batchCheckViaTcp(
    nodes: { server: string; network_name: string; network_secret: string }[],
    timeoutMs = 5000
): Promise<EdgeOneCheckResult[]> {
    const batchSize = 5;
    const results: EdgeOneCheckResult[] = [];
    for (let i = 0; i < nodes.length; i += batchSize) {
        const batch = nodes.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(n => checkNodeViaTcp(n.server, timeoutMs)));
        results.push(...batchResults);
    }
    return results;
}

/**
 * 通过任意 baseUrl（如远程 EdgeOne 地址、或本机 Python 脚本所在站点）调用 /api/edgeone/check
 * baseUrl 形如 https://example.com 或 https://example.com/api/edgeone（两种都接受）
 */
export async function checkNodeViaCustomUrl(
    baseUrl: string,
    server: string,
    network_name: string,
    network_secret: string,
    timeoutMs: number,
    apiKey?: string
): Promise<EdgeOneCheckResult> {
    const checkTime = new Date().toISOString();
    const root = baseUrl.replace(/\/+$/, '');
    // 如果用户传入 https://x.com，自动补 /api/edgeone；若已带 /api/edgeone 则直接用
    const apiBase = /\/api\/edgeone$/.test(root) ? root : `${root}/api/edgeone`;
    const url = `${apiBase}/check?server=${encodeURIComponent(server)}&network_name=${encodeURIComponent(network_name)}&network_secret=${encodeURIComponent(network_secret)}`;

    const headers: Record<string, string> = {'Content-Type': 'application/json'};
    if (apiKey) headers['X-API-Key'] = apiKey;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(url, {method: 'GET', headers, signal: controller.signal});
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorText = await response.text().catch(() => '未知错误');
            return {is_online: false, connection_count: 0, latency_ms: -1, check_time: checkTime, error: `HTTP ${response.status}: ${errorText}`};
        }
        const data = await response.json() as EdgeOneCheckResult;
        return {
            is_online: data.is_online,
            connection_count: data.connection_count ?? 0,
            latency_ms: data.latency_ms ?? -1,
            check_time: data.check_time || checkTime,
            error: data.error,
        };
    } catch (error: any) {
        const errorMsg = error.name === 'AbortError' ? '检测超时' : (error.message || '未知错误');
        return {is_online: false, connection_count: 0, latency_ms: -1, check_time: checkTime, error: errorMsg};
    }
}

/**
 * 通过任意 baseUrl 批量检测：优先调用 /batch-check，失败时退化为并发逐个调用 /check
 */
export async function batchCheckViaCustomUrl(
    baseUrl: string,
    nodes: { server: string; network_name: string; network_secret: string }[],
    timeoutMs: number,
    apiKey?: string
): Promise<EdgeOneCheckResult[]> {
    const root = baseUrl.replace(/\/+$/, '');
    const apiBase = /\/api\/edgeone$/.test(root) ? root : `${root}/api/edgeone`;
    const url = `${apiBase}/batch-check`;

    const headers: Record<string, string> = {'Content-Type': 'application/json'};
    if (apiKey) headers['X-API-Key'] = apiKey;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs * 2);
        const response = await fetch(url, {method: 'POST', headers, body: JSON.stringify({nodes}), signal: controller.signal});
        clearTimeout(timeoutId);
        if (!response.ok) {
            console.error(`[自定义批量检测] 请求失败: ${response.status}`);
            return await fallbackCustomIndividual(baseUrl, nodes, timeoutMs, apiKey);
        }
        const data = await response.json() as EdgeOneBatchCheckResult;
        return data.results || [];
    } catch (error: any) {
        const errorMsg = error.name === 'AbortError' ? '批量检测超时' : (error.message || '未知错误');
        console.error(`[自定义批量检测] 异常: ${errorMsg}，回退到逐个检测`);
        return await fallbackCustomIndividual(baseUrl, nodes, timeoutMs, apiKey);
    }
}

async function fallbackCustomIndividual(
    baseUrl: string,
    nodes: { server: string; network_name: string; network_secret: string }[],
    timeoutMs: number,
    apiKey?: string
): Promise<EdgeOneCheckResult[]> {
    const batchSize = 5;
    const results: EdgeOneCheckResult[] = [];
    for (let i = 0; i < nodes.length; i += batchSize) {
        const batch = nodes.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(n => checkNodeViaCustomUrl(baseUrl, n.server, n.network_name, n.network_secret, timeoutMs, apiKey))
        );
        results.push(...batchResults);
    }
    return results;
}

/**
 * 从 confs 中读取节点检测配置
 */
export interface NodeCheckConfig {
    mode: NodeCheckMode;
    remoteUrl: string;
    localBaseUrl: string; // local 模式下使用的本机站点根地址（site_url）
    timeoutMs: number;
}

export async function loadNodeCheckConfig(env: Env): Promise<NodeCheckConfig> {
    const rows = await env.DB.prepare(
        `SELECT setting_key, setting_value FROM confs
         WHERE setting_key IN ('node_check_mode', 'node_check_remote_url', 'site_url')`
    ).all();
    const map: Record<string, string> = {};
    for (const r of (rows.results as any[]) || []) {
        map[r.setting_key] = r.setting_value;
    }
    let mode = (map['node_check_mode'] || 'local').trim() as NodeCheckMode;
    if (mode !== 'internal' && mode !== 'local' && mode !== 'remote') {
        mode = 'local';
    }
    const timeoutMs = getEdgeOneCheckTimeout(env); // 复用 EDGEONE_CHECK_TIMEOUT
    return {
        mode,
        remoteUrl: (map['node_check_remote_url'] || '').trim(),
        localBaseUrl: (map['site_url'] || '').trim(),
        timeoutMs,
    };
}

/**
 * 统一批量检测入口：根据 confs 配置自动选择检测方式
 * 返回每个节点的检测结果（与入参顺序一一对应）
 */
export async function unifiedBatchCheck(
    env: Env,
    nodes: { server: string; network_name: string; network_secret: string }[]
): Promise<{ results: EdgeOneCheckResult[]; mode: NodeCheckMode; modeNote: string }> {
    const cfg = await loadNodeCheckConfig(env);

    // 模式 1：内置 TCP 可达性
    if (cfg.mode === 'internal') {
        return {
            results: await batchCheckViaTcp(nodes, Math.min(cfg.timeoutMs, 8000)),
            mode: 'internal',
            modeNote: 'internal(TCP reachable)',
        };
    }

    // 模式 3：远程 EdgeOne 地址
    if (cfg.mode === 'remote') {
        if (!cfg.remoteUrl) {
            // 配置缺失，自动降级为内置
            console.warn('[节点检测] node_check_mode=remote 但未配置 node_check_remote_url，降级为内置 TCP 检测');
            return {
                results: await batchCheckViaTcp(nodes, Math.min(cfg.timeoutMs, 8000)),
                mode: 'internal',
                modeNote: 'internal(remote URL not configured, fallback)',
            };
        }
        return {
            results: await batchCheckViaCustomUrl(cfg.remoteUrl, nodes, cfg.timeoutMs, env.EDGEONE_CHECK_API_KEY),
            mode: 'remote',
            modeNote: `remote(${cfg.remoteUrl})`,
        };
    }

    // 模式 2（默认）：本机 Python 脚本（通过 site_url 自调）
    // 如果同时配置了环境变量 EDGEONE_CHECK_API，则优先使用（直接走 EdgeOne 远程 API）
    if (isEdgeOneCheckEnabled(env)) {
        return {
            results: await batchCheckViaEdgeOne(env, nodes),
            mode: 'local',
            modeNote: `local(env EDGEONE_CHECK_API)`,
        };
    }
    if (cfg.localBaseUrl) {
        return {
            results: await batchCheckViaCustomUrl(cfg.localBaseUrl, nodes, cfg.timeoutMs, env.EDGEONE_CHECK_API_KEY),
            mode: 'local',
            modeNote: `local(${cfg.localBaseUrl})`,
        };
    }
    // 都没配 → 降级为内置 TCP
    console.warn('[节点检测] node_check_mode=local 但 site_url 与 EDGEONE_CHECK_API 均未配置，降级为内置 TCP 检测');
    return {
        results: await batchCheckViaTcp(nodes, Math.min(cfg.timeoutMs, 8000)),
        mode: 'internal',
        modeNote: 'internal(local URL not configured, fallback)',
    };
}
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

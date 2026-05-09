import {Hono} from 'hono';
import type {Env, NodeDB, NodeReportRequest, NodeQueryRequest, MonitorReportRequest, PeerInfo, RouteInfo} from '../types';
import {
    updateRecentStatus,
    calculateDailyTrafficPerUser,
    calculateBandwidthPerUser,
    verifyJWT
} from '../utils';
import {isEdgeOneCheckEnabled, checkNodeViaEdgeOne, batchCheckViaEdgeOne, verifyEdgeOneApiKey, type EdgeOneCheckResult} from '../edgeone';

const api = new Hono<{ Bindings: Env }>();

// 节点上报
api.post('/report', async (c) => {
    try {
        const data: NodeReportRequest = await c.req.json();

        // 验证必填字段
        if (!data.node_name || !data.email || !data.token ||
            data.current_bandwidth === undefined ||
            data.reported_traffic === undefined ||
            data.connection_count === undefined) {
            return c.json({error: '缺少必填字段'}, 400);
        }

        // 获取节点信息（通过节点名称和用户邮箱）
        const node = await c.env.DB.prepare(
            'SELECT * FROM nodes WHERE node_name = ? AND user_email = ?'
        ).bind(data.node_name, data.email).first();

        if (!node) {
            return c.json({error: '节点不存在'}, 404);
        }

        // 验证token
        if (node.report_token !== data.token) {
            return c.json({error: 'Token验证失败'}, 403);
        }

        // 检查节点是否过期
        const now = new Date();
        const validUntil = new Date(node.valid_until);
        if (now > validUntil) {
            return c.json({error: '节点已过期'}, 403);
        }

        // 检查是否需要重置流量（按每月重置日期 0-31）
        const resetDate = new Date(node.reset_date);
        // 改为覆盖模式：直接使用上报的流量值作为当前流量
        let newUsedTraffic = data.reported_traffic;
        let newResetDate = node.reset_date;

        const computeNextMonthlyReset = (from: Date, day: number): string => {
            const y = from.getUTCFullYear();
            const m = from.getUTCMonth();
            // move to next month
            const nextMonth = new Date(Date.UTC(y, m + 1, 1));
            // last day of next month
            const lastDayNextMonth = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).getUTCDate();
            const targetDay = day === 0 ? lastDayNextMonth : Math.min(day, lastDayNextMonth);
            const result = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), targetDay, 0, 0, 0));
            return result.toISOString();
        };

        if (now >= resetDate) {
            // 重置流量并计算下次重置日期（按月）
            newUsedTraffic = data.reported_traffic;
            const nextReset = computeNextMonthlyReset(now, node.reset_cycle);
            newResetDate = nextReset;
        }

        // 计算负荷（0-9）
        let load = 0;
        // 如果节点设置了总是在线，强制状态为 online
        const effectiveStatus = node.always_online === 1 ? 'online' : data.status;
        if (effectiveStatus === 'offline') {
            load = 1;
        } else {
            // 根据带宽、流量、连接数计算负荷
            const bandwidthLoad = node.tier_bandwidth > 0 ? (data.current_bandwidth / node.tier_bandwidth) * 3 : 0;
            const trafficLoad = node.max_traffic > 0 ? (newUsedTraffic / node.max_traffic) * 3 : 0;
            const connectionLoad = node.max_connections > 0 ? (data.connection_count / node.max_connections) * 3 : 0;
            load = Math.min(9, Math.max(2, Math.ceil(bandwidthLoad + trafficLoad + connectionLoad)));
        }

        // 更新近期状态
        const newRecentStatus = updateRecentStatus(node.recent_status, load);

        // 更新节点信息
        // 可选更新阶梯带宽（由API上报）
        const updateTierBandwidth = data.tier_bandwidth !== undefined;
        // 新增字段处理
        const networkCount = data.network_count ?? 0;
        const relayBandwidth = data.relay_bandwidth ? data.relay_bandwidth / 1000000 : 0; // bps -> Mbps
        const currentNetworkOnly = data.current_network_only ? 1 : 0;
        // 如果客户端上报了allow_relay，更新节点的allow_relay字段
        const updateAllowRelay = data.allow_relay !== undefined;

        const updateSql = `
            UPDATE nodes
            SET current_bandwidth = ?,
                used_traffic      = ?,
                reset_date        = ?,
                connection_count  = ?,
                status            = ?,
                recent_status     = ?,
                last_report_at    = ?,
                network_count     = ?,
                relay_bandwidth   = ?,
                current_network_only = ?${updateTierBandwidth ? ',\n        tier_bandwidth = ?' : ''}${updateAllowRelay ? ',\n        allow_relay = ?' : ''}
            WHERE id = ?
        `;
        const bindings = [
            data.current_bandwidth,
            newUsedTraffic,
            newResetDate,
            data.connection_count,
            effectiveStatus,
            newRecentStatus,
            now.toISOString(),
            networkCount,
            relayBandwidth,
            currentNetworkOnly,
        ];
        if (updateTierBandwidth) bindings.push(data.tier_bandwidth);
        if (updateAllowRelay) bindings.push(data.allow_relay ? 1 : 0);
        bindings.push(node.id);

        await c.env.DB.prepare(updateSql).bind(...bindings).run();

        // 方案C：处理 peer 信息上报
        if (data.peers && data.peers.length > 0) {
            await savePeerInfo(c.env.DB, node.id, data.peers);
        }

        // 方案C：处理路由信息上报
        if (data.route_info && data.route_info.length > 0) {
            await saveRouteInfo(c.env.DB, node.id, data.route_info);
        }

        // 方案C：更新扩展字段（public_ip, easytier_version, uptime_seconds, latency_ms, is_limited, limited_bandwidth, active_policies）
        const extUpdates: string[] = [];
        const extValues: any[] = [];
        if (data.public_ip !== undefined) {
            extUpdates.push('public_ip = ?');
            extValues.push(data.public_ip);
        }
        if (data.easytier_version !== undefined) {
            extUpdates.push('easytier_version = ?');
            extValues.push(data.easytier_version);
        }
        if (data.uptime_seconds !== undefined) {
            extUpdates.push('uptime_seconds = ?');
            extValues.push(data.uptime_seconds);
        }
        if (data.latency_ms !== undefined) {
            extUpdates.push('monitor_latency_ms = ?');
            extValues.push(data.latency_ms);
        }
        // 流量策略相关字段
        if (data.is_limited !== undefined) {
            extUpdates.push('is_limited = ?');
            extValues.push(data.is_limited ? 1 : 0);
        }
        if (data.limited_bandwidth !== undefined) {
            extUpdates.push('limited_bandwidth = ?');
            extValues.push(data.limited_bandwidth);
        }
        if (data.active_policies !== undefined) {
            extUpdates.push('active_policies = ?');
            extValues.push(JSON.stringify(data.active_policies));
        }
        if (extUpdates.length > 0) {
            extValues.push(node.id);
            try {
                await c.env.DB.prepare(
                    `UPDATE nodes SET ${extUpdates.join(', ')} WHERE id = ?`
                ).bind(...extValues).run();
            } catch (e) {
                // 字段可能不存在（未迁移），忽略错误
                console.warn('更新扩展字段失败（可能未迁移）:', e);
            }
        }

        return c.json({
            message: '上报成功',
            used_traffic: newUsedTraffic,
            max_traffic: node.max_traffic,
            reset_date: newResetDate
        });
    } catch (error) {
        console.error('节点上报错误:', error);
        return c.json({error: '上报失败'}, 500);
    }
});

// 客户端查询节点
api.use('/query', async (c) => {
    try {
        let data: NodeQueryRequest = {};

// 根据请求方法获取参数
        if (c.req.method === 'GET') {
            // GET请求从查询参数获取
            const region = c.req.query('region');
            const priority = c.req.query('priority');
            const relayOnly = c.req.query('relay_only');

            // 只有当参数存在时才设置，否则保持undefined
            data = {
                region: region ? (region as 'domestic' | 'overseas' | 'all') : undefined,
                priority: priority ? priority as any : undefined,
                relay_only: relayOnly === 'true' ? true : (relayOnly === 'false' ? false : undefined)
            };
        } else {
            // POST请求从JSON body获取，处理没有JSON的情况
            try {
                const jsonData = await c.req.json();
                data = jsonData || {};
            } catch (error) {
                // 如果JSON解析失败，使用空对象
                data = {};
            }
        }

        console.log(data);
        // 构建查询条件
        let query = 'SELECT * FROM nodes WHERE (status = ? OR always_online = 1) AND valid_until > ? AND is_enabled = 1';
        const params: any[] = ['online', new Date().toISOString()];

        // 地域筛选
        if (data.region && data.region !== 'all') {
            query += ' AND region_type = ?';
            params.push(data.region);
        }

        // 中转筛选 - 只有明确为true时才筛选
        if (data.relay_only === true) {
            query += ' AND allow_relay = 1';
        }

        const {results} = await c.env.DB.prepare(query).bind(...params).all();

        console.log(`查询到 ${results.length} 个符合条件的节点`);

        if (results.length === 0) {
            return c.json({nodes: []});
        }

// 根据优先级排序或随机排序
        let sortedNodes = results.map((node: any) => {
            const connections = JSON.parse(node.connections);
            let score = 0;

            if (data.priority === 'traffic') {
                // 流量优先：计算人均日流量
                score = calculateDailyTrafficPerUser(
                    node.max_traffic,
                    node.used_traffic,
                    node.reset_date,
                    node.connection_count
                );
            } else if (data.priority === 'bandwidth') {
                // 带宽优先：计算人均带宽
                score = calculateBandwidthPerUser(node.tier_bandwidth, node.connection_count);
            } else if (data.priority === 'latency') {
                // 延迟优先：使用可用连接数作为参考（连接数少的可能延迟更低）
                score = node.max_connections - node.connection_count;
            }

            return {
                ...node,
                connections,
                score
            };
        });

        // 如果没有指定优先级，则随机打乱节点
        if (!data.priority) {
            // Fisher-Yates 洗牌算法随机打乱数组
            for (let i = sortedNodes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [sortedNodes[i], sortedNodes[j]] = [sortedNodes[j], sortedNodes[i]];
            }
        } else {
            // 有优先级则按分数降序排序
            sortedNodes.sort((a: any, b: any) => b.score - a.score);
        }

        // 返回前 3 个节点（如果节点数不足10个，返回所有节点）
        const topNodes = sortedNodes.slice(0, 3).map((node: any) => ({
            id: node.id,
            node_name: node.node_name,
            region_type: node.region_type,
            region_detail: node.region_detail,
            connections: node.connections,
            current_bandwidth: node.current_bandwidth,
            tier_bandwidth: node.tier_bandwidth,
            connection_count: node.connection_count,
            max_connections: node.max_connections,
            used_traffic: node.used_traffic,
            max_traffic: node.max_traffic,
            tags: node.tags,
            allow_relay: node.allow_relay
        }));

        console.log(`最终返回 ${topNodes.length} 个节点`);

        return c.json({nodes: topNodes});
    } catch (error) {
        console.error('查询节点错误:', error);
        return c.json({error: '查询失败'}, 500);
    }
});

// 获取公开节点列表（用于前端展示）
api.get('/public', async (c) => {
    try {
        const showOffline = c.req.query('show_offline') === 'true';

        let query = 'SELECT * FROM nodes WHERE valid_until > ? AND is_enabled = 1';
        const params: any[] = [new Date().toISOString()];

        if (!showOffline) {
            query += ' AND (status = ? OR always_online = 1)';
            params.push('online');
        }

        query += ' ORDER BY status DESC, created_at DESC';

        const {results} = await c.env.DB.prepare(query).bind(...params).all();

        const publicNodes = results.map((node: any) => ({
            id: node.id,
            node_name: node.node_name,
            region_type: node.region_type,
            region_detail: node.region_detail,
            connections: JSON.parse(node.connections),
            current_bandwidth: node.current_bandwidth,
            tier_bandwidth: node.tier_bandwidth,
            max_bandwidth: node.max_bandwidth,
            used_traffic: node.used_traffic,
            max_traffic: node.max_traffic,
            connection_count: node.connection_count,
            max_connections: node.max_connections,
            tags: node.tags,
            notes: node.notes,
            status: node.always_online === 1 ? 'online' : node.status,
            recent_status: node.recent_status,
            allow_relay: node.allow_relay,
            is_enabled: node.is_enabled,
            reset_date: node.reset_date,
            always_online: node.always_online,
            // 限速与策略状态
            is_limited: node.is_limited === 1,
            limited_bandwidth: node.limited_bandwidth || 0,
            current_network_limit_mbps: node.current_network_limit_mbps || 0,
            other_network_limit_mbps: node.other_network_limit_mbps || 0,
            active_policies: node.active_policies ? JSON.parse(node.active_policies) : [],
            public_ip: node.public_ip || '',
            uptime_seconds: node.uptime_seconds || 0,
        }));

        // 计算在线节点的平均负载和总连接数（always_online=1 的节点视为在线）
        const onlineNodes = results.filter((n: any) => n.status === 'online' || n.always_online === 1);
        const totalConnections = onlineNodes.reduce((sum: number, n: any) => sum + n.connection_count, 0);
        const avgBandwidth = onlineNodes.length > 0
            ? onlineNodes.reduce((sum: number, n: any) => sum + n.current_bandwidth, 0) / onlineNodes.length
            : 0;
        const avgTraffic = onlineNodes.length > 0
            ? onlineNodes.reduce((sum: number, n: any) => sum + n.used_traffic, 0) / onlineNodes.length
            : 0;

        return c.json({
            nodes: publicNodes,
            stats: {
                total_connections: totalConnections,
                avg_bandwidth: avgBandwidth,
                avg_traffic: avgTraffic,
                avg_connections: onlineNodes.length > 0 ? totalConnections / onlineNodes.length : 0
            }
        });
    } catch (error) {
        console.error('获取公开节点错误:', error);
        return c.json({error: '获取节点失败'}, 500);
    }
});

// 获取节点统计信息
api.get('/stats', async (c) => {
    try {
        // 总节点数
        const totalNodes = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM nodes WHERE is_enabled = 1'
        ).first();

        // 在线节点数（包含 always_online=1 的节点）
        const onlineNodes = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM nodes WHERE (status = ? OR always_online = 1) AND is_enabled = 1'
        ).bind('online').first();

        // 国内节点数
        const domesticNodes = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM nodes WHERE region_type = ? AND is_enabled = 1'
        ).bind('domestic').first();

        // 海外节点数
        const overseasNodes = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM nodes WHERE region_type = ? AND is_enabled = 1'
        ).bind('overseas').first();

        // 在线节点带宽汇总（当前/阶梯/最大）与连接汇总
        const bandwidthSums = await c.env.DB.prepare(
            'SELECT SUM(current_bandwidth) as current_total, SUM(tier_bandwidth) as tier_total, SUM(max_bandwidth) as max_total FROM nodes WHERE is_enabled = 1'
        ).first();

        const connectionsSums = await c.env.DB.prepare(
            'SELECT SUM(connection_count) as connection_total, SUM(max_connections) as max_total FROM nodes WHERE is_enabled = 1'
        ).first();

        // 获取历史统计数据
        const historyData = await getStatsHistory(c.env.DB);

        return c.json({
            total_nodes: totalNodes?.count || 0,
            online_nodes: onlineNodes?.count || 0,
            domestic_nodes: domesticNodes?.count || 0,
            overseas_nodes: overseasNodes?.count || 0,
            current_bandwidth_total: bandwidthSums?.current_total || 0,
            tier_bandwidth_total: bandwidthSums?.tier_total || 0,
            max_bandwidth_total: bandwidthSums?.max_total || 0,
            connection_count_total: connectionsSums?.connection_total || 0,
            max_connections_total: connectionsSums?.max_total || 0,
            history: historyData
        });
    } catch (error) {
        console.error('获取统计信息错误:', error);
        return c.json({error: '获取统计信息失败'}, 500);
    }
});

// 获取统计历史数据
async function getStatsHistory(db: any) {
    try {
        const onlineNodesHistory = await db.prepare(
            'SELECT setting_value FROM confs WHERE setting_key = ?'
        ).bind('stats_online_nodes_history').first();

        const connectionsHistory = await db.prepare(
            'SELECT setting_value FROM confs WHERE setting_key = ?'
        ).bind('stats_connections_history').first();

        const bandwidthHistory = await db.prepare(
            'SELECT setting_value FROM confs WHERE setting_key = ?'
        ).bind('stats_bandwidth_history').first();

        const tierbandHistory = await db.prepare(
            'SELECT setting_value FROM confs WHERE setting_key = ?'
        ).bind('stats_tierband_history').first();

        return {
            online_nodes: JSON.parse(onlineNodesHistory?.setting_value || '[]'),
            connections: JSON.parse(connectionsHistory?.setting_value || '[]'),
            bandwidth: JSON.parse(bandwidthHistory?.setting_value || '[]'),
            tierband: JSON.parse(tierbandHistory?.setting_value || '[]')
        };
    } catch (error) {
        console.error('获取统计历史数据错误:', error);
        return {
            online_nodes: [],
            connections: [],
            bandwidth: [],
            tierband: []
        };
    }
}

// 更新统计历史数据
async function updateStatsHistory(db: any, onlineNodes: number, connections: number, bandwidth: number) {
    try {
        const now = new Date();
        const timestamp = now.toISOString();

        // 获取当前历史数据
        const currentHistory = await getStatsHistory(db);

        // 添加新数据点（144个点 = 24小时，每10分钟一个点）
        const maxPoints = 144;

        // 更新在线节点历史
        const newOnlineNodesHistory = [
            ...currentHistory.online_nodes.slice(-(maxPoints - 1)),
            {value: onlineNodes, timestamp}
        ];

        // 更新连接数历史
        const newConnectionsHistory = [
            ...currentHistory.connections.slice(-(maxPoints - 1)),
            {value: connections, timestamp}
        ];

        // 更新带宽历史
        const newBandwidthHistory = [
            ...currentHistory.bandwidth.slice(-(maxPoints - 1)),
            {value: bandwidth, timestamp}
        ];

        // 更新数据库
        await db.prepare(
            'UPDATE confs SET setting_value = ?, updated_at = ? WHERE setting_key = ?'
        ).bind(JSON.stringify(newOnlineNodesHistory), timestamp, 'stats_online_nodes_history').run();

        await db.prepare(
            'UPDATE confs SET setting_value = ?, updated_at = ? WHERE setting_key = ?'
        ).bind(JSON.stringify(newConnectionsHistory), timestamp, 'stats_connections_history').run();

        await db.prepare(
            'UPDATE confs SET setting_value = ?, updated_at = ? WHERE setting_key = ?'
        ).bind(JSON.stringify(newBandwidthHistory), timestamp, 'stats_bandwidth_history').run();

        await db.prepare(
            'UPDATE confs SET setting_value = ?, updated_at = ? WHERE setting_key = ?'
        ).bind(timestamp, timestamp, 'stats_last_update').run();

        return true;
    } catch (error) {
        console.error('更新统计历史数据错误:', error);
        return false;
    }
}

// ============================================================
// 方案A：监控服务批量上报端点（由 health-check-cli batch 模式调用）
// ============================================================
api.post('/monitor/report', async (c) => {
    try {
        // 验证 JWT 令牌（需要管理员权限）
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({error: '未授权'}, 401);
        }
        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, c.env.JWT_SECRET);
        if (!payload || !payload.is_admin) {
            return c.json({error: '需要管理员权限'}, 403);
        }

        const data: MonitorReportRequest = await c.req.json();
        if (!data.results || !Array.isArray(data.results)) {
            return c.json({error: '缺少 results 字段'}, 400);
        }

        const now = new Date();
        let successCount = 0;
        let failCount = 0;

        for (const result of data.results) {
            try {
                // 通过节点名称和邮箱查找节点
                const node = await c.env.DB.prepare(
                    'SELECT * FROM nodes WHERE node_name = ? AND user_email = ?'
                ).bind(result.node_name, result.email).first();

                if (!node) {
                    console.warn(`[监控上报] 节点不存在: ${result.node_name} (${result.email})`);
                    failCount++;
                    continue;
                }

                // 验证 token
                if (node.report_token !== result.token) {
                    console.warn(`[监控上报] Token验证失败: ${result.node_name}`);
                    failCount++;
                    continue;
                }

                // 更新节点状态
                const isAlwaysOnline = node.always_online === 1;
                const status = (result.is_online || isAlwaysOnline) ? 'online' : 'offline';
                const load = (result.is_online || isAlwaysOnline) ? 2 : 1;
                const newRecentStatus = updateRecentStatus(node.recent_status, load);

                // 离线时不重置 connection_count，保持原值
                const connectionCount = result.is_online
                    ? (result.connection_count || 0)
                    : node.connection_count;

                await c.env.DB.prepare(`
                    UPDATE nodes
                    SET status         = ?,
                        recent_status  = ?,
                        last_report_at = ?,
                        connection_count = ?
                    WHERE id = ?
                `).bind(
                    status,
                    newRecentStatus,
                    now.toISOString(),
                    connectionCount,
                    node.id
                ).run();

                // 如果有延迟信息，尝试更新
                if (result.latency_ms !== undefined) {
                    try {
                        await c.env.DB.prepare(
                            'UPDATE nodes SET monitor_latency_ms = ? WHERE id = ?'
                        ).bind(result.latency_ms, node.id).run();
                    } catch (e) {
                        // 字段可能不存在，忽略
                    }
                }

                successCount++;
            } catch (e) {
                console.error(`[监控上报] 处理节点 ${result.node_name} 失败:`, e);
                failCount++;
            }
        }

        console.log(`[监控上报] 处理完成: 成功 ${successCount}, 失败 ${failCount}`);

        return c.json({
            message: '监控上报处理完成',
            success_count: successCount,
            fail_count: failCount
        });
    } catch (error) {
        console.error('[监控上报] 错误:', error);
        return c.json({error: '监控上报失败'}, 500);
    }
});

// ============================================================
// 方案C：获取节点的 Peer 信息
// ============================================================
api.get('/nodes/:id/peers', async (c) => {
    try {
        const nodeId = c.req.param('id');
        const {results} = await c.env.DB.prepare(
            'SELECT * FROM node_peers WHERE node_id = ? ORDER BY updated_at DESC'
        ).bind(nodeId).all();

        return c.json({peers: results || []});
    } catch (error) {
        console.error('获取节点Peer信息错误:', error);
        return c.json({peers: []});
    }
});

// 方案C：获取节点的路由信息
api.get('/nodes/:id/routes', async (c) => {
    try {
        const nodeId = c.req.param('id');
        const {results} = await c.env.DB.prepare(
            'SELECT * FROM node_routes WHERE node_id = ? ORDER BY updated_at DESC'
        ).bind(nodeId).all();

        return c.json({routes: results || []});
    } catch (error) {
        console.error('获取节点路由信息错误:', error);
        return c.json({routes: []});
    }
});

// ============================================================
// 方案C：内部辅助函数 - 保存 Peer 信息
// ============================================================
async function savePeerInfo(db: any, nodeId: number, peers: PeerInfo[]) {
    try {
        // 先删除该节点的旧 peer 记录
        await db.prepare('DELETE FROM node_peers WHERE node_id = ?').bind(nodeId).run();

        // 插入新的 peer 记录
        for (const peer of peers) {
            await db.prepare(`
                INSERT INTO node_peers (node_id, peer_id, hostname, ipv4, latency_ms, loss_rate, rx_bytes, tx_bytes, conn_type, tunnel_type, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
                nodeId,
                peer.peer_id,
                peer.hostname || null,
                peer.ipv4 || null,
                peer.latency_ms ?? null,
                peer.loss_rate ?? null,
                peer.rx_bytes ?? 0,
                peer.tx_bytes ?? 0,
                peer.conn_type || null,
                peer.tunnel_type || null
            ).run();
        }
    } catch (error) {
        console.error('保存Peer信息失败:', error);
    }
}

// 方案C：内部辅助函数 - 保存路由信息
async function saveRouteInfo(db: any, nodeId: number, routes: RouteInfo[]) {
    try {
        // 先删除该节点的旧路由记录
        await db.prepare('DELETE FROM node_routes WHERE node_id = ?').bind(nodeId).run();

        // 插入新的路由记录
        for (const route of routes) {
            await db.prepare(`
                INSERT INTO node_routes (node_id, peer_id, hostname, ipv4, cost, next_hop_peer_id, proxy_cidrs, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
                nodeId,
                route.peer_id,
                route.hostname || null,
                route.ipv4 || null,
                route.cost ?? 0,
                route.next_hop_peer_id || null,
                route.proxy_cidrs ? JSON.stringify(route.proxy_cidrs) : null
            ).run();
        }
    } catch (error) {
        console.error('保存路由信息失败:', error);
    }
}

// ============================================================
// EdgeOne 云函数检测路由（一体化部署模式）
// ============================================================

// EdgeOne API Key 鉴权中间件
api.use('/edgeone/*', async (c, next) => {
    const apiKey = c.req.header('X-API-Key');
    if (!verifyEdgeOneApiKey(c.env, apiKey)) {
        return c.json({error: '未授权：API Key 验证失败'}, 401);
    }
    await next();
});

// 单节点检测
api.get('/edgeone/check', async (c) => {
    const server = c.req.query('server');
    const networkName = c.req.query('network_name');
    const networkSecret = c.req.query('network_secret');

    if (!server || !networkName || !networkSecret) {
        return c.json({
            error: '缺少必填参数',
            required: ['server', 'network_name', 'network_secret'],
            example: '/api/edgeone/check?server=tcp://IP:PORT&network_name=xxx&network_secret=xxx',
        }, 400);
    }

    // 一体化模式下，如果配置了 EdgeOne 远程 API，则转发请求
    if (isEdgeOneCheckEnabled(c.env)) {
        const result = await checkNodeViaEdgeOne(c.env, server, networkName, networkSecret);
        return c.json(result);
    }

    // 否则使用本地 TCP 检测
    try {
        // 解析连接地址
        const urlMatch = server.match(/^(tcp|ws|wss):\/\/(.+):(\d+)$/i);
        if (!urlMatch) {
            return c.json({error: '无效的连接地址格式，应为 tcp://IP:PORT 或 ws://IP:PORT 或 wss://IP:PORT'}, 400);
        }

        const [, connType, ip, portStr] = urlMatch;
        const port = parseInt(portStr, 10);

        if (isNaN(port) || port < 1 || port > 65535) {
            return c.json({error: '无效的端口号'}, 400);
        }

        // 使用 TCP 连接检测（复用 index.tsx 中的逻辑）
        const isOnline = await checkTcpConnectionLocal(ip, port, 10000);
        const checkTime = new Date().toISOString();

        const result: EdgeOneCheckResult = {
            is_online: isOnline,
            connection_count: 0, // TCP 检测无法获取连接数
            latency_ms: isOnline ? 0 : -1,
            check_time: checkTime,
            error: isOnline ? undefined : '连接失败',
        };

        return c.json(result);
    } catch (error: any) {
        return c.json({
            is_online: false,
            connection_count: 0,
            latency_ms: -1,
            check_time: new Date().toISOString(),
            error: error.message || '检测失败',
        }, 500);
    }
});

// 批量检测
api.post('/edgeone/batch-check', async (c) => {
    try {
        const body = await c.req.json();
        const nodes = body.nodes;

        if (!nodes || !Array.isArray(nodes)) {
            return c.json({error: '缺少 nodes 字段或格式不正确'}, 400);
        }

        if (nodes.length === 0) {
            return c.json({error: '节点列表不能为空'}, 400);
        }

        if (nodes.length > 20) {
            return c.json({error: '单次批量检测最多支持 20 个节点'}, 400);
        }

        // 验证每个节点的必填参数
        for (const node of nodes) {
            if (!node.server || !node.network_name || !node.network_secret) {
                return c.json({error: '每个节点必须包含 server、network_name、network_secret 字段'}, 400);
            }
        }

        // 一体化模式下，如果配置了 EdgeOne 远程 API，则转发请求
        if (isEdgeOneCheckEnabled(c.env)) {
            const results = await batchCheckViaEdgeOne(c.env, nodes);
            return c.json({results});
        }

        // 否则使用本地 TCP 逐个检测
        const results: EdgeOneCheckResult[] = [];
        const batchSize = 5;

        for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(async (node: any) => {
                    try {
                        const urlMatch = node.server.match(/^(tcp|ws|wss):\/\/(.+):(\d+)$/i);
                        if (!urlMatch) {
                            return {
                                is_online: false,
                                connection_count: 0,
                                latency_ms: -1,
                                check_time: new Date().toISOString(),
                                error: '无效的连接地址格式',
                            } as EdgeOneCheckResult;
                        }

                        const [, , ip, portStr] = urlMatch;
                        const port = parseInt(portStr, 10);
                        const isOnline = await checkTcpConnectionLocal(ip, port, 10000);

                        return {
                            is_online: isOnline,
                            connection_count: 0,
                            latency_ms: isOnline ? 0 : -1,
                            check_time: new Date().toISOString(),
                            error: isOnline ? undefined : '连接失败',
                        } as EdgeOneCheckResult;
                    } catch (error: any) {
                        return {
                            is_online: false,
                            connection_count: 0,
                            latency_ms: -1,
                            check_time: new Date().toISOString(),
                            error: error.message || '检测失败',
                        } as EdgeOneCheckResult;
                    }
                })
            );
            results.push(...batchResults);
        }

        return c.json({results});
    } catch (error: any) {
        return c.json({error: '批量检测失败', detail: error.message}, 500);
    }
});

// 健康状态
api.get('/edgeone/health', async (c) => {
    return c.json({
        status: 'ok',
        service: 'edgeone-check',
        mode: isEdgeOneCheckEnabled(c.env) ? 'remote' : 'local',
        timestamp: new Date().toISOString(),
    });
});

// 本地 TCP 连接检测辅助函数（一体化模式下使用）
async function checkTcpConnectionLocal(ip: string, port: number, timeoutMs: number = 5000): Promise<boolean> {
    try {
        // 动态导入 cloudflare:sockets（仅在 Cloudflare Workers 环境可用）
        const {connect} = await import('cloudflare:sockets');
        const socket = connect({hostname: ip, port: port});

        const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), timeoutMs);
        });

        const connectPromise = (async () => {
            try {
                const writer = socket.writable.getWriter();
                await writer.close();
                return true;
            } catch {
                return false;
            }
        })();

        const result = await Promise.race([connectPromise, timeoutPromise]);
        try { socket.close(); } catch {}
        return result as boolean;
    } catch {
        return false;
    }
}

export default api;
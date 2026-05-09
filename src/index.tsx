import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {renderer} from './renderer'
import type {Env} from './types'
import {isEdgeOneCheckEnabled, checkNodeViaEdgeOne, batchCheckViaEdgeOne, verifyEdgeOneApiKey, type EdgeOneCheckResult} from './edgeone'
import auth from './routes/auth'
import nodes from './routes/nodes'
import api from './routes/api'
import system from './routes/system'
import HomeIndex from './components/HomeIndex'
import UserLogin from './components/UserLogin'
import UserSetup from './components/UserSetup'
import UserNodes from './components/UserNodes'
import UserToken from './components/UserToken'
import UserEmail from './components/UserEmail'
import UserReset from './components/UserReset'
import WaitEmail from './components/WaitEmail'
import HostNodes from './components/HostNodes'
import HostSetup from './components/HostSetup'
import HostAdmin from './components/HostAdmin'
import ApiDocs from './components/ApiDocs'
import {sendEmail, sendWxPusherNotification, sendTelegramNotification, generateOfflineNotificationContent} from './utils'
export type Bindings = {}
export const app = new Hono<{ Bindings: Env }>()

// 启用 CORS
app.use('/*', cors())

// API 路由
app.route('/api/auth', auth)
app.route('/api/nodes', nodes)
app.route('/api/system', system)
app.route('/api', api)

// 前端页面路由
app.use(renderer)

app.get('/', (c) => {
    return c.render(<HomeIndex/>)
})

app.get('/login', (c) => {
    return c.render(<UserLogin/>)
})

app.get('/register', (c) => {
    return c.render(<UserSetup/>)
})

app.get('/dashboard', (c) => {
    return c.render(<UserNodes/>)
})

app.get('/usertoken', (c) => {
    return c.render(<UserToken/>)
})

app.get('/admin', (c) => {
    return c.render(<HostNodes/>)
})

app.get('/initialize', (c) => {
    return c.render(<HostSetup/>)
})

app.get('/settings', (c) => {
    return c.render(<HostAdmin/>)
})

app.get('/api-docs', (c) => {
    return c.render(<ApiDocs/>)
})

app.get('/verify', (c) => {
    return c.render(<UserEmail/>)
})

app.get('/verify-required', (c) => {
    return c.render(<WaitEmail/>)
})

app.get('/reset-password', (c) => {
    return c.render(<UserReset/>)
})

app.get('/cron', async (c) => {
    const startTime = Date.now();

    // 执行完整定时任务（含健康检查），返回检测报告
    const healthReport = await scheduled(null, c.env, c);

    const elapsed = Date.now() - startTime;

    const lines: string[] = [];
    lines.push('=== Cron Job Executed ===');
    lines.push(`Time: ${new Date().toISOString()}`);
    lines.push(`Duration: ${elapsed}ms`);
    lines.push('');
    lines.push('=== TCP Health Check Report ===');
    lines.push(`Total nodes: ${healthReport.total}`);
    lines.push(`Checked: ${healthReport.checked}`);
    lines.push(`Online: ${healthReport.online}`);
    lines.push(`Offline: ${healthReport.offline}`);
    lines.push(`Skipped: ${healthReport.skipped}`);
    lines.push('');
    lines.push('--- Details ---');
    for (const d of healthReport.details) {
        lines.push(`[${d.nodeId}] ${d.nodeName} | ${d.target} | ${d.result}`);
    }

    return c.text(lines.join('\n'));
})

app.get('/health-check', async (c) => {
    const startTime = Date.now();
    const report = await checkNodesHealth(c.env);
    const elapsed = Date.now() - startTime;

    return c.json({
        duration_ms: elapsed,
        timestamp: new Date().toISOString(),
        summary: {
            total: report.total,
            checked: report.checked,
            online: report.online,
            offline: report.offline,
            skipped: report.skipped
        },
        details: report.details
    });
})

// 更新统计历史数据的辅助函数
async function updateStatsHistory(db: any, onlineNodes: number, connections: number, bandwidth: number, tierband: number) {
    try {
        const now = new Date();
        const timestamp = now.toISOString();

        // 获取当前历史数据
        const currentHistory = await getStatsHistory(db);

        // 添加新数据点（1008个点 = 7天，每10分钟一个点）
        const maxPoints = 1008;

        // 更新在线节点历史 - 改为简单数组格式
        const newOnlineNodesHistory = [
            ...currentHistory.online_nodes.slice(-(maxPoints - 1)),
            onlineNodes
        ];

        // 更新连接数历史 - 改为简单数组格式
        const newConnectionsHistory = [
            ...currentHistory.connections.slice(-(maxPoints - 1)),
            connections
        ];

        // 更新带宽历史 - 改为简单数组格式
        const newBandwidthHistory = [
            ...currentHistory.bandwidth.slice(-(maxPoints - 1)),
            bandwidth
        ];

        // 更新阶梯带宽历史 - 改为简单数组格式
        const newTierbandHistory = [
            ...currentHistory.tierband.slice(-(maxPoints - 1)),
            tierband
        ];

// 更新数据库 - 存储为简单数组格式
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
        ).bind(JSON.stringify(newTierbandHistory), timestamp, 'stats_tierband_history').run();

        await db.prepare(
            'UPDATE confs SET setting_value = ?, updated_at = ? WHERE setting_key = ?'
        ).bind(timestamp, timestamp, 'stats_last_update').run();

        return true;
    } catch (error) {
        console.error('更新统计历史数据错误:', error);
        return false;
    }
}

// 获取统计历史数据的辅助函数
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

// TCP 连接检测：尝试建立 TCP 连接来判断节点是否在线
async function checkTcpConnection(ip: string, port: number, timeoutMs: number = 5000): Promise<boolean> {
    try {
        // 动态导入 cloudflare:sockets（仅在 Cloudflare Workers 环境可用，EdgeOne 环境不可用）
        const {connect} = await import('cloudflare:sockets');
        const socket = connect({hostname: ip, port: port});

        // 设置超时
        const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), timeoutMs);
        });

        const connectPromise = (async () => {
            try {
                // 尝试写入一些数据来确认连接建立
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

// 批量检测节点 TCP 连接状态
interface HealthCheckResult {
    total: number;
    checked: number;
    online: number;
    offline: number;
    skipped: number;
    details: {nodeName: string; nodeId: number; target: string; result: string}[];
}

async function checkNodesHealth(env: Env): Promise<HealthCheckResult> {
    const useEdgeOne = isEdgeOneCheckEnabled(env);
    console.log(`[健康检测] 开始${useEdgeOne ? ' EdgeOne 云函数' : ' TCP 连接'}检测`);
    const report: HealthCheckResult = {total: 0, checked: 0, online: 0, offline: 0, skipped: 0, details: []};

    try {
        // 查询所有启用的节点（EdgeOne 模式需要额外查询 network_name 和 network_token）
        const selectFields = useEdgeOne
            ? `id, node_name, connections, status, always_online, network_name, network_token`
            : `id, node_name, connections, status, always_online`;

        const {results: nodesToCheck} = await env.DB.prepare(
            `SELECT ${selectFields} FROM nodes WHERE is_enabled = 1`
        ).all();

        if (!nodesToCheck || nodesToCheck.length === 0) {
            console.log('[健康检测] 无需检测的节点');
            return report;
        }

        report.total = nodesToCheck.length;

        // 先处理 always_online 节点（不做检测）
        const normalNodes: any[] = [];
        for (const node of nodesToCheck as any[]) {
            if (node.always_online === 1) {
                report.checked++;
                report.online++;
                report.details.push({nodeName: node.node_name, nodeId: node.id, target: '(always_online)', result: '📌 always online'});
                continue;
            }
            normalNodes.push(node);
        }

        if (useEdgeOne) {
            // EdgeOne 云函数检测模式
            const edgeOneNodes: { nodeId: number; nodeName: string; server: string; network_name: string; network_secret: string }[] = [];
            const skippedNodes: any[] = [];

            for (const node of normalNodes) {
                let connections: any[];
                try {
                    connections = JSON.parse(node.connections);
                } catch {
                    skippedNodes.push(node);
                    continue;
                }

                // 找到可用的连接地址
                const tcpConn = connections.find((c: any) => c.type === 'TCP');
                const wsConn = !tcpConn ? connections.find((c: any) => c.type === 'WS' || c.type === 'WSS') : null;
                const conn = tcpConn || wsConn;

                if (!conn) {
                    skippedNodes.push(node);
                    continue;
                }

                const server = `${conn.type.toLowerCase()}://${conn.ip}:${conn.port}`;
                const networkName = node.network_name || '';
                const networkSecret = node.network_token || '';

                if (!networkName) {
                    skippedNodes.push(node);
                    continue;
                }

                edgeOneNodes.push({
                    nodeId: node.id,
                    nodeName: node.node_name,
                    server,
                    network_name: networkName,
                    network_secret: networkSecret,
                });
            }

            // 处理跳过的节点
            for (const node of skippedNodes) {
                report.checked++;
                report.skipped++;
                report.details.push({nodeName: node.node_name, nodeId: node.id, target: '(no TCP/WS or no network_name)', result: 'skipped'});
            }

            // 批量通过 EdgeOne 检测
            if (edgeOneNodes.length > 0) {
                console.log(`[EdgeOne检测] 批量检测 ${edgeOneNodes.length} 个节点`);
                const checkResults = await batchCheckViaEdgeOne(env, edgeOneNodes.map(n => ({
                    server: n.server,
                    network_name: n.network_name,
                    network_secret: n.network_secret,
                })));

                for (let i = 0; i < edgeOneNodes.length; i++) {
                    const node = edgeOneNodes[i];
                    const result = checkResults[i] || {is_online: false, connection_count: 0, latency_ms: -1, error: '无检测结果'};
                    report.checked++;

                    if (result.is_online) {
                        report.online++;
                        report.details.push({nodeName: node.nodeName, nodeId: node.nodeId, target: node.server, result: `✅ online (EdgeOne, ${result.latency_ms}ms, ${result.connection_count} conns)`});
                        // 更新状态和上报时间、连接数
                        await env.DB.prepare(
                            `UPDATE nodes SET status = 'online', last_report_at = ?, connection_count = ? WHERE id = ? AND status = 'offline'`
                        ).bind(new Date().toISOString(), result.connection_count, node.nodeId).run();
                    } else {
                        report.offline++;
                        const errorInfo = result.error ? ` (${result.error})` : '';
                        report.details.push({nodeName: node.nodeName, nodeId: node.nodeId, target: node.server, result: `❌ offline (EdgeOne)${errorInfo}`});
                        // 仅更新状态为离线，不重置连接数和带宽信息
                        await env.DB.prepare(
                            `UPDATE nodes SET status = 'offline' WHERE id = ? AND status = 'online'`
                        ).bind(node.nodeId).run();
                    }
                }
            }
        } else {
            // TCP 直连检测模式（原有逻辑）
            const batchSize = 5;
            for (let i = 0; i < normalNodes.length; i += batchSize) {
                const batch = normalNodes.slice(i, i + batchSize);
                const results = await Promise.allSettled(batch.map(async (node: any) => {
                    let connections: any[];
                    try {
                        connections = JSON.parse(node.connections);
                    } catch {
                        return {nodeId: node.id, nodeName: node.node_name, target: '(invalid connections)', isOnline: false as boolean | null};
                    }

                    // 找到第一个 TCP 类型的连接进行检测
                    const tcpConn = connections.find((c: any) => c.type === 'TCP');
                    if (!tcpConn) {
                        // 没有 TCP 连接，尝试 WS/WSS（也是基于 TCP 的）
                        const wsConn = connections.find((c: any) => c.type === 'WS' || c.type === 'WSS');
                        if (!wsConn) {
                            // 无可检测的连接类型，跳过（保持当前状态不变）
                            return {nodeId: node.id, nodeName: node.node_name, target: '(no TCP/WS)', isOnline: null as boolean | null};
                        }
                        const target = `${wsConn.type}://${wsConn.ip}:${wsConn.port}`;
                        const isOnline = await checkTcpConnection(wsConn.ip, wsConn.port, 5000);
                        return {nodeId: node.id, nodeName: node.node_name, target, isOnline: isOnline as boolean | null};
                    }

                    const target = `TCP://${tcpConn.ip}:${tcpConn.port}`;
                    const isOnline = await checkTcpConnection(tcpConn.ip, tcpConn.port, 5000);
                    return {nodeId: node.id, nodeName: node.node_name, target, isOnline: isOnline as boolean | null};
                }));

                // 处理检测结果
                for (const result of results) {
                    if (result.status === 'fulfilled') {
                        const {nodeId, nodeName, target, isOnline} = result.value;
                        report.checked++;

                        if (isOnline === null) {
                            report.skipped++;
                            report.details.push({nodeName, nodeId, target, result: 'skipped'});
                            continue;
                        }

                        if (isOnline) {
                            report.online++;
                            report.details.push({nodeName, nodeId, target, result: '✅ online'});
                            // 如果检测到在线，更新状态和上报时间
                            await env.DB.prepare(
                                `UPDATE nodes SET status = 'online', last_report_at = ? WHERE id = ? AND status = 'offline'`
                            ).bind(new Date().toISOString(), nodeId).run();
                        } else {
                            report.offline++;
                            report.details.push({nodeName, nodeId, target, result: '❌ offline'});
                            // 如果检测到离线，更新状态（保留原有的连接数和带宽信息）
                            await env.DB.prepare(
                                `UPDATE nodes SET status = 'offline' WHERE id = ? AND status = 'online'`
                            ).bind(nodeId).run();
                        }
                    }
                }
            }
        }

        console.log(`[健康检测] 检测完成: 共检测 ${report.checked} 个节点, 在线 ${report.online}, 离线 ${report.offline}`);
    } catch (error) {
        console.error('[健康检测] 检测出错:', error);
    }
    return report;
}

export async function scheduled(event: any, env: Env, ctx: any): Promise<HealthCheckResult> {
    console.log('[定时任务] 开始执行统计数据更新任务');
    let healthReport: HealthCheckResult = {total: 0, checked: 0, online: 0, offline: 0, skipped: 0, details: []};

    try {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        // 0. 先执行 TCP 连接健康检测（在标记离线之前，通过实际探测更新状态）
        healthReport = await checkNodesHealth(env);

        // 1. 检查并更新离线节点（10分钟未上报）
        // 先查询即将下线的节点，用于发送通知
        const {results: offlineNodes} = await env.DB.prepare(
            `SELECT n.*, u.email, u.qq_number, u.wechat_uid, u.telegram_id
             FROM nodes n
             LEFT JOIN users u ON n.user_email = u.email
             WHERE n.status = 'online'
               AND n.is_enabled = 1
               AND n.always_online != 1
               AND n.last_report_at < ?`
        ).bind(tenMinutesAgo.toISOString()).all();

        console.log(`[定时任务] 发现 ${offlineNodes.length} 个节点即将下线`);

        // 更新节点状态为离线（保留原有的连接数和带宽信息）
        const offlineResult = await env.DB.prepare(
            `UPDATE nodes
             SET status            = 'offline'
             WHERE status = 'online'
               AND is_enabled = 1
               AND always_online != 1
               AND last_report_at < ?`
        ).bind(tenMinutesAgo.toISOString()).run();

        console.log(`[定时任务] 更新了 ${offlineResult.meta.changes} 个离线节点`);

        // 2. 发送节点下线通知
        if (offlineNodes.length > 0) {
            await sendOfflineNotifications(env, offlineNodes);
        }

        // 2. 获取当前统计数据
        const totalNodes = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM nodes WHERE is_enabled = 1'
        ).first();

        const onlineNodes = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM nodes WHERE status = ? AND is_enabled = 1'
        ).bind('online').first();

        const connectionsSums = await env.DB.prepare(
            'SELECT SUM(connection_count) as connection_total FROM nodes WHERE is_enabled = 1'
        ).first();

        const bandwidthSums = await env.DB.prepare(
            'SELECT SUM(current_bandwidth) as bandwidth_total FROM nodes WHERE is_enabled = 1'
        ).first();

        const tierbandSums = await env.DB.prepare(
            'SELECT SUM(tier_bandwidth) as tierband_total FROM nodes WHERE is_enabled = 1'
        ).first();

        const onlineNodesCount = onlineNodes?.count || 0;
        const connectionsCount = connectionsSums?.connection_total || 0;
        const bandwidthTotal = bandwidthSums?.bandwidth_total || 0;
        const tierbandTotal = tierbandSums?.tierband_total || 0;

        // 3. 更新历史统计数据
        await updateStatsHistory(env.DB, onlineNodesCount, connectionsCount, bandwidthTotal, tierbandTotal);

        console.log(`[定时任务] 统计数据更新完成: 在线节点=${onlineNodesCount}, 连接数=${connectionsCount}, 带宽=${bandwidthTotal}Mbps, 阶梯带宽=${tierbandTotal}Mbps`);
    } catch (error) {
        console.error('[定时任务] 执行统计数据更新时发生错误:', error);
    }
    return healthReport;
}

// 发送节点下线通知
async function sendOfflineNotifications(env: Env, offlineNodes: any[]) {
    console.log('[下线通知] 开始处理节点下线通知');

    // 获取系统配置
    const siteUrl = await env.DB.prepare(
        'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('site_url').first();

    const resendApiKey = await env.DB.prepare(
        'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('resend_api_key').first();

    const resendFromEmail = await env.DB.prepare(
        'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('resend_from_email').first();

    const telegramBotToken = await env.DB.prepare(
        'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('telegram_bot_token').first();

    const wxpusherAppToken = await env.DB.prepare(
        'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('wxpusher_app_token').first();

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const node of offlineNodes) {
        try {
            // 检查通知选项
            if (!node.offline_notify || node.offline_notify === 0) {
                console.log(`[下线通知] 节点 ${node.node_name} 未启用下线通知`);
                continue;
            }

            // 检查是否在1小时内已发送过通知（避免频繁通知）
            if (node.last_offline_notify_at) {
                const lastNotifyTime = new Date(node.last_offline_notify_at);
                if (lastNotifyTime > oneHourAgo) {
                    console.log(`[下线通知] 节点 ${node.node_name} 在1小时内已发送过通知，跳过`);
                    continue;
                }
            }

            // 生成通知内容
            const regionText = node.region_type === 'domestic' ? '国内' : '海外';
            const regionDetail = node.region_detail ? ` - ${node.region_detail}` : '';
            const notificationContent = generateOfflineNotificationContent(
                node.node_name,
                `${regionText}${regionDetail}`,
                now.toLocaleString('zh-CN'),
                siteUrl?.setting_value || 'https://example.com'
            );

            let notificationSent = false;

            // 根据通知选项发送通知
            if (node.offline_notify === 1 && node.wechat_uid && wxpusherAppToken?.setting_value) {
                // 发送微信通知
                console.log(`[下线通知] 向用户 ${node.email} 发送微信通知`);
                const result = await sendWxPusherNotification(
                    wxpusherAppToken.setting_value,
                    node.wechat_uid,
                    notificationContent.text,
                    '节点下线通知',
                    siteUrl?.setting_value || ''
                );
                if (result.success) {
                    console.log(`[下线通知] 微信通知发送成功: ${node.node_name}`);
                    notificationSent = true;
                } else {
                    console.error(`[下线通知] 微信通知发送失败: ${result.error}`);
                }
            } else if (node.offline_notify === 2 && resendApiKey?.setting_value && resendFromEmail?.setting_value) {
                // 发送邮件通知
                console.log(`[下线通知] 向用户 ${node.email} 发送邮件通知`);
                const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>节点下线通知</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
                                <h1>节点下线通知</h1>
                            </div>
                            <div style="background: #f8f9fa; padding: 20px; margin-top: 20px;">
                                <p><strong>节点名称：</strong>${node.node_name}</p>
                                <p><strong>节点地区：</strong>${regionText}${regionDetail}</p>
                                <p><strong>下线时间：</strong>${now.toLocaleString('zh-CN')}</p>
                                <p style="margin-top: 20px;">您的节点已超过10分钟未上报数据，系统已将其标记为离线状态。</p>
                                <p>请及时检查节点运行状态。</p>
                                <p style="margin-top: 20px;">
                                    <a href="${siteUrl?.setting_value || ''}/dashboard" 
                                       style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                                        查看节点详情
                                    </a>
                                </p>
                            </div>
                            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                                <p>这是一封自动发送的通知邮件，请勿回复。</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;
                const result = await sendEmail(
                    resendApiKey.setting_value,
                    resendFromEmail.setting_value,
                    node.email,
                    `节点下线通知 - ${node.node_name}`,
                    emailHtml
                );
                if (result.success) {
                    console.log(`[下线通知] 邮件通知发送成功: ${node.node_name}`);
                    notificationSent = true;
                } else {
                    console.error(`[下线通知] 邮件通知发送失败: ${result.error}`);
                }
            } else if (node.offline_notify === 3 && node.telegram_id && telegramBotToken?.setting_value) {
                // 发送Telegram通知
                console.log(`[下线通知] 向用户 ${node.email} 发送Telegram通知`);
                const result = await sendTelegramNotification(
                    telegramBotToken.setting_value,
                    node.telegram_id,
                    notificationContent.html,
                    'HTML'
                );
                if (result.success) {
                    console.log(`[下线通知] Telegram通知发送成功: ${node.node_name}`);
                    notificationSent = true;
                } else {
                    console.error(`[下线通知] Telegram通知发送失败: ${result.error}`);
                }
            }

            // 更新最后通知时间
            if (notificationSent) {
                await env.DB.prepare(
                    'UPDATE nodes SET last_offline_notify_at = ? WHERE id = ?'
                ).bind(now.toISOString(), node.id).run();
            }
        } catch (error) {
            console.error(`[下线通知] 处理节点 ${node.node_name} 通知时出错:`, error);
        }
    }

    console.log('[下线通知] 节点下线通知处理完成');
}

export default app
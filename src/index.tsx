import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {renderer} from './renderer'
import type {Env} from './types'
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
    await scheduled(null, c.env, c);
    return c.text('Cron job executed successfully');
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

export async function scheduled(event: any, env: Env, ctx: any): Promise<void> {
    console.log('[定时任务] 开始执行统计数据更新任务');

    try {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        // 1. 检查并更新离线节点（10分钟未上报）
        // 先查询即将下线的节点，用于发送通知
        const {results: offlineNodes} = await env.DB.prepare(
            `SELECT n.*, u.email, u.qq_number, u.wechat_uid, u.telegram_id
             FROM nodes n
             LEFT JOIN users u ON n.user_email = u.email
             WHERE n.status = 'online'
               AND n.is_enabled = 1
               AND n.last_report_at < ?`
        ).bind(tenMinutesAgo.toISOString()).all();

        console.log(`[定时任务] 发现 ${offlineNodes.length} 个节点即将下线`);

        // 更新节点状态为离线
        const offlineResult = await env.DB.prepare(
            `UPDATE nodes
             SET status            = 'offline',
                 connection_count  = 0,
                 current_bandwidth = 0
             WHERE status = 'online'
               AND is_enabled = 1
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
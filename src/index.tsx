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
import EmailVerificationRequired from './components/EmailVerificationRequired'
import HostNodes from './components/HostNodes'
import HostSetup from './components/HostSetup'
import HostAdmin from './components/HostAdmin'

const app = new Hono<{ Bindings: Env }>()

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

app.get('/verify', (c) => {
    return c.render(<UserEmail/>)
})

app.get('/verify-required', (c) => {
    return c.render(<EmailVerificationRequired/>)
})

app.get('/reset-password', (c) => {
    return c.render(<UserReset/>)
})

app.get('/cron', async (c) => {
    await scheduled(null, c.env, c);
    return c.text('Cron job executed successfully');
})

// Cloudflare Workers 定时任务处理函数
export async function scheduled(event: any, env: Env, ctx: any): Promise<void> {
    console.log('[定时任务] 开始执行统计数据更新任务');

    try {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

        // 1. 检查并更新离线节点（10分钟未上报）
        const offlineResult = await env.DB.prepare(
            `UPDATE nodes
             SET status = 'offline',
                 connection_count = 0,
                 current_bandwidth = 0
             WHERE status = 'online'
               AND last_report_at < ?`
        ).bind(tenMinutesAgo.toISOString()).run();

        console.log(`[定时任务] 更新了 ${offlineResult.meta.changes} 个离线节点`);

        // 2. 获取当前统计数据
        const totalNodes = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM nodes'
        ).first();

        const onlineNodes = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM nodes WHERE status = ?'
        ).bind('online').first();

        const connectionsSums = await env.DB.prepare(
            'SELECT SUM(connection_count) as connection_total FROM nodes'
        ).first();

        const bandwidthSums = await env.DB.prepare(
            'SELECT SUM(current_bandwidth) as bandwidth_total FROM nodes'
        ).first();

        const tierbandSums = await env.DB.prepare(
            'SELECT SUM(tier_bandwidth) as tierband_total FROM nodes'
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

// 更新统计历史数据的辅助函数
async function updateStatsHistory(db: any, onlineNodes: number, connections: number, bandwidth: number, tierband: number) {
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

        // 更新阶梯带宽历史
        const newTierbandHistory = [
            ...currentHistory.tierband.slice(-(maxPoints - 1)),
            {value: tierband, timestamp}
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

export default app
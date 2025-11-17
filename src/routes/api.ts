import { Hono } from 'hono';
import type { Env, NodeDB, NodeReportRequest, NodeQueryRequest } from '../types';
import { 
  updateRecentStatus, 
  calculateDailyTrafficPerUser, 
  calculateBandwidthPerUser 
} from '../utils';

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
      return c.json({ error: '缺少必填字段' }, 400);
    }
    
    // 获取节点信息（通过节点名称和用户邮箱）
    const node = await c.env.DB.prepare(
      'SELECT * FROM nodes WHERE node_name = ? AND user_email = ?'
    ).bind(data.node_name, data.email).first<NodeDB>();
    
    if (!node) {
      return c.json({ error: '节点不存在' }, 404);
    }
    
    // 验证token
    if (node.report_token !== data.token) {
      return c.json({ error: 'Token验证失败' }, 403);
    }
    
    // 检查节点是否过期
    const now = new Date();
    const validUntil = new Date(node.valid_until);
    if (now > validUntil) {
      return c.json({ error: '节点已过期' }, 403);
    }
    
    // 检查是否需要重置流量（按每月重置日期 0-31）
    const resetDate = new Date(node.reset_date);
    let newUsedTraffic = node.used_traffic + data.reported_traffic;
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
    if (data.status === 'offline') {
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
    const updateSql = `
      UPDATE nodes SET
        current_bandwidth = ?,
        used_traffic = ?,
        reset_date = ?,
        connection_count = ?,
        status = ?,
        recent_status = ?,
        last_report_at = ?${updateTierBandwidth ? ',\n        tier_bandwidth = ?' : ''}
      WHERE id = ?
    `;
    const bindings = [
      data.current_bandwidth,
      newUsedTraffic,
      newResetDate,
      data.connection_count,
      data.status,
      newRecentStatus,
      now.toISOString(),
    ];
    if (updateTierBandwidth) bindings.push(data.tier_bandwidth);
    bindings.push(node.id);

    await c.env.DB.prepare(updateSql).bind(...bindings).run();
    
    return c.json({ 
      message: '上报成功',
      used_traffic: newUsedTraffic,
      max_traffic: node.max_traffic,
      reset_date: newResetDate
    });
  } catch (error) {
    console.error('节点上报错误:', error);
    return c.json({ error: '上报失败' }, 500);
  }
});

// 客户端查询节点
api.post('/query', async (c) => {
  try {
    const data: NodeQueryRequest = await c.req.json();
    
    // 构建查询条件
    let query = 'SELECT * FROM nodes WHERE status = ? AND valid_until > ?';
    const params: any[] = ['online', new Date().toISOString()];
    
    // 地域筛选
    if (data.region && data.region !== 'all') {
      query += ' AND region_type = ?';
      params.push(data.region);
    }
    
    // 中转筛选
    if (data.relay_only) {
      query += ' AND allow_relay = 1';
    }
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all<NodeDB>();
    
    if (results.length === 0) {
      return c.json({ nodes: [] });
    }
    
    // 根据优先级排序
    let sortedNodes = results.map(node => {
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
        // 延迟优先：这里简化处理，实际应该根据客户端 IP 计算距离
        // 暂时使用连接数作为参考（连接数少的可能延迟更低）
        score = node.max_connections - node.connection_count;
      }
      
      return {
        ...node,
        connections,
        score
      };
    });
    
    // 按分数降序排序
    sortedNodes.sort((a, b) => b.score - a.score);
    
    // 返回前 10 个节点
    const topNodes = sortedNodes.slice(0, 10).map(node => ({
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
    
    return c.json({ nodes: topNodes });
  } catch (error) {
    console.error('查询节点错误:', error);
    return c.json({ error: '查询失败' }, 500);
  }
});

// 获取公开节点列表（用于前端展示）
api.get('/public', async (c) => {
  try {
    const showOffline = c.req.query('show_offline') === 'true';
    
    let query = 'SELECT * FROM nodes WHERE valid_until > ?';
    const params: any[] = [new Date().toISOString()];
    
    if (!showOffline) {
      query += ' AND status = ?';
      params.push('online');
    }
    
    query += ' ORDER BY status DESC, created_at DESC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all<NodeDB>();
    
const publicNodes = results.map(node => ({
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
      status: node.status,
      recent_status: node.recent_status,
      allow_relay: node.allow_relay,
      reset_date: node.reset_date
    }));
    
    // 计算在线节点的平均负载和总连接数
    const onlineNodes = results.filter(n => n.status === 'online');
    const totalConnections = onlineNodes.reduce((sum, n) => sum + n.connection_count, 0);
    const avgBandwidth = onlineNodes.length > 0 
      ? onlineNodes.reduce((sum, n) => sum + n.current_bandwidth, 0) / onlineNodes.length 
      : 0;
    const avgTraffic = onlineNodes.length > 0
      ? onlineNodes.reduce((sum, n) => sum + n.used_traffic, 0) / onlineNodes.length
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
    return c.json({ error: '获取节点失败' }, 500);
  }
});

// 获取节点统计信息
api.get('/stats', async (c) => {
  try {
    // 总节点数
    const totalNodes = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM nodes'
    ).first<{ count: number }>();
    
    // 在线节点数
    const onlineNodes = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM nodes WHERE status = ?'
    ).bind('online').first<{ count: number }>();
    
    // 国内节点数
    const domesticNodes = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM nodes WHERE region_type = ?'
    ).bind('domestic').first<{ count: number }>();
    
    // 海外节点数
    const overseasNodes = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM nodes WHERE region_type = ?'
    ).bind('overseas').first<{ count: number }>();
    
    // 在线节点带宽汇总（当前/阶梯/最大）与连接汇总
    const bandwidthSums = await c.env.DB.prepare(
      'SELECT SUM(current_bandwidth) as current_total, SUM(tier_bandwidth) as tier_total, SUM(max_bandwidth) as max_total FROM nodes'
    ).first<{ current_total: number, tier_total: number, max_total: number }>();

    const connectionsSums = await c.env.DB.prepare(
      'SELECT SUM(connection_count) as connection_total, SUM(max_connections) as max_total FROM nodes'
    ).first<{ connection_total: number, max_total: number }>();
    
    return c.json({
      total_nodes: totalNodes?.count || 0,
      online_nodes: onlineNodes?.count || 0,
      domestic_nodes: domesticNodes?.count || 0,
      overseas_nodes: overseasNodes?.count || 0,
      current_bandwidth_total: bandwidthSums?.current_total || 0,
      tier_bandwidth_total: bandwidthSums?.tier_total || 0,
      max_bandwidth_total: bandwidthSums?.max_total || 0,
      connection_count_total: connectionsSums?.connection_total || 0,
      max_connections_total: connectionsSums?.max_total || 0
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    return c.json({ error: '获取统计信息失败' }, 500);
  }
});

export default api;

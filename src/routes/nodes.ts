import { Hono } from 'hono';
import type { Env, Node, NodeDB, NodeCreateRequest, NodeUpdateRequest, JWTPayload } from '../types';
import { authMiddleware, adminMiddleware } from '../utils';

const nodes = new Hono<{ Bindings: Env }>();

// 获取当前用户的所有节点
nodes.get('/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM nodes WHERE user_email = ? ORDER BY created_at DESC'
    ).bind(user.email).all<NodeDB>();
    
    // 将 connections 从字符串转换为对象
    const nodesWithParsedConnections = results.map(node => ({
      ...node,
      connections: JSON.parse(node.connections)
    }));
    
    return c.json({ nodes: nodesWithParsedConnections });
  } catch (error) {
    console.error('获取节点错误:', error);
    return c.json({ error: '获取节点失败' }, 500);
  }
});

// 获取所有节点（管理员）
nodes.get('/all', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM nodes ORDER BY created_at DESC'
    ).all<NodeDB>();
    
    const nodesWithParsedConnections = results.map(node => ({
      ...node,
      connections: JSON.parse(node.connections)
    }));
    
    return c.json({ nodes: nodesWithParsedConnections });
  } catch (error) {
    console.error('获取所有节点错误:', error);
    return c.json({ error: '获取节点失败' }, 500);
  }
});

// 获取单个节点详情
nodes.get('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user') as JWTPayload;
    
    const node = await c.env.DB.prepare(
      'SELECT * FROM nodes WHERE id = ?'
    ).bind(id).first<NodeDB>();
    
    if (!node) {
      return c.json({ error: '节点不存在' }, 404);
    }
    
    // 检查权限：只有节点所有者或管理员可以查看
    if (node.user_email !== user.email && !user.is_admin) {
      return c.json({ error: '无权访问此节点' }, 403);
    }
    
    return c.json({
      node: {
        ...node,
        connections: JSON.parse(node.connections)
      }
    });
  } catch (error) {
    console.error('获取节点详情错误:', error);
    return c.json({ error: '获取节点详情失败' }, 500);
  }
});

// 创建节点
nodes.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const data: NodeCreateRequest = await c.req.json();
    
    // 验证必填字段（具体地区可选）
    if (!data.node_name || !data.region_type ||
        !data.connections || data.connections.length === 0) {
      return c.json({ error: '缺少必填字段' }, 400);
    }
    
    // 计算首次重置日期（每月重置日 0-31）
    const now = new Date();
    const computeNextMonthlyReset = (from: Date, day: number): string => {
      const y = from.getUTCFullYear();
      const m = from.getUTCMonth();
      // 如果本月还未到重置日，则设为本月，否则设为下月
      const lastDayThisMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const targetDayThisMonth = day === 0 ? lastDayThisMonth : Math.min(day, lastDayThisMonth);
      const candidate = new Date(Date.UTC(y, m, targetDayThisMonth, 0, 0, 0));
      const nextMonth = new Date(Date.UTC(y, m + 1, 1));
      const lastDayNextMonth = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).getUTCDate();
      const targetDayNextMonth = day === 0 ? lastDayNextMonth : Math.min(day, lastDayNextMonth);
      const nextCandidate = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), targetDayNextMonth, 0, 0, 0));
      const firstReset = now <= candidate ? candidate : nextCandidate;
      return firstReset.toISOString();
    };
    const initialResetDate = computeNextMonthlyReset(now, data.reset_cycle ?? 0);
    
    // 生成随机token（32位）
    const reportToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
// 插入节点
    const result = await c.env.DB.prepare(`
      INSERT INTO nodes (
        user_email, node_name, region_type, region_detail, connections,
        tier_bandwidth, max_bandwidth, max_traffic, reset_cycle, reset_date,
        max_connections, tags, valid_until, notes, allow_relay, report_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.email,
      data.node_name,
      data.region_type,
      data.region_detail || '',
      JSON.stringify(data.connections),
      0, // 阶梯带宽由API上报，创建时置0
      (data.max_bandwidth ?? 1),
      (data.max_traffic ?? 0),
      (data.reset_cycle ?? 0),
      initialResetDate,
      (data.max_connections ?? 100),
      data.tags || '',
      data.valid_until,
      data.notes || '',
      data.allow_relay,
      reportToken
    ).run();
    
    return c.json({ 
      message: '节点创建成功',
      node_id: result.meta.last_row_id
    }, 201);
  } catch (error) {
    console.error('创建节点错误:', error);
    return c.json({ error: '创建节点失败' }, 500);
  }
});

// 更新节点
nodes.put('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user') as JWTPayload;
    const data: NodeUpdateRequest = await c.req.json();
    
    // 检查节点是否存在
    const node = await c.env.DB.prepare(
      'SELECT * FROM nodes WHERE id = ?'
    ).bind(id).first<NodeDB>();
    
    if (!node) {
      return c.json({ error: '节点不存在' }, 404);
    }
    
    // 检查权限：只有节点所有者或管理员可以修改
    if (node.user_email !== user.email && !user.is_admin) {
      return c.json({ error: '无权修改此节点' }, 403);
    }
    
    // 构建更新语句
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.node_name !== undefined) {
      updates.push('node_name = ?');
      values.push(data.node_name);
    }
    if (data.region_type !== undefined) {
      updates.push('region_type = ?');
      values.push(data.region_type);
    }
    if (data.region_detail !== undefined) {
      updates.push('region_detail = ?');
      values.push(data.region_detail);
    }
    if (data.connections !== undefined) {
      updates.push('connections = ?');
      values.push(JSON.stringify(data.connections));
    }
    if (data.tier_bandwidth !== undefined) {
      updates.push('tier_bandwidth = ?');
      values.push(data.tier_bandwidth);
    }
    if (data.max_bandwidth !== undefined) {
      updates.push('max_bandwidth = ?');
      values.push(data.max_bandwidth);
    }
    if (data.max_traffic !== undefined) {
      updates.push('max_traffic = ?');
      values.push(data.max_traffic);
    }
    if (data.reset_cycle !== undefined) {
      updates.push('reset_cycle = ?');
      values.push(data.reset_cycle);
      // 重新计算按月的重置日期
      const now = new Date();
      const computeNextMonthlyReset = (from: Date, day: number): string => {
        const y = from.getUTCFullYear();
        const m = from.getUTCMonth();
        const lastDayThisMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        const targetDayThisMonth = day === 0 ? lastDayThisMonth : Math.min(day, lastDayThisMonth);
        const candidate = new Date(Date.UTC(y, m, targetDayThisMonth, 0, 0, 0));
        const nextMonth = new Date(Date.UTC(y, m + 1, 1));
        const lastDayNextMonth = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).getUTCDate();
        const targetDayNextMonth = day === 0 ? lastDayNextMonth : Math.min(day, lastDayNextMonth);
        const nextCandidate = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), targetDayNextMonth, 0, 0, 0));
        const firstReset = from <= candidate ? candidate : nextCandidate;
        return firstReset.toISOString();
      };
      updates.push('reset_date = ?');
      values.push(computeNextMonthlyReset(now, data.reset_cycle));
    }
    if (data.max_connections !== undefined) {
      updates.push('max_connections = ?');
      values.push(data.max_connections);
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      values.push(data.tags);
    }
    if (data.valid_until !== undefined) {
      updates.push('valid_until = ?');
      values.push(data.valid_until);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }
    if (data.allow_relay !== undefined) {
      updates.push('allow_relay = ?');
      values.push(data.allow_relay);
    }
    if (data.correction_traffic !== undefined && user.is_admin) {
      // 只有管理员可以修改修正流量
      updates.push('correction_traffic = ?');
      values.push(data.correction_traffic);
      // 重新计算已用流量
      updates.push('used_traffic = correction_traffic + ?');
      values.push(node.used_traffic - node.correction_traffic);
    }
    
    if (updates.length === 0) {
      return c.json({ error: '没有要更新的字段' }, 400);
    }
    
    values.push(id);
    
    await c.env.DB.prepare(
      `UPDATE nodes SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();
    
    return c.json({ message: '节点更新成功' });
  } catch (error) {
    console.error('更新节点错误:', error);
    return c.json({ error: '更新节点失败' }, 500);
  }
});

// 重新生成节点token
nodes.post('/:id/regenerate-token', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user') as JWTPayload;
    
    // 检查节点是否存在
    const node = await c.env.DB.prepare(
      'SELECT * FROM nodes WHERE id = ?'
    ).bind(id).first<NodeDB>();
    
    if (!node) {
      return c.json({ error: '节点不存在' }, 404);
    }
    
    // 检查权限：只有节点所有者或管理员可以重新生成token
    if (node.user_email !== user.email && !user.is_admin) {
      return c.json({ error: '无权修改此节点' }, 403);
    }
    
    // 生成新的随机token（32位）
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 更新token
    await c.env.DB.prepare(
      'UPDATE nodes SET report_token = ? WHERE id = ?'
    ).bind(newToken, id).run();
    
    return c.json({ 
      message: 'Token重新生成成功',
      token: newToken
    });
  } catch (error) {
    console.error('重新生成token错误:', error);
    return c.json({ error: '重新生成token失败' }, 500);
  }
});

// 删除节点
nodes.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user') as JWTPayload;
    
    // 检查节点是否存在
    const node = await c.env.DB.prepare(
      'SELECT * FROM nodes WHERE id = ?'
    ).bind(id).first<NodeDB>();
    
    if (!node) {
      return c.json({ error: '节点不存在' }, 404);
    }
    
    // 检查权限：只有节点所有者或管理员可以删除
    if (node.user_email !== user.email && !user.is_admin) {
      return c.json({ error: '无权删除此节点' }, 403);
    }
    
    await c.env.DB.prepare(
      'DELETE FROM nodes WHERE id = ?'
    ).bind(id).run();
    
    return c.json({ message: '节点删除成功' });
  } catch (error) {
    console.error('删除节点错误:', error);
    return c.json({ error: '删除节点失败' }, 500);
  }
});

export default nodes;

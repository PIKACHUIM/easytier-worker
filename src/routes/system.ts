import { Hono } from 'hono';
import type { Env, InitializeRequest, SystemSettingsUpdateRequest, UserManageRequest, User, SystemSetting } from '../types';
import { hashPassword, verifyJWT, sendEmail, generateTestEmailContent } from '../utils';

const system = new Hono<{ Bindings: Env }>();

// 检查系统是否已初始化（检查confs表是否存在）
system.get('/check-init', async (c) => {
  try {
    // 尝试查询confs表，如果表不存在则说明未初始化
    const result = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='confs'"
    ).first();
    
    const isInitialized = result !== null;
    
    return c.json({ initialized: isInitialized });
  } catch (error) {
    console.error('检查初始化状态错误:', error);
    // 如果出错，假定未初始化
    return c.json({ initialized: false });
  }
});

// 导入数据库结构并初始化系统（使用JWT密钥验证）
system.post('/import-schema', async (c) => {
  try {
    // 检查confs表是否已存在
    const tableExists = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='confs'"
    ).first();
    
    if (tableExists) {
      return c.json({ error: '系统已经初始化，无法重新导入数据库' }, 400);
    }
    
    const { jwt_secret }: { jwt_secret: string } = await c.req.json();
    
    // 验证JWT密钥
    if (jwt_secret !== c.env.JWT_SECRET) {
      return c.json({ error: 'JWT密钥验证失败' }, 401);
    }

    // 手动构建SQL语句数组，避免分割多行INSERT
    const statements = [
      // 创建用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        is_super_admin INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 创建节点表
      `CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        node_name TEXT NOT NULL,
        region_type TEXT NOT NULL,
        region_detail TEXT NOT NULL,
        connections TEXT NOT NULL,
        current_bandwidth REAL DEFAULT 0,
        tier_bandwidth REAL NOT NULL,
        max_bandwidth REAL NOT NULL,
        used_traffic REAL DEFAULT 0,
        correction_traffic REAL DEFAULT 0,
        max_traffic REAL NOT NULL,
        reset_cycle INTEGER NOT NULL,
        reset_date DATETIME NOT NULL,
        connection_count INTEGER DEFAULT 0,
        max_connections INTEGER NOT NULL,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        valid_until DATETIME NOT NULL,
        status TEXT DEFAULT 'offline',
        recent_status TEXT DEFAULT '',
        notes TEXT,
        allow_relay INTEGER DEFAULT 0,
        last_report_at DATETIME,
        report_token TEXT,
        FOREIGN KEY (user_email) REFERENCES users(email)
      )`,
      // 创建系统设置表
      `CREATE TABLE IF NOT EXISTS confs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 创建索引
      `CREATE INDEX IF NOT EXISTS idx_nodes_user_email ON nodes(user_email)`,
      `CREATE INDEX IF NOT EXISTS idx_nodes_region_type ON nodes(region_type)`,
      `CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status)`,
      `CREATE INDEX IF NOT EXISTS idx_nodes_allow_relay ON nodes(allow_relay)`,
      `CREATE INDEX IF NOT EXISTS idx_confs_key ON confs(setting_key)`,
      // 插入默认系统设置（作为一个完整的语句）
      `INSERT OR IGNORE INTO confs (setting_key, setting_value, description) VALUES
        ('resend_api_key', '', 'Resend API 密钥'),
        ('resend_from_email', 'noreply@example.com', 'Resend 发件人邮箱'),
        ('resend_from_domain', 'example.com', 'Resend 发件域名'),
        ('system_initialized', '0', '系统是否已初始化'),
        ('site_name', 'EasyTier 节点管理系统', '网站名称'),
        ('site_url', 'https://example.com', '网站URL'),
        ('stats_online_nodes_history', '[]', '在线节点历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
        ('stats_connections_history', '[]', '连接数历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
        ('stats_bandwidth_history', '[]', '带宽使用历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
        ('stats_last_update', '', '统计数据最后更新时间')`
    ];
    
    // 使用batch方法批量执行，确保事务性
    const batch = statements.map(statement => c.env.DB.prepare(statement));
    await c.env.DB.batch(batch);
    
    return c.json({ 
      message: '数据库结构导入成功',
      tables_created: ['users', 'nodes', 'confs']
    }, 201);
  } catch (error) {
    console.error('导入数据库错误:', error);
    return c.json({ error: '导入数据库失败: ' + (error as Error).message }, 500);
  }
});

// 初始化系统（导入数据库并创建管理员账户）
system.post('/initialize', async (c) => {
  try {
    // 检查confs表是否已存在
    const tableExists = await c.env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='confs'"
    ).first();
    
    if (tableExists) {
      return c.json({ error: '系统已经初始化' }, 400);
    }
    
    const { jwt_secret, email, password }: InitializeRequest = await c.req.json();
    
    // 验证JWT密钥
    if (jwt_secret !== c.env.JWT_SECRET) {
      return c.json({ error: 'JWT密钥验证失败' }, 401);
    }
    
    // 验证输入
    if (!email || !password) {
      return c.json({ error: '邮箱和密码不能为空' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ error: '密码长度至少为 6 位' }, 400);
    }
    
    // 第一步：导入数据库结构
    const schemaSQL = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  is_super_admin INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 节点表
CREATE TABLE IF NOT EXISTS nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  node_name TEXT NOT NULL,
  region_type TEXT NOT NULL,
  region_detail TEXT NOT NULL,
  connections TEXT NOT NULL,
  current_bandwidth REAL DEFAULT 0,
  tier_bandwidth REAL NOT NULL,
  max_bandwidth REAL NOT NULL,
  used_traffic REAL DEFAULT 0,
  correction_traffic REAL DEFAULT 0,
  max_traffic REAL NOT NULL,
  reset_cycle INTEGER NOT NULL,
  reset_date DATETIME NOT NULL,
  connection_count INTEGER DEFAULT 0,
  max_connections INTEGER NOT NULL,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME NOT NULL,
  status TEXT DEFAULT 'offline',
  recent_status TEXT DEFAULT '',
  notes TEXT,
  allow_relay INTEGER DEFAULT 0,
  last_report_at DATETIME,
  report_token TEXT,
  FOREIGN KEY (user_email) REFERENCES users(email)
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS confs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_nodes_user_email ON nodes(user_email);
CREATE INDEX IF NOT EXISTS idx_nodes_region_type ON nodes(region_type);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_allow_relay ON nodes(allow_relay);
CREATE INDEX IF NOT EXISTS idx_confs_key ON confs(setting_key);

-- 插入默认系统设置
INSERT OR IGNORE INTO confs (setting_key, setting_value, description) VALUES
  ('resend_api_key', '', 'Resend API 密钥'),
  ('resend_from_email', 'noreply@example.com', 'Resend 发件人邮箱'),
  ('resend_from_domain', 'example.com', 'Resend 发件域名'),
  ('system_initialized', '1', '系统是否已初始化'),
  ('site_name', 'EasyTier 节点管理系统', '网站名称'),
  ('site_url', 'https://example.com', '网站URL');
`;
    
    // 手动构建SQL语句数组，避免分割多行INSERT
    const statements = [
      // 创建用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        is_super_admin INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 创建节点表
      `CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        node_name TEXT NOT NULL,
        region_type TEXT NOT NULL,
        region_detail TEXT NOT NULL,
        connections TEXT NOT NULL,
        current_bandwidth REAL DEFAULT 0,
        tier_bandwidth REAL NOT NULL,
        max_bandwidth REAL NOT NULL,
        used_traffic REAL DEFAULT 0,
        correction_traffic REAL DEFAULT 0,
        max_traffic REAL NOT NULL,
        reset_cycle INTEGER NOT NULL,
        reset_date DATETIME NOT NULL,
        connection_count INTEGER DEFAULT 0,
        max_connections INTEGER NOT NULL,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        valid_until DATETIME NOT NULL,
        status TEXT DEFAULT 'offline',
        recent_status TEXT DEFAULT '',
        notes TEXT,
        allow_relay INTEGER DEFAULT 0,
        last_report_at DATETIME,
        report_token TEXT,
        FOREIGN KEY (user_email) REFERENCES users(email)
      )`,
      // 创建系统设置表
      `CREATE TABLE IF NOT EXISTS confs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // 创建索引
      `CREATE INDEX IF NOT EXISTS idx_nodes_user_email ON nodes(user_email)`,
      `CREATE INDEX IF NOT EXISTS idx_nodes_region_type ON nodes(region_type)`,
      `CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status)`,
      `CREATE INDEX IF NOT EXISTS idx_nodes_allow_relay ON nodes(allow_relay)`,
      `CREATE INDEX IF NOT EXISTS idx_confs_key ON confs(setting_key)`,
      // 插入默认系统设置（作为一个完整的语句）
      `INSERT OR IGNORE INTO confs (setting_key, setting_value, description) VALUES
        ('resend_api_key', '', 'Resend API 密钥'),
        ('resend_from_email', 'noreply@example.com', 'Resend 发件人邮箱'),
        ('resend_from_domain', 'example.com', 'Resend 发件域名'),
        ('system_initialized', '1', '系统是否已初始化'),
        ('site_name', 'EasyTier 节点管理系统', '网站名称'),
        ('site_url', 'https://example.com', '网站URL'),
        ('stats_online_nodes_history', '[]', '在线节点历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
        ('stats_connections_history', '[]', '连接数历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
        ('stats_bandwidth_history', '[]', '带宽使用历史数据，JSON数组，每10分钟一个数据点，保存24小时'),
        ('stats_last_update', '', '统计数据最后更新时间')`
    ];
    
    // 使用batch方法批量执行，确保事务性
    const batch = statements.map(statement => c.env.DB.prepare(statement));
    await c.env.DB.batch(batch);
    
    // 第二步：创建超级管理员账户
    const passwordHash = await hashPassword(password);
    
    await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, is_admin, is_super_admin, is_verified) VALUES (?, ?, 1, 1, 1)'
    ).bind(email, passwordHash).run();
    
    return c.json({ 
      message: '系统初始化成功',
      admin_email: email
    }, 201);
  } catch (error) {
    console.error('初始化错误:', error);
    return c.json({ error: '初始化失败' }, 500);
  }
});

// 获取系统设置（需要管理员权限）
system.get('/settings', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '未授权' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    if (!payload || !payload.is_admin) {
      return c.json({ error: '需要管理员权限' }, 403);
    }
    
    // 获取所有系统设置（排除敏感信息）
    const settings = await c.env.DB.prepare(
      'SELECT setting_key, setting_value, description FROM confs WHERE setting_key != ?'
    ).bind('system_initialized').all();
    
    // 转换为对象格式
    const settingsObj: Record<string, string> = {};
    settings.results.forEach((setting: any) => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });
    
    return c.json(settingsObj);
  } catch (error) {
    console.error('获取系统设置错误:', error);
    return c.json({ error: '获取系统设置失败' }, 500);
  }
});

// 更新系统设置（需要管理员权限）
system.put('/settings', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '未授权' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    if (!payload || !payload.is_admin) {
      return c.json({ error: '需要管理员权限' }, 403);
    }
    
    const updates: SystemSettingsUpdateRequest = await c.req.json();
    
    // 更新每个设置
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await c.env.DB.prepare(
          'UPDATE confs SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
        ).bind(value, key).run();
      }
    }
    
    return c.json({ message: '系统设置更新成功' });
  } catch (error) {
    console.error('更新系统设置错误:', error);
    return c.json({ error: '更新系统设置失败' }, 500);
  }
});

// 获取所有用户（需要管理员权限）
system.get('/users', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '未授权' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    if (!payload || !payload.is_admin) {
      return c.json({ error: '需要管理员权限' }, 403);
    }
    
    // 获取所有用户（不包含密码）
    const users = await c.env.DB.prepare(
      'SELECT id, email, is_admin, is_super_admin, is_verified, created_at FROM users ORDER BY created_at DESC'
    ).all();
    
    return c.json(users.results);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return c.json({ error: '获取用户列表失败' }, 500);
  }
});

// 设置用户管理员权限（需要超级管理员权限）
system.put('/users/:email/admin', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '未授权' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    // 只有超级管理员可以设置其他用户为管理员
    if (!payload || !payload.is_super_admin) {
      return c.json({ error: '需要超级管理员权限' }, 403);
    }
    
    const email = c.req.param('email');
    const { is_admin }: UserManageRequest = await c.req.json();
    
    // 检查用户是否存在
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      return c.json({ error: '用户不存在' }, 404);
    }
    
    // 不能修改超级管理员的权限
    if (user.is_super_admin) {
      return c.json({ error: '不能修改超级管理员的权限' }, 403);
    }
    
    // 更新用户管理员权限
    await c.env.DB.prepare(
      'UPDATE users SET is_admin = ? WHERE email = ?'
    ).bind(is_admin ? 1 : 0, email).run();
    
    return c.json({ 
      message: `已${is_admin ? '授予' : '撤销'}用户 ${email} 的管理员权限` 
    });
  } catch (error) {
    console.error('设置用户权限错误:', error);
    return c.json({ error: '设置用户权限失败' }, 500);
  }
});

// 删除用户（需要超级管理员权限）
system.delete('/users/:email', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '未授权' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    if (!payload || !payload.is_super_admin) {
      return c.json({ error: '需要超级管理员权限' }, 403);
    }
    
    const email = c.req.param('email');
    
    // 检查用户是否存在
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) {
      return c.json({ error: '用户不存在' }, 404);
    }
    
    // 不能删除超级管理员
    if (user.is_super_admin) {
      return c.json({ error: '不能删除超级管理员' }, 403);
    }
    
    // 删除用户的所有节点
    await c.env.DB.prepare(
      'DELETE FROM nodes WHERE user_email = ?'
    ).bind(email).run();
    
    // 删除用户
    await c.env.DB.prepare(
      'DELETE FROM users WHERE email = ?'
    ).bind(email).run();
    
    return c.json({ message: `用户 ${email} 已删除` });
  } catch (error) {
    console.error('删除用户错误:', error);
    return c.json({ error: '删除用户失败' }, 500);
  }
});

// 邮件发送测试（需要管理员权限）
system.post('/test-email', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '未授权' }, 401);
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    if (!payload || !payload.is_admin) {
      return c.json({ error: '需要管理员权限' }, 403);
    }
    
    const { email }: { email: string } = await c.req.json();
    
    if (!email) {
      return c.json({ error: '邮箱地址不能为空' }, 400);
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: '邮箱格式不正确' }, 400);
    }
    
    // 获取邮件服务配置
    const resendApiKey = await c.env.DB.prepare(
      'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('resend_api_key').first();
    
    const resendFromEmail = await c.env.DB.prepare(
      'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('resend_from_email').first();
    
    const siteName = await c.env.DB.prepare(
      'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('site_name').first();
    
    const siteUrl = await c.env.DB.prepare(
      'SELECT setting_value FROM confs WHERE setting_key = ?'
    ).bind('site_url').first();
    
// 检查邮件服务配置
    if (!resendApiKey?.setting_value) {
      return c.json({ 
        error: '邮件服务未配置',
        details: '请先在系统设置中配置 Resend API 密钥'
      }, 400);
    }

    if (!resendFromEmail?.setting_value || resendFromEmail.setting_value === 'noreply@example.com') {
      return c.json({ 
        error: '发件人邮箱未正确配置',
        details: '请配置有效的发件人邮箱地址'
      }, 400);
    }

    console.log('[邮件测试] 开始发送测试邮件到:', email);
    console.log('[邮件测试] 配置信息:', {
      hasApiKey: !!resendApiKey.setting_value,
      fromEmail: resendFromEmail.setting_value,
      siteName: siteName?.setting_value,
      siteUrl: siteUrl?.setting_value
    });

    // 使用封装好的 sendEmail 函数
    const subject = `邮件发送测试 - ${siteName?.setting_value || 'EasyTier 节点管理系统'}`;
    const htmlContent = generateTestEmailContent(
      siteName?.setting_value || 'EasyTier 节点管理系统',
      siteUrl?.setting_value || 'https://example.com'
    );
    console.log('[邮件测试] 邮件内容:', htmlContent);
    console.log('[邮件测试] 邮件主题:', subject);
    console.log('[邮件测试] 邮件收件人:', email);
    console.log('[邮件测试] 邮件发件人:', resendFromEmail.setting_value);
    console.log('[邮件测试] 邮件 API 密钥:', resendApiKey.setting_value);
    const emailResult = await sendEmail(
      resendApiKey.setting_value,
      resendFromEmail.setting_value,
      email,
      subject,
      htmlContent
    );

    if (emailResult.success) {
      console.log('[邮件测试] 测试邮件发送成功');
      return c.json({ 
        message: '测试邮件发送成功',
        site_name: siteName?.setting_value,
        details: '请检查邮箱收件箱（包括垃圾邮件文件夹）'
      });
    } else {
      console.error('[邮件测试] 发送测试邮件失败:', emailResult.error);
      return c.json({ 
        error: '邮件发送失败',
        details: emailResult.error || '请检查邮件服务配置'
      }, 400);
    }
    
  } catch (error) {
    console.error('[邮件测试] 发送测试邮件异常:', error);
    return c.json({ 
      error: '邮件发送失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, 500);
  }
});

export default system;

// 定时任务：更新统计数据和节点状态（每10分钟执行）
system.post('/cron/update-stats', async (c) => {
  try {
    // 验证请求来源（简单的cron任务验证）
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${c.env.JWT_SECRET}`) {
      return c.json({ error: '未授权' }, 401);
    }

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // 1. 检查并更新离线节点（10分钟未上报）
    const offlineResult = await c.env.DB.prepare(
      `UPDATE nodes 
       SET status = 'offline', connection_count = 0, current_bandwidth = 0
       WHERE status = 'online' AND last_report_at < ?`
    ).bind(tenMinutesAgo.toISOString()).run();

    console.log(`[定时任务] 更新了 ${offlineResult.meta.changes} 个离线节点`);

    // 2. 获取当前统计数据
    const totalNodes = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM nodes'
    ).first();

    const onlineNodes = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM nodes WHERE status = ?'
    ).bind('online').first();

    const connectionsSums = await c.env.DB.prepare(
      'SELECT SUM(connection_count) as connection_total FROM nodes'
    ).first();

    const bandwidthSums = await c.env.DB.prepare(
      'SELECT SUM(current_bandwidth) as bandwidth_total FROM nodes'
    ).first();

    const onlineNodesCount = onlineNodes?.count || 0;
    const connectionsCount = connectionsSums?.connection_total || 0;
    const bandwidthTotal = bandwidthSums?.bandwidth_total || 0;

    // 3. 更新历史统计数据
    const historyUpdated = await updateStatsHistory(
      c.env.DB,
      onlineNodesCount,
      connectionsCount,
      bandwidthTotal
    );

    console.log(`[定时任务] 统计数据更新完成: 在线节点=${onlineNodesCount}, 连接数=${connectionsCount}, 带宽=${bandwidthTotal}Mbps`);

    return c.json({
      message: '统计数据更新成功',
      offline_nodes_updated: offlineResult.meta.changes,
      current_stats: {
        total_nodes: totalNodes?.count || 0,
        online_nodes: onlineNodesCount,
        connections: connectionsCount,
        bandwidth: bandwidthTotal
      },
      history_updated: historyUpdated
    });
  } catch (error) {
    console.error('[定时任务] 更新统计数据错误:', error);
    return c.json({ error: '更新统计数据失败' }, 500);
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

    return {
      online_nodes: JSON.parse(onlineNodesHistory?.setting_value || '[]'),
      connections: JSON.parse(connectionsHistory?.setting_value || '[]'),
      bandwidth: JSON.parse(bandwidthHistory?.setting_value || '[]')
    };
  } catch (error) {
    console.error('获取统计历史数据错误:', error);
    return {
      online_nodes: [],
      connections: [],
      bandwidth: []
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
      { value: onlineNodes, timestamp }
    ];
    
    // 更新连接数历史
    const newConnectionsHistory = [
      ...currentHistory.connections.slice(-(maxPoints - 1)),
      { value: connections, timestamp }
    ];
    
    // 更新带宽历史
    const newBandwidthHistory = [
      ...currentHistory.bandwidth.slice(-(maxPoints - 1)),
      { value: bandwidth, timestamp }
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
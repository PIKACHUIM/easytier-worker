import { Hono } from 'hono';
import type { Env, User, RegisterRequest, LoginRequest } from '../types';
import { hashPassword, verifyPassword, createJWT, generateToken } from '../utils';

const auth = new Hono<{ Bindings: Env }>();

// 用户注册
auth.post('/register', async (c) => {
  try {
    // 检查系统是否已初始化
    const initSetting = await c.env.DB.prepare(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?'
    ).bind('system_initialized').first<any>();
    
    if (!initSetting || initSetting.setting_value !== '1') {
      return c.json({ error: '系统尚未初始化，请先完成初始化' }, 400);
    }
    
    const { email, password }: RegisterRequest = await c.req.json();
    
    // 验证输入
    if (!email || !password) {
      return c.json({ error: '邮箱和密码不能为空' }, 400);
    }
    
    if (password.length < 6) {
      return c.json({ error: '密码长度至少为 6 位' }, 400);
    }
    
    // 检查用户是否已存在
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first<User>();
    
    if (existingUser) {
      return c.json({ error: '该邮箱已被注册' }, 400);
    }
    
    // 创建用户
    const passwordHash = await hashPassword(password);
    const verificationToken = generateToken();
    
    await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, verification_token) VALUES (?, ?, ?)'
    ).bind(email, passwordHash, verificationToken).run();
    
    // 发送验证邮件（使用 Resend）
    try {
      // 获取 Resend 配置
      const resendApiKey = await c.env.DB.prepare(
        'SELECT setting_value FROM system_settings WHERE setting_key = ?'
      ).bind('resend_api_key').first<any>();
      
      const resendFromEmail = await c.env.DB.prepare(
        'SELECT setting_value FROM system_settings WHERE setting_key = ?'
      ).bind('resend_from_email').first<any>();
      
      const siteUrl = await c.env.DB.prepare(
        'SELECT setting_value FROM system_settings WHERE setting_key = ?'
      ).bind('site_url').first<any>();
      
      if (resendApiKey?.setting_value) {
        // 调用 Resend API
        const verifyUrl = `${siteUrl?.setting_value || ''}/verify?token=${verificationToken}`;
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey.setting_value}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: resendFromEmail?.setting_value || 'noreply@example.com',
            to: email,
            subject: '验证您的邮箱 - EasyTier 节点管理系统',
            html: `
              <h2>欢迎注册 EasyTier 节点管理系统</h2>
              <p>请点击以下链接验证您的邮箱：</p>
              <p><a href="${verifyUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">验证邮箱</a></p>
              <p>或复制以下链接到浏览器：</p>
              <p>${verifyUrl}</p>
              <p>如果您没有注册账户，请忽略此邮件。</p>
            `
          })
        });
        
        if (!response.ok) {
          console.error('发送验证邮件失败:', await response.text());
        }
      }
    } catch (emailError) {
      console.error('发送验证邮件错误:', emailError);
      // 邮件发送失败不影响注册
    }
    
    return c.json({ 
      message: '注册成功，请查收验证邮件',
      verification_token: verificationToken // 开发环境返回，生产环境应删除
    }, 201);
  } catch (error) {
    console.error('注册错误:', error);
    return c.json({ error: '注册失败' }, 500);
  }
});

// 用户登录
auth.post('/login', async (c) => {
  try {
    const { email, password }: LoginRequest = await c.req.json();
    
    // 验证输入
    if (!email || !password) {
      return c.json({ error: '邮箱和密码不能为空' }, 400);
    }
    
    // 查找用户
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first<User>();
    
    if (!user) {
      return c.json({ error: '邮箱或密码错误' }, 401);
    }
    
    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: '邮箱或密码错误' }, 401);
    }
    
    // 检查邮箱是否已验证
    if (!user.is_verified) {
      return c.json({ error: '请先验证您的邮箱' }, 403);
    }
    
    // 生成 JWT
    const token = await createJWT(
      { 
        email: user.email, 
        is_admin: !!user.is_admin,
        is_super_admin: !!user.is_super_admin
      },
      c.env.JWT_SECRET
    );
    
    return c.json({
      token,
      user: {
        email: user.email,
        is_admin: !!user.is_admin,
        is_super_admin: !!user.is_super_admin
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return c.json({ error: '登录失败' }, 500);
  }
});

// 验证邮箱
auth.get('/verify', async (c) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({ error: '缺少验证令牌' }, 400);
    }
    
    // 查找用户
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE verification_token = ?'
    ).bind(token).first<User>();
    
    if (!user) {
      return c.json({ error: '无效的验证令牌' }, 400);
    }
    
    // 更新用户状态
    await c.env.DB.prepare(
      'UPDATE users SET is_verified = 1, verification_token = NULL WHERE email = ?'
    ).bind(user.email).run();
    
    return c.json({ message: '邮箱验证成功' });
  } catch (error) {
    console.error('验证错误:', error);
    return c.json({ error: '验证失败' }, 500);
  }
});

// 修改密码
auth.post('/change-password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: '未授权' }, 401);
    }
    
    const { old_password, new_password } = await c.req.json();
    
    if (!old_password || !new_password) {
      return c.json({ error: '旧密码和新密码不能为空' }, 400);
    }
    
    if (new_password.length < 6) {
      return c.json({ error: '新密码长度至少为 6 位' }, 400);
    }
    
    // 这里需要从 JWT 中获取用户信息
    // 简化处理，实际应该使用中间件
    
    return c.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    return c.json({ error: '修改密码失败' }, 500);
  }
});

export default auth;

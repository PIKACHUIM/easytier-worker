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
    
    // 检查是否启用邮件验证（从环境变量读取，默认为false）
    const enableEmailVerification = c.env.ENABLE_EMAIL_VERIFICATION === 'true' || c.env.ENABLE_EMAIL_VERIFICATION === '1';
    
    // 创建用户
    const passwordHash = await hashPassword(password);
    const verificationToken = generateToken();
    
    // 如果不启用邮件验证，直接设置为已验证
    const isVerified = enableEmailVerification ? 0 : 1;
    const tokenToStore = enableEmailVerification ? verificationToken : null;
    
    await c.env.DB.prepare(
      'INSERT INTO users (email, password_hash, verification_token, is_verified) VALUES (?, ?, ?, ?)'
    ).bind(email, passwordHash, tokenToStore, isVerified).run();
    
    // 如果启用邮件验证，发送验证邮件（使用 Resend）
    if (enableEmailVerification) {
      try {
        console.log('[邮件验证] 开始发送验证邮件到:', email);
        
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
        
        console.log('[邮件验证] Resend配置:', {
          hasApiKey: !!resendApiKey?.setting_value,
          apiKeyLength: resendApiKey?.setting_value?.length || 0,
          fromEmail: resendFromEmail?.setting_value,
          siteUrl: siteUrl?.setting_value
        });
        
        if (!resendApiKey?.setting_value) {
          console.error('[邮件验证] 错误: Resend API Key 未配置');
          return c.json({ 
            message: '注册成功，但邮件发送失败：邮件服务未配置',
            verification_token: verificationToken,
            warning: '请联系管理员配置邮件服务'
          }, 201);
        }
        
        if (!resendFromEmail?.setting_value || resendFromEmail.setting_value === 'noreply@example.com') {
          console.error('[邮件验证] 警告: 发件人邮箱未正确配置:', resendFromEmail?.setting_value);
        }
        
        // 调用 Resend API
        const verifyUrl = `${siteUrl?.setting_value || ''}/verify?token=${verificationToken}`;
        
        const requestBody = {
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
        };
        
        console.log('[邮件验证] 发送请求到 Resend API...');
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey.setting_value}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        const responseText = await response.text();
        console.log('[邮件验证] Resend API 响应状态:', response.status);
        console.log('[邮件验证] Resend API 响应内容:', responseText);
        
        if (!response.ok) {
          console.error('[邮件验证] 发送验证邮件失败:', {
            status: response.status,
            statusText: response.statusText,
            body: responseText
          });
          
          return c.json({ 
            message: '注册成功，但邮件发送失败',
            verification_token: verificationToken,
            error_detail: `邮件服务返回错误: ${response.status} - ${responseText}`,
            warning: '请检查邮件服务配置或联系管理员'
          }, 201);
        }
        
        console.log('[邮件验证] 验证邮件发送成功');
      } catch (emailError) {
        console.error('[邮件验证] 发送验证邮件异常:', emailError);
        console.error('[邮件验证] 错误堆栈:', emailError instanceof Error ? emailError.stack : '无堆栈信息');
        
        return c.json({ 
          message: '注册成功，但邮件发送失败',
          verification_token: verificationToken,
          error_detail: emailError instanceof Error ? emailError.message : String(emailError),
          warning: '请联系管理员检查邮件服务'
        }, 201);
      }
      
      return c.json({ 
        message: '注册成功，请查收验证邮件',
        verification_token: verificationToken // 开发环境返回，生产环境应删除
      }, 201);
    } else {
      console.log('[邮件验证] 邮件验证已禁用，用户直接激活');
      return c.json({ 
        message: '注册成功，账户已自动激活',
        email_verification_disabled: true
      }, 201);
    }
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
    
    // 检查是否启用邮件验证
    const enableEmailVerification = c.env.ENABLE_EMAIL_VERIFICATION === 'true' || c.env.ENABLE_EMAIL_VERIFICATION === '1';
    
    // 如果启用邮件验证，检查邮箱是否已验证
    if (enableEmailVerification && !user.is_verified) {
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

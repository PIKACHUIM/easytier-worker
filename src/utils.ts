import {Resend} from 'resend';
import type {Context} from 'hono';
import type {Env, JWTPayload, AppContext} from './types';

// 简单的 JWT 实现（用于 Cloudflare Workers）
export async function createJWT(payload: JWTPayload, secret: string): Promise<string> {
    const header = {alg: 'HS256', typ: 'JWT'};
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        {name: 'HMAC', hash: 'SHA-256'},
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return `${data}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
    try {
        const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
        const data = `${encodedHeader}.${encodedPayload}`;

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            {name: 'HMAC', hash: 'SHA-256'},
            false,
            ['verify']
        );

        const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));

        if (!isValid) return null;

        return JSON.parse(atob(encodedPayload));
    } catch {
        return null;
    }
}

// 密码哈希（简化版，使用 Web Crypto API）
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

// 认证中间件
export async function authMiddleware(c: AppContext, next: () => Promise<void>) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({error: '访问未授权'}, 401);
    }

    const token = authHeader.substring(7);
    
    // 特殊处理：如果token直接等于JWT_SECRET，则无需管理员权限即可访问API
    if (token === c.env.JWT_SECRET) {
        // 创建一个临时的JWTPayload，标记为超级管理员权限
        const payload: JWTPayload = {
            email: 'system@easytier',
            is_admin: true,
            is_super_admin: true
        };
        c.set('user', payload);
        await next();
        return;
    }
    
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    
    if (!payload) {
        return c.json({error: '无效的令牌'}, 401);
    }

    c.set('user', payload);
    await next();
}

// 管理员权限中间件
export async function adminMiddleware(c: AppContext, next: () => Promise<void>) {
    const user = c.get('user') as JWTPayload;
    console.log('user', user);
    if (!user || !user.is_admin) {
        return c.json({error: '需要管理员权限'}, 403);
    }

    await next();
}

// 生成随机令牌
export function generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// 计算两个地理位置之间的距离（简化版，使用经纬度）
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 更新节点的近期状态（30天内每10分钟的负荷情况）
export function updateRecentStatus(currentStatus: string, load: number): string {
    // 每10分钟一个状态点，30天 = 30 * 24 * 6 = 4320 个点
    const maxLength = 4320;
    let status = currentStatus || '';

    // 负荷转换为 0-9 的数字
    const loadChar = Math.min(9, Math.max(0, Math.floor(load))).toString();
    status += loadChar;

    // 保持最近 4320 个点
    if (status.length > maxLength) {
        status = status.substring(status.length - maxLength);
    }

    return status;
}

// 计算节点的人均日流量
export function calculateDailyTrafficPerUser(
    maxTraffic: number,
    usedTraffic: number,
    resetDate: string,
    connectionCount: number
): number {
    const now = new Date();
    const reset = new Date(resetDate);
    const daysRemaining = Math.max(1, Math.ceil((reset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const remainingTraffic = Math.max(0, maxTraffic - usedTraffic);
    const dailyTraffic = remainingTraffic / daysRemaining;
    const users = Math.max(1, connectionCount);
    return dailyTraffic / users;
}

// 计算节点的人均带宽
export function calculateBandwidthPerUser(tierBandwidth: number, connectionCount: number): number {
    const users = Math.max(1, connectionCount);
    return tierBandwidth / users;
}

// HTML转义函数
export function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 邮件发送函数（使用 Resend 官方 SDK）
export async function sendEmail(
    apiKey: string,
    fromEmail: string,
    toEmail: string,
    subject: string,
    htmlContent: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const resend = new Resend(apiKey);

        const {data, error} = await resend.emails.send({
            from: fromEmail,
            to: [toEmail],
            subject: subject,
            html: htmlContent,
        });

        if (error) {
            return {
                success: false,
                error: error.message || '邮件发送失败'
            };
        }

        return {success: true, message: '邮件发送成功'};
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        };
    }
}

// 生成测试邮件内容
export function generateTestEmailContent(siteName: string, siteUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>邮件发送测试</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { background: #f8f9fa; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${siteName}</h1>
          <p>邮件发送测试</p>
        </div>
        <div class="content">
          <h2>恭喜！邮件发送测试成功</h2>
          <p>这封邮件用于测试 ${siteName} 系统的邮件发送功能。</p>
          <p>如果您收到了这封邮件，说明您的邮件服务配置正确。</p>
          <p>系统网址: <a href="${siteUrl}">${siteUrl}</a></p>
          <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        <div class="footer">
          <p>这是一封自动发送的测试邮件，请勿回复。</p>
          <p>&copy; ${new Date().getFullYear()} ${siteName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 日期格式化函数
export function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
}

export function formatDateShort(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
}

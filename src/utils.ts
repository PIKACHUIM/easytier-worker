import type { Context } from 'hono';
import type { Env, JWTPayload } from './types';

// 简单的 JWT 实现（用于 Cloudflare Workers）
export async function createJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
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
      { name: 'HMAC', hash: 'SHA-256' },
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
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权' }, 401);
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  
  if (!payload) {
    return c.json({ error: '无效的令牌' }, 401);
  }
  
  c.set('user', payload);
  await next();
}

// 管理员权限中间件
export async function adminMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const user = c.get('user') as JWTPayload;
  
  if (!user || !user.is_admin) {
    return c.json({ error: '需要管理员权限' }, 403);
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

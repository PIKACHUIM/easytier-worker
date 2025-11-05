import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'
import type { Env } from './types'
import auth from './routes/auth'
import nodes from './routes/nodes'
import api from './routes/api'
import system from './routes/system'

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
  return c.render(<HomePage />)
})

app.get('/login', (c) => {
  return c.render(<LoginPage />)
})

app.get('/register', (c) => {
  return c.render(<RegisterPage />)
})

app.get('/dashboard', (c) => {
  return c.render(<DashboardPage />)
})

app.get('/admin', (c) => {
  return c.render(<AdminPage />)
})

app.get('/initialize', (c) => {
  return c.render(<InitializePage />)
})

app.get('/settings', (c) => {
  return c.render(<SettingsPage />)
})

// 首页组件
function HomePage() {
  return (
    <div class="container">
      <header class="header">
        <h1>EasyTier 节点管理系统</h1>
        <nav id="main-nav">
          <a href="/login" id="login-link">登录</a>
          <a href="/register" id="register-link">注册</a>
          <a href="/dashboard" id="dashboard-link" style="display: none;">我的节点</a>
          <a href="/admin" id="admin-link" style="display: none;">管理面板</a>
          <a href="/settings" id="settings-link" style="display: none;">系统设置</a>
          <a href="#" id="logout-link" style="display: none;">退出</a>
        </nav>
      </header>
      
      <main class="main">
        <section class="hero">
          <h2>欢迎使用 EasyTier 节点管理系统</h2>
          <p>高效管理您的 EasyTier 节点，提供稳定的网络服务</p>
        </section>
        
        <section class="stats" id="stats">
          <div class="stat-card">
            <h3>总节点数</h3>
            <p class="stat-value" id="total-nodes">-</p>
          </div>
          <div class="stat-card">
            <h3>在线节点</h3>
            <p class="stat-value" id="online-nodes">-</p>
          </div>
          <div class="stat-card">
            <h3>总带宽</h3>
            <p class="stat-value" id="total-bandwidth">-</p>
          </div>
        </section>
        
        <section class="nodes-list">
          <h2>公开节点列表</h2>
          <div id="nodes-container" class="nodes-grid">
            <p>加载中...</p>
          </div>
        </section>
      </main>
      
      <footer class="footer">
        <p>&copy; 2025 EasyTier 节点管理系统</p>
      </footer>
      
      <script type="module" src="/src/client/home.ts"></script>
    </div>
  )
}

// 登录页面组件
function LoginPage() {
  return (
    <div class="container">
      <div class="auth-form">
        <h1>登录</h1>
        <form id="login-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit">登录</button>
        </form>
        <p>还没有账户？<a href="/register">立即注册</a></p>
      </div>
      <script type="module" src="/src/client/login.ts"></script>
    </div>
  )
}

// 注册页面组件
function RegisterPage() {
  return (
    <div class="container">
      <div class="auth-form">
        <h1>注册</h1>
        <form id="register-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input type="password" id="password" name="password" required minlength="6" />
          </div>
          <div class="form-group">
            <label for="confirm-password">确认密码</label>
            <input type="password" id="confirm-password" name="confirm-password" required />
          </div>
          <button type="submit">注册</button>
        </form>
        <p>已有账户？<a href="/login">立即登录</a></p>
      </div>
      <script type="module" src="/src/client/register.ts"></script>
    </div>
  )
}

// 用户仪表板页面组件
function DashboardPage() {
  return (
    <div class="container">
      <header class="header">
        <h1>我的节点</h1>
        <nav id="dashboard-nav">
          <a href="/">首页</a>
          <a href="/admin" id="admin-link" style="display: none;">管理面板</a>
          <a href="/settings" id="settings-link" style="display: none;">系统设置</a>
          <a href="#" id="logout">退出</a>
        </nav>
      </header>
      
      <main class="main">
        <div class="dashboard-actions">
          <button id="add-node-btn" class="btn-primary">添加节点</button>
        </div>
        
        <div id="nodes-container" class="nodes-grid">
          <p>加载中...</p>
        </div>
        
        <div id="node-modal" class="modal" style="display: none;">
          <div class="modal-content">
            <span class="close">&times;</span>
            <h2 id="modal-title">添加节点</h2>
            <form id="node-form">
              <input type="hidden" id="node-id" />
              <div class="form-group">
                <label for="node-name">节点名称</label>
                <input type="text" id="node-name" required />
              </div>
              <div class="form-group">
                <label for="region-type">地域类型</label>
                <select id="region-type" required>
                  <option value="domestic">国内</option>
                  <option value="overseas">海外</option>
                </select>
              </div>
              <div class="form-group">
                <label for="region-detail">具体地区</label>
                <input type="text" id="region-detail" required />
              </div>
              <div class="form-group">
                <label>连接方式</label>
                <div id="connections-container"></div>
                <button type="button" id="add-connection-btn">添加连接</button>
              </div>
              <div class="form-group">
                <label for="tier-bandwidth">阶梯带宽 (Mbps)</label>
                <input type="number" id="tier-bandwidth" required />
              </div>
              <div class="form-group">
                <label for="max-bandwidth">最大带宽 (Mbps)</label>
                <input type="number" id="max-bandwidth" required />
              </div>
              <div class="form-group">
                <label for="max-traffic">最大流量 (GB)</label>
                <input type="number" id="max-traffic" required />
              </div>
              <div class="form-group">
                <label for="reset-cycle">重置周期 (天)</label>
                <input type="number" id="reset-cycle" required />
              </div>
              <div class="form-group">
                <label for="max-connections">最大连接数</label>
                <input type="number" id="max-connections" required />
              </div>
              <div class="form-group">
                <label for="valid-until">有效期至</label>
                <input type="date" id="valid-until" required />
              </div>
              <div class="form-group">
                <label for="allow-relay">允许中转</label>
                <input type="checkbox" id="allow-relay" />
              </div>
              <div class="form-group">
                <label for="tags">标签</label>
                <input type="text" id="tags" />
              </div>
              <div class="form-group">
                <label for="notes">备注</label>
                <textarea id="notes"></textarea>
              </div>
              <button type="submit">保存</button>
            </form>
          </div>
        </div>
      </main>
      
      <script type="module" src="/src/client/dashboard.ts"></script>
    </div>
  )
}

// 管理员页面组件
function AdminPage() {
  return (
    <div class="container">
      <header class="header">
        <h1>管理员面板</h1>
        <nav>
          <a href="/">首页</a>
          <a href="/dashboard">我的节点</a>
          <a href="/settings">系统设置</a>
          <a href="#" id="logout">退出</a>
        </nav>
      </header>
      
      <main class="main">
        <h2>所有节点</h2>
        <div id="nodes-container" class="nodes-grid">
          <p>加载中...</p>
        </div>
      </main>
      
      <script type="module" src="/src/client/admin.ts"></script>
    </div>
  )
}

// 初始化页面组件
function InitializePage() {
  return (
    <div class="container">
      <div class="auth-form">
        <h1>系统初始化</h1>
        <p class="info">首次使用需要初始化系统并创建超级管理员账户</p>
        
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>初始化说明：</h3>
          <p style={{ margin: '10px 0', lineHeight: '1.6' }}>
            点击"初始化系统"按钮后，系统将自动完成以下操作：
          </p>
          <ol style={{ margin: '10px 0', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>导入数据库表结构（users、nodes、system_settings）</li>
            <li>创建超级管理员账户</li>
            <li>完成系统初始化配置</li>
          </ol>
        </div>
        
        <form id="init-form">
          <div class="form-group">
            <label for="jwt-secret">JWT 密钥</label>
            <input 
              type="password" 
              id="jwt-secret" 
              name="jwt-secret" 
              required 
              placeholder="请输入环境变量中的 JWT_SECRET"
            />
            <small>请输入 wrangler.jsonc 中配置的 JWT_SECRET</small>
          </div>
          
          <div class="form-group">
            <label for="email">管理员邮箱</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input type="password" id="password" name="password" required minlength="6" />
          </div>
          <div class="form-group">
            <label for="confirm-password">确认密码</label>
            <input type="password" id="confirm-password" name="confirm-password" required />
          </div>
          <button type="submit" id="init-submit-btn">初始化系统</button>
        </form>
        <div id="message"></div>
      </div>
      <script type="module" src="/src/client/initialize.ts"></script>
    </div>
  )
}

// 系统设置页面组件
function SettingsPage() {
  return (
    <div class="container">
      <header class="header">
        <h1>系统设置</h1>
        <nav>
          <a href="/">首页</a>
          <a href="/dashboard">我的节点</a>
          <a href="/admin">管理员面板</a>
          <a href="#" id="logout">退出</a>
        </nav>
      </header>
      
      <main class="main">
        <div id="message"></div>
        
        <section class="settings-section">
          <h2>邮件服务配置 (Resend)</h2>
          <form id="settings-form">
            <div class="form-group">
              <label for="resend-api-key">Resend API 密钥</label>
              <input type="password" id="resend-api-key" name="resend-api-key" />
              <small>用于发送验证邮件，可在 <a href="https://resend.com/api-keys" target="_blank">Resend 控制台</a> 获取</small>
            </div>
            <div class="form-group">
              <label for="resend-from-email">发件人邮箱</label>
              <input type="email" id="resend-from-email" name="resend-from-email" />
              <small>例如: noreply@yourdomain.com</small>
            </div>
            <div class="form-group">
              <label for="resend-from-domain">发件域名</label>
              <input type="text" id="resend-from-domain" name="resend-from-domain" />
              <small>需要在 Resend 中验证的域名，例如: yourdomain.com</small>
            </div>
            
            <h2>网站配置</h2>
            <div class="form-group">
              <label for="site-name">网站名称</label>
              <input type="text" id="site-name" name="site-name" />
            </div>
            <div class="form-group">
              <label for="site-url">网站 URL</label>
              <input type="url" id="site-url" name="site-url" />
              <small>用于生成邮件中的链接，例如: https://yourdomain.com</small>
            </div>
            
            <button type="submit">保存设置</button>
          </form>
        </section>
        
        <section class="settings-section">
          <h2>用户管理</h2>
          <div id="users-container">
            <p>加载中...</p>
          </div>
        </section>
      </main>
      
      <script type="module" src="/src/client/settings.ts"></script>
    </div>
  )
}

export default app

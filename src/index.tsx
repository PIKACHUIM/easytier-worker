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

// 统一标题栏组件
function Header({ title }: { title: string }) {
  return (
    <header class="header">
      <h1>{title}</h1>
      <nav id="main-nav">
        <a href="/" id="home-link">公共节点</a>
        <a href="/dashboard" id="dashboard-link" style="display: none;">我的节点</a>
        <a href="/admin" id="admin-link" style="display: none;">管理面板</a>
        <a href="/settings" id="settings-link" style="display: none;">系统设置</a>
        <a href="#" id="logout-link" style="display: none;">退出</a>
        <a href="/login" id="login-link">登录</a>
      </nav>
    </header>
  )
}

// 首页组件
function HomePage() {
  return (
    <div class="container">
      <Header title="EasyTier 节点管理系统 - 公共节点" />
      
      <main class="main">
        <section class="hero">
          <h2>欢迎使用 EasyTier 节点管理系统</h2>
          <p>高效管理您的 EasyTier 节点，提供稳定的网络服务</p>
        </section>
        
        <section class="stats" id="stats">
          <div class="stat-card donut-card">
            <div class="donut-container" style="display:flex;flex-direction:column;align-items:center;">
              <canvas id="nodes-chart" width="120" height="120"></canvas>
              <div class="chart-text"><span id="nodes-text">-/-</span><span class="donut-label">在线节点</span></div>
            </div>
          </div>
          <div class="stat-card donut-card">
            <div class="donut-container" style="display:flex;flex-direction:column;align-items:center;">
              <canvas id="connections-chart" width="120" height="120"></canvas>
              <div class="chart-text"><span id="connections-text">-/-</span><span class="donut-label">当前连接</span></div>
            </div>
          </div>
          <div class="stat-card donut-card">
            <div class="donut-container" style="display:flex;flex-direction:column;align-items:center;">
              <canvas id="bandwidth-chart" width="120" height="120"></canvas>
              <div class="chart-text"><span id="bandwidth-text">-/-</span><span class="donut-label">带宽使用</span></div>
            </div>
          </div>
        </section>
        
        <section class="nodes-list">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2>公开节点列表</h2>
            <label class="toggle-switch">
              <input type="checkbox" id="show-offline-toggle" />
              <span>显示离线节点</span>
            </label>
          </div>
          <div class="nodes-table-container">
          <table class="nodes-table" id="nodes-table">
              <thead>
                <tr>
                  <th>节点名称</th>
                  <th>状态</th>
                  <th>地域</th>
                  <th>当前带宽</th>
                  <th>最大带宽</th>
                  <th>连接数</th>
                  <th>备注</th>
                  <th>已用流量</th>
                  <th>最大流量</th>
                  <th>允许中转</th>
                  <th>标签</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="nodes-container">
              <tr><td colspan="12" style="text-align: center;">加载中...</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <div id="public-node-detail-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 900px;">
            <span class="close" id="public-detail-close">&times;</span>
            <h2 id="public-detail-node-name">节点详情</h2>
            <div id="public-node-detail-content"></div>
          </div>
        </div>
        <div id="admin-node-detail-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 900px;">
            <span class="close" id="admin-detail-close">&times;</span>
            <h2 id="admin-detail-node-name">节点详情</h2>
            <div id="admin-node-detail-content"></div>
          </div>
        </div>
        <div id="admin-node-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 800px;">
            <span class="close" id="admin-edit-close">&times;</span>
            <h2 id="admin-modal-title">编辑节点</h2>
            <form id="admin-node-form">
              <input type="hidden" id="admin-node-id" />
              <div class="form-group">
                <label for="admin-node-name">节点名称 *</label>
                <input type="text" id="admin-node-name" required />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="admin-region-type">地域类型 *</label>
                  <select id="admin-region-type" required>
                    <option value="domestic">大陆</option>
                    <option value="overseas">海外</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="admin-region-detail">具体地区</label>
                  <input type="text" id="admin-region-detail" />
                </div>
              </div>
              <div class="form-group">
                <label>连接方式 *</label>
                <div id="admin-connections-container" style="margin-bottom: 10px;"></div>
                <button type="button" id="admin-add-connection-btn" class="btn-small" style="width: auto;">+ 添加连接</button>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="admin-max-bandwidth">最大带宽 (Mbps) *</label>
                  <input type="number" id="admin-max-bandwidth" required min="0" step="0.01" />
                </div>
                <div class="form-group">
                  <label for="admin-max-connections">最大连接数 *</label>
                  <input type="number" id="admin-max-connections" required min="1" />
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="admin-max-traffic">最大流量 (GB) *</label>
                  <input type="number" id="admin-max-traffic" required min="0" step="0.01" />
                </div>
                <div class="form-group">
                  <label for="admin-reset-cycle">每月重置日期 (0-31) *</label>
                  <input type="number" id="admin-reset-cycle" required min="0" max="31" />
                </div>
              </div>
              <div class="form-group">
                <label for="admin-valid-until">有效期至 *</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input type="date" id="admin-valid-until" required />
                  <label style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                    <input type="checkbox" id="admin-valid-long-term" style="width: 24px;" />长期有效
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="admin-allow-relay" style="width: auto; margin-right: 8px;" />允许中转
                </label>
              </div>
              <div class="form-group">
                <label for="admin-tags">标签</label>
                <input type="text" id="admin-tags" />
              </div>
              <div class="form-group">
                <label for="admin-notes">备注信息</label>
                <textarea id="admin-notes"></textarea>
              </div>
              <button type="submit" class="btn-primary">保存节点</button>
            </form>
          </div>
        </div>
      </main>
      
      <footer class="footer">
        <p>&copy; 2025 EasyTier 节点管理系统</p>
      </footer>
      
      <script type="module" dangerouslySetInnerHTML={{__html: `
        // 检查系统是否已初始化
        async function checkSystemInit() {
          try {
            const response = await fetch('/api/system/check-init');
            const data = await response.json();
            if (!data.initialized) {
              window.location.href = '/initialize';
              return false;
            }
            return true;
          } catch (error) {
            console.error('检查初始化状态失败:', error);
            return true;
          }
        }

        // 加载首页公开节点统计（环形图百分比展示）
        // 封装：图表更新/创建
        function upsertDonut(chartKey, canvasId, value, total) {
          const ctx = document.getElementById(canvasId);
          if (!ctx || !window.Chart) return;
          const rest = Math.max(0, total - value);
          const data = [value, rest];
          const colors = ['#667eea', '#e9ecef'];
          let chart = window[chartKey];
          if (!chart) {
            chart = new Chart(ctx, {
              type: 'doughnut',
              data: { datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
              options: { plugins: { legend: { display: false }, tooltip: { enabled: false } }, cutout: '70%' }
            });
            window[chartKey] = chart;
          } else {
            chart.data.datasets[0].data = data;
            chart.update();
          }
        }

        async function loadHomeStats() {
          const nodesTextEl = document.getElementById('nodes-text');
          const connectionsTextEl = document.getElementById('connections-text');
          const bandwidthTextEl = document.getElementById('bandwidth-text');

          try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            const totalNodes = Number(data.total_nodes || 0);
            const onlineNodesCount = Number(data.online_nodes || 0);

            // 节点统计：在线节点/总节点
            const nodesPercentage = totalNodes > 0 ? (onlineNodesCount / totalNodes) * 100 : 0;
            if (nodesTextEl) nodesTextEl.textContent = onlineNodesCount + '/' + totalNodes;
            upsertDonut('nodesChart', 'nodes-chart', onlineNodesCount, totalNodes);

            // 连接统计：当前连接/最大连接
            const currentConnections = Number(data.connection_count_total || 0);
            const maxConnections = Number(data.max_connections_total || 0);
            const connectionsPercentage = maxConnections > 0 ? (currentConnections / maxConnections) * 100 : 0;
            if (connectionsTextEl) connectionsTextEl.textContent = currentConnections + '/' + maxConnections;
            upsertDonut('connectionsChart', 'connections-chart', currentConnections, maxConnections);

            // 带宽统计：当前带宽/最大带宽
            const currentBandwidth = Number(data.current_bandwidth_total || 0);
            const maxBandwidth = Number(data.max_bandwidth_total || 0);
            const bandwidthPercentage = maxBandwidth > 0 ? (currentBandwidth / maxBandwidth) * 100 : 0;
            if (bandwidthTextEl) bandwidthTextEl.textContent = currentBandwidth.toFixed(1) + '/' + maxBandwidth.toFixed(1);
            upsertDonut('bandwidthChart', 'bandwidth-chart', currentBandwidth, maxBandwidth);
          } catch (error) {
            console.error('加载首页统计失败:', error);
            if (nodesTextEl) nodesTextEl.textContent = '-/-';
            if (connectionsTextEl) connectionsTextEl.textContent = '-/-';
            if (bandwidthTextEl) bandwidthTextEl.textContent = '-/-';
          }
        }

        // 检查用户登录状态和权限
        function checkUserStatus() {
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              const loginLink = document.getElementById('login-link');
              if (loginLink) loginLink.style.display = 'none';
              document.getElementById('dashboard-link').style.display = 'inline';
              document.getElementById('logout-link').style.display = 'inline';
              if (user.is_admin || user.is_super_admin) {
                document.getElementById('admin-link').style.display = 'inline';
                document.getElementById('settings-link').style.display = 'inline';
              }
              document.getElementById('logout-link')?.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
              });
            } catch (error) {
              console.error('解析用户信息失败:', error);
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } else {
            const loginLink = document.getElementById('login-link');
            const logoutLink = document.getElementById('logout-link');
            if (loginLink) loginLink.style.display = 'inline';
            if (logoutLink) logoutLink.style.display = 'none';
          }
        }

        // 加载统计信息
        async function loadStats() {
          try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            document.getElementById('total-nodes').textContent = data.total_nodes;
            document.getElementById('online-nodes').textContent = data.online_nodes;
            document.getElementById('total-bandwidth').textContent = \`\${data.total_bandwidth.toFixed(2)} Mbps\`;
          } catch (error) {
            console.error('加载统计信息失败:', error);
          }
        }

        // 加载我的节点统计（环形图百分比展示）
        async function loadMyStats() {
          const token = localStorage.getItem('token');
          const nodesTextEl = document.getElementById('nodes-text');
          const connectionsTextEl = document.getElementById('connections-text');
          const bandwidthTextEl = document.getElementById('bandwidth-text');
          const nodesDonutEl = document.getElementById('nodes-donut');
          const connectionsDonutEl = document.getElementById('connections-donut');
          const bandwidthDonutEl = document.getElementById('bandwidth-donut');

          if (!token) {
            if (nodesTextEl) nodesTextEl.textContent = '-/-';
            if (connectionsTextEl) connectionsTextEl.textContent = '-/-';
            if (bandwidthTextEl) bandwidthTextEl.textContent = '-/-';
            return;
          }

          try {
            const response = await fetch('/api/nodes/my', {
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '加载失败');

            const nodes = data.nodes || [];
            const onlineNodes = nodes.filter(n => n.status === 'online');
            
            // 节点统计：在线节点/总节点
            const totalNodes = nodes.length;
            const onlineNodesCount = onlineNodes.length;
            const nodesPercentage = totalNodes > 0 ? (onlineNodesCount / totalNodes) * 100 : 0;
            if (nodesTextEl) nodesTextEl.textContent = \`\${onlineNodesCount}/\${totalNodes}\`;
            if (nodesDonutEl) {
              const circumference = 2 * Math.PI * 50;
              const strokeDasharray = (nodesPercentage / 100) * circumference;
              nodesDonutEl.style.strokeDasharray = \`\${strokeDasharray} \${circumference}\`;
            }

            // 连接统计：当前连接/可用连接
            const currentConnections = onlineNodes.reduce((sum, n) => sum + (n.connection_count || 0), 0);
            const maxConnections = onlineNodes.reduce((sum, n) => sum + (n.max_connections || 0), 0);
            const connectionsPercentage = maxConnections > 0 ? (currentConnections / maxConnections) * 100 : 0;
            if (connectionsTextEl) connectionsTextEl.textContent = \`\${currentConnections}/\${maxConnections}\`;
            if (connectionsDonutEl) {
              const circumference = 2 * Math.PI * 50;
              const strokeDasharray = (connectionsPercentage / 100) * circumference;
              connectionsDonutEl.style.strokeDasharray = \`\${strokeDasharray} \${circumference}\`;
            }

            // 带宽统计：当前带宽/阶梯带宽
            const currentBandwidth = onlineNodes.reduce((sum, n) => sum + (n.current_bandwidth || 0), 0);
            const tierBandwidth = onlineNodes.reduce((sum, n) => sum + (n.tier_bandwidth || 0), 0);
            const bandwidthPercentage = tierBandwidth > 0 ? (currentBandwidth / tierBandwidth) * 100 : 0;
            if (bandwidthTextEl) bandwidthTextEl.textContent = \`\${currentBandwidth.toFixed(1)}/\${tierBandwidth.toFixed(1)}\`;
            if (bandwidthDonutEl) {
              const circumference = 2 * Math.PI * 50;
              const strokeDasharray = (bandwidthPercentage / 100) * circumference;
              bandwidthDonutEl.style.strokeDasharray = \`\${strokeDasharray} \${circumference}\`;
            }
          } catch (error) {
            console.error('加载我的节点统计失败:', error);
          }
        }

        // 加载公开节点列表
        async function loadPublicNodes() {
          try {
            const showOffline = document.getElementById('show-offline-toggle').checked;
            const response = await fetch(\`/api/public?show_offline=\${showOffline}\`);
            const data = await response.json();
            const container = document.getElementById('nodes-container');
            const statsDiv = document.getElementById('online-stats');
            window.publicNodesCache = data.nodes || [];
            
            // 统一渲染节点行（主页标准）
            function renderNodeRows(mode, nodes) {
              return nodes.map(node => \`
                <tr>
                  <td>\${escapeHtml(node.node_name)}</td>
                  <td><span class="node-status \${node.status}">\${node.status === 'online' ? '在线' : '离线'}</span></td>
                  <td>\${node.region_type === 'domestic' ? '大陆' : '海外'} - \${escapeHtml(node.region_detail || '-')}</td>
                  <td>\${(node.current_bandwidth || 0).toFixed(2)} Mbps</td>
                  <td>\${(node.max_bandwidth || 0).toFixed(2)} Mbps</td>
                  <td>\${node.connection_count} / \${node.max_connections}</td>
                  <td>\${(node.used_traffic || 0).toFixed(2)} GB</td>
                  <td>\${node.max_traffic === 0 ? '无限制' : node.max_traffic.toFixed(2) + ' GB'}</td>
                  <td>\${node.allow_relay ? '是' : '否'}</td>
                  <td>\${escapeHtml(node.tags || '-')}</td>
                  <td><button class=\"btn-small\" onclick=\"viewPublicNodeDetail(\${node.id})\">详情</button></td>
                </tr>
              \`).join('');
            }
            
            // 显示在线节点统计（若存在容器）
            if (statsDiv && data.stats) {
              statsDiv.innerHTML = \`
                <strong>在线节点统计：</strong>
                总连接数: \${data.stats.total_connections} | 
                平均连接数: \${data.stats.avg_connections.toFixed(2)} | 
                平均带宽: \${data.stats.avg_bandwidth.toFixed(2)} Mbps | 
                平均流量: \${data.stats.avg_traffic.toFixed(2)} GB
              \`;
            }
            
            if (data.nodes.length === 0) {
              container.innerHTML = '<tr><td colspan="11" style="text-align: center;">暂无节点</td></tr>';
              return;
            }
            
            container.innerHTML = renderNodeRows('public', data.nodes);
          } catch (error) {
            console.error('加载节点列表失败:', error);
            document.getElementById('nodes-container').innerHTML = '<tr><td colspan="11" style="text-align: center;">加载失败，请稍后重试</td></tr>';
          }
        }
        
        // 监听开关变化（立即绑定，避免 DOMContentLoaded 时机问题）
        const offlineToggleEl = document.getElementById('show-offline-toggle');
        if (offlineToggleEl) {
          offlineToggleEl.addEventListener('change', loadPublicNodes);
        }

        function escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }

        (async () => {
          document.title = 'EasyTier 节点管理系统 - 公共节点';
          const initialized = await checkSystemInit();
          if (initialized) {
            checkUserStatus();
            loadHomeStats();
            loadPublicNodes();
          }
        })();

        setInterval(() => {
          loadHomeStats();
          loadPublicNodes();
        }, 30000);
      `}} />
      <script dangerouslySetInnerHTML={{__html: `
        window.viewPublicNodeDetail = (nodeId) => {
          try {
            const nodes = window.publicNodesCache || [];
            const node = nodes.find(n => n.id === nodeId);
            if (!node) {
              alert('未找到节点');
              return;
            }
            const content = [
              '<div style="display: grid; gap: 15px;">',
              '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
              '    <h3 style="margin-bottom: 10px; color: #667eea;">基本信息</h3>',
              '    <div class="node-info"><strong>节点名称:</strong> ' + escapeHtml(node.node_name) + '</div>',
              '    <div class="node-info"><strong>地域:</strong> ' + (node.region_type === 'domestic' ? '大陆' : '海外') + ' - ' + escapeHtml(node.region_detail || '-') + '</div>',
              '    <div class="node-info"><strong>当前状态:</strong> <span class="node-status ' + node.status + '">' + (node.status === 'online' ? '在线' : '离线') + '</span></div>',
              '    <div class="node-info"><strong>允许中转:</strong> ' + (node.allow_relay ? '是' : '否') + '</div>',
              node.tags ? ('    <div class="node-info"><strong>标签:</strong> ' + escapeHtml(node.tags) + '</div>') : '',
              '  </div>',
              '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
              '    <h3 style="margin-bottom: 10px; color: #667eea;">带宽与流量</h3>',
              '    <div class="node-info"><strong>当前带宽:</strong> ' + Number(node.current_bandwidth || 0).toFixed(2) + ' Mbps</div>',
              '    <div class="node-info"><strong>阶梯带宽:</strong> ' + Number(node.tier_bandwidth || 0).toFixed(2) + ' Mbps</div>',
              '    <div class="node-info"><strong>最大带宽:</strong> ' + Number(node.max_bandwidth || 0).toFixed(2) + ' Mbps</div>',
              '    <div class="node-info"><strong>已用流量:</strong> ' + Number(node.used_traffic || 0).toFixed(2) + ' GB</div>',
              '    <div class="node-info"><strong>最大流量:</strong> ' + (node.max_traffic === 0 ? '无限制' : Number(node.max_traffic || 0).toFixed(2) + ' GB') + '</div>',
              '    <div class="node-info"><strong>重置日期:</strong> ' + (node.reset_date ? new Date(node.reset_date).toLocaleString('zh-CN') : '-') + '</div>',
              '  </div>',
              '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
              '    <h3 style="margin-bottom: 10px; color: #667eea;">连接信息</h3>',
              '    <div class="node-info"><strong>当前连接数:</strong> ' + (node.connection_count || 0) + '</div>',
              '    <div class="node-info"><strong>最大连接数:</strong> ' + (node.max_connections || 0) + '</div>',
              '  </div>',
              '  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">',
              '    <small style="color: #856404; display: block; margin-top: 10px;">⚠️ 公开详情不显示上报Token。如需管理节点请登录。</small>',
              '  </div>',
              '</div>'
            ].join('');
            document.getElementById('public-detail-node-name').textContent = node.node_name;
            document.getElementById('public-node-detail-content').innerHTML = content;
            document.getElementById('public-node-detail-modal').style.display = 'block';
          } catch (error) {
            console.error('显示节点详情失败:', error);
            alert('显示节点详情失败');
          }
        };
        document.getElementById('public-detail-close')?.addEventListener('click', () => {
          document.getElementById('public-node-detail-modal').style.display = 'none';
        });
        window.addEventListener('click', (e) => {
          const target = e.target;
          if (target && target.id === 'public-node-detail-modal') {
            document.getElementById('public-node-detail-modal').style.display = 'none';
          }
        });
      `}} />
    </div>
  )
}

// 登录页面组件
function LoginPage() {
  return (
    <div class="container">
      <Header title="登录" />
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
      <script dangerouslySetInnerHTML={{__html: `
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              if (data.user.is_admin || data.user.is_super_admin) {
                window.location.href = '/admin';
              } else {
                window.location.href = '/dashboard';
              }
            } else {
              alert(data.error || '登录失败');
            }
          } catch (error) {
            console.error('登录错误:', error);
            alert('登录失败，请稍后重试');
          }
        });
      `}} />
    </div>
  )
}

// 注册页面组件
function RegisterPage() {
  return (
    <div class="container">
      <Header title="注册" />
      <div class="auth-form">
        <h1>注册</h1>
        <form id="register-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input type="password" id="password" name="password" required minLength={6} />
          </div>
          <div class="form-group">
            <label for="confirm-password">确认密码</label>
            <input type="password" id="confirm-password" name="confirm-password" required />
          </div>
          <button type="submit">注册</button>
        </form>
        <p>已有账户？<a href="/login">立即登录</a></p>
      </div>
      <script dangerouslySetInnerHTML={{__html: `
        async function checkSystemInit() {
          try {
            const response = await fetch('/api/system/check-init');
            const data = await response.json();
            if (!data.initialized) {
              window.location.href = '/initialize';
              return false;
            }
            return true;
          } catch (error) {
            console.error('检查初始化状态失败:', error);
            return true;
          }
        }
        checkSystemInit();
        
        const registerForm = document.getElementById('register-form');
        registerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirm-password').value;
          if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
          }
          if (password.length < 6) {
            alert('密码长度至少为 6 位');
            return;
          }
          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
              alert('注册成功！请查收验证邮件。');
              window.location.href = '/login';
            } else {
              alert(data.error || '注册失败');
            }
          } catch (error) {
            console.error('注册错误:', error);
            alert('注册失败，请稍后重试');
          }
        });
      `}} />
    </div>
  )
}

// 用户仪表板页面组件
function DashboardPage() {
  return (
    <div class="container">
      <Header title="EasyTier 节点管理系统 - 我的节点" />
      
      <main class="main">
        <div class="dashboard-actions">
          <button id="add-node-btn" class="btn-primary">添加节点</button>
        </div>
        
        {/* 移除仪表板在线统计展示 */}
        <div class="nodes-table-container">
          <table class="nodes-table" id="my-nodes-table">
            <thead>
              <tr>
                <th>节点名称</th>
                <th>状态</th>
                <th>地域</th>
                <th>当前带宽</th>
                <th>最大带宽</th>
                <th>连接数</th>
                <th>备注</th>
                <th>已用流量</th>
                <th>最大流量</th>
                <th>允许中转</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="nodes-container">
              <tr><td colspan="11" style="text-align: center;">加载中...</td></tr>
            </tbody>
          </table>
        </div>
        
        <div id="node-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 800px;">
            <span class="close">&times;</span>
            <h2 id="modal-title">添加节点</h2>
            <form id="node-form">
              <input type="hidden" id="node-id" />
              
              <div class="form-group">
                <label for="node-name">节点名称 *</label>
                <input type="text" id="node-name" required placeholder="例如：北京节点1" />
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="region-type">地域类型 *</label>
                  <select id="region-type" required>
                    <option value="domestic">大陆</option>
                    <option value="overseas">海外</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="region-detail">具体地区</label>
                  <input type="text" id="region-detail" placeholder="例如：北京、东京（可不填）" />
                </div>
              </div>
              
              <div class="form-group">
                <label>连接方式 *</label>
                <div id="connections-container" style="margin-bottom: 10px;"></div>
                <button type="button" id="add-connection-btn" class="btn-small" style="width: auto;">+ 添加连接</button>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="max-bandwidth">最大带宽 (Mbps) *</label>
                  <input type="number" id="max-bandwidth" required min="0" step="0.01" placeholder="1" value="1" />
                </div>
                <div class="form-group">
                  <label for="max-connections">最大连接数 *</label>
                  <input type="number" id="max-connections" required min="1" placeholder="100" value="100" />
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="max-traffic">最大流量 (GB) *</label>
                  <input type="number" id="max-traffic" required min="0" step="0.01" placeholder="0" value="0" />
                </div>
                <div class="form-group">
                  <label for="reset-cycle">每月重置日期 (0-31) *</label>
                  <input type="number" id="reset-cycle" required min="0" max="31" placeholder="0" value="0" />
                </div>
              </div>
              
              <div class="form-group">
                <label for="valid-until">有效期至 *</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input type="date" id="valid-until" required />
                  <label style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                    <input type="checkbox" id="valid-long-term" style="width: 24px;" />
                    长期有效
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label>
                  <input type="checkbox" id="allow-relay" style="width: auto; margin-right: 8px;" />
                  允许中转
                </label>
              </div>
              
              <div class="form-group">
                <label for="tags">标签</label>
                <input type="text" id="tags" placeholder="例如：高速、稳定" />
              </div>
              
              <div class="form-group">
                <label for="notes">备注信息</label>
                <textarea id="notes" placeholder="节点的其他说明信息"></textarea>
              </div>
              
              <button type="submit" class="btn-primary">保存节点</button>
            </form>
          </div>
        </div>
        
        <div id="node-detail-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 900px;">
            <span class="close" id="detail-close">&times;</span>
            <h2 id="detail-node-name">节点详情</h2>
            <div id="node-detail-content"></div>
          </div>
        </div>
      </main>
      
      <script dangerouslySetInnerHTML={{__html: `
        const token = localStorage.getItem('token');
        if (!token) window.location.href = '/login';
        document.title = 'EasyTier 节点管理系统 - 我的节点';
        
        let currentEditingNodeId = null;
        
        function checkAdminAccess() {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              if (user.is_admin || user.is_super_admin) {
                const adminLink = document.getElementById('admin-link');
                const settingsLink = document.getElementById('settings-link');
                if (adminLink) adminLink.style.display = 'inline';
                if (settingsLink) settingsLink.style.display = 'inline';
              }
            } catch (error) {
              console.error('解析用户信息失败:', error);
            }
          }
        }
        
        document.getElementById('logout-link')?.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
        });
        
        function escapeHtml(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
        
        function formatDate(dateStr) {
          if (!dateStr) return '-';
          return new Date(dateStr).toLocaleString('zh-CN');
        }
        
        function formatDateShort(dateStr) {
          if (!dateStr) return '-';
          return new Date(dateStr).toLocaleDateString('zh-CN');
        }
        
        // 统一渲染节点行（主页标准，仪表板加操作）
        function renderNodeRows(mode, nodes) {
          return nodes.map(node => \`
            <tr>
              <td>\${escapeHtml(node.node_name)}</td>
              <td><span class="node-status \${node.status}">\${node.status === 'online' ? '在线' : '离线'}</span></td>
              <td>\${node.region_type === 'domestic' ? '大陆' : '海外'} - \${escapeHtml(node.region_detail || '-')}</td>
              <td>\${(node.current_bandwidth || 0).toFixed(2)} Mbps</td>
              <td>\${(node.max_bandwidth || 0).toFixed(2)} Mbps</td>
              <td>\${node.connection_count} / \${node.max_connections}</td>
              <td>\${(node.used_traffic || 0).toFixed(2)} GB</td>
              <td>\${node.max_traffic === 0 ? '无限制' : node.max_traffic.toFixed(2) + ' GB'}</td>
              <td>\${node.allow_relay ? '是' : '否'}</td>
              <td>\${escapeHtml(node.tags || '-')}</td>
              <td>\${escapeHtml(node.notes || '-')}</td>
              \${mode === 'my' ? \`<td>
                  <button class="btn-small" onclick="viewNodeDetail(\${node.id})">详情</button>
                  <button class="btn-small" onclick="editNode(\${node.id})">编辑</button>
                  <button class="btn-small btn-danger" onclick="deleteNode(\${node.id})">删除</button>
                </td>\` : ''}
            </tr>
          \`).join('');
        }
        
        async function loadMyNodes() {
          try {
            const response = await fetch('/api/nodes/my', {
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            const data = await response.json();
            if (!response.ok) {
              if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
              }
              throw new Error(data.error);
            }
            const container = document.getElementById('nodes-container');
            if (data.nodes.length === 0) {
              container.innerHTML = '<tr><td colspan="13" style="text-align: center;">您还没有添加任何节点，点击上方"添加节点"按钮开始添加</td></tr>';
              return;
            }
            // 使用统一渲染器（带操作）
            container.innerHTML = renderNodeRows('my', data.nodes);
          } catch (error) {
            console.error('加载节点列表失败:', error);
            document.getElementById('nodes-container').innerHTML = '<tr><td colspan="13" style="text-align: center;">加载失败，请刷新重试</td></tr>';
          }
        }
        
        window.viewNodeDetail = async (nodeId) => {
          try {
            const response = await fetch(\`/api/nodes/\${nodeId}\`, {
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            const node = data.node;
            const detailContent = \`
              <div style="display: grid; gap: 15px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                  <h3 style="margin-bottom: 10px; color: #667eea;">基本信息</h3>
                  <div class="node-info"><strong>节点名称:</strong> \${escapeHtml(node.node_name)}</div>
                  <div class="node-info"><strong>地域:</strong> \${node.region_type === 'domestic' ? '大陆' : '海外'} - \${escapeHtml(node.region_detail)}</div>
                  <div class="node-info"><strong>用户邮箱:</strong> \${escapeHtml(node.user_email)}</div>
                  <div class="node-info"><strong>创建时间:</strong> \${formatDate(node.created_at)}</div>
                  <div class="node-info"><strong>有效期至:</strong> \${formatDate(node.valid_until)}</div>
                  <div class="node-info"><strong>当前状态:</strong> <span class="node-status \${node.status}">\${node.status === 'online' ? '在线' : '离线'}</span></div>
                  <div class="node-info"><strong>最后上报:</strong> \${formatDate(node.last_report_at)}</div>
                  <div class="node-info"><strong>允许中转:</strong> \${node.allow_relay ? '是' : '否'}</div>
                  \${node.tags ? \`<div class="node-info"><strong>标签:</strong> \${escapeHtml(node.tags)}</div>\` : ''}
                  \${node.notes ? \`<div class="node-info"><strong>备注:</strong> \${escapeHtml(node.notes)}</div>\` : ''}
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                  <h3 style="margin-bottom: 10px; color: #667eea;">连接方式</h3>
                  \${node.connections.map((conn, idx) => \`
                    <div class="node-info" style="background: white; padding: 8px; margin: 5px 0; border-radius: 4px;">
                      <strong>连接 \${idx + 1}:</strong> \${conn.type} - \${conn.ip}:\${conn.port}
                    </div>
                  \`).join('')}
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                  <h3 style="margin-bottom: 10px; color: #667eea;">带宽与流量</h3>
                  <div class="node-info"><strong>当前带宽:</strong> \${node.current_bandwidth.toFixed(2)} Mbps</div>
                  <div class="node-info"><strong>阶梯带宽:</strong> \${node.tier_bandwidth.toFixed(2)} Mbps</div>
                  <div class="node-info"><strong>最大带宽:</strong> \${node.max_bandwidth.toFixed(2)} Mbps</div>
                  <div class="node-info"><strong>已用流量:</strong> \${node.used_traffic.toFixed(2)} GB</div>
                  <div class="node-info"><strong>修正流量:</strong> \${node.correction_traffic.toFixed(2)} GB</div>
                  <div class="node-info"><strong>上报流量:</strong> \${(node.used_traffic - node.correction_traffic).toFixed(2)} GB</div>
                  <div class="node-info"><strong>最大流量:</strong> \${node.max_traffic.toFixed(2)} GB</div>
                  <div class="node-info"><strong>重置周期:</strong> \${node.reset_cycle} 天</div>
                  <div class="node-info"><strong>下次重置:</strong> \${formatDate(node.reset_date)}</div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                  <h3 style="margin-bottom: 10px; color: #667eea;">连接信息</h3>
                  <div class="node-info"><strong>当前连接数:</strong> \${node.connection_count}</div>
                  <div class="node-info"><strong>最大连接数:</strong> \${node.max_connections}</div>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">
                  <h3 style="margin-bottom: 10px; color: #856404;">上报Token</h3>
                  <div style="background: white; padding: 12px; border-radius: 4px; margin: 10px 0;">
                    <code style="font-family: monospace; font-size: 13px; word-break: break-all; color: #333;">
                      \${node.report_token || '未生成'}
                    </code>
                  </div>
                  <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="btn-small" onclick="copyToken('\${node.report_token}')">复制Token</button>
                    <button class="btn-small" onclick="regenerateToken(\${node.id})">重新生成Token</button>
                  </div>
                  <small style="color: #856404; display: block; margin-top: 10px;">
                    ⚠️ Token用于节点上报数据，请妥善保管。重新生成后旧Token将失效。
                  </small>
                </div>
              </div>
            \`;
            
            document.getElementById('detail-node-name').textContent = node.node_name;
            document.getElementById('node-detail-content').innerHTML = detailContent;
            document.getElementById('node-detail-modal').style.display = 'block';
          } catch (error) {
            console.error('加载节点详情失败:', error);
            alert('加载节点详情失败');
          }
        };
        
        window.editNode = async (nodeId) => {
          try {
            const response = await fetch(\`/api/nodes/\${nodeId}\`, {
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            const node = data.node;
            currentEditingNodeId = nodeId;
            
            document.getElementById('modal-title').textContent = '编辑节点';
            document.getElementById('node-name').value = node.node_name;
            document.getElementById('region-type').value = node.region_type;
            document.getElementById('region-detail').value = node.region_detail;
            document.getElementById('max-bandwidth').value = node.max_bandwidth;
            document.getElementById('max-traffic').value = node.max_traffic;
            document.getElementById('reset-cycle').value = node.reset_cycle;
            document.getElementById('max-connections').value = node.max_connections;
            const isLongTerm = node.valid_until.startsWith('2099-12-31');
            document.getElementById('valid-long-term').checked = isLongTerm;
            document.getElementById('valid-until').value = (isLongTerm ? '2099-12-31' : node.valid_until.split('T')[0]);
            document.getElementById('allow-relay').checked = node.allow_relay === 1;
            document.getElementById('tags').value = node.tags || '';
            document.getElementById('notes').value = node.notes || '';
            
            // 加载连接方式
            const connectionsContainer = document.getElementById('connections-container');
            connectionsContainer.innerHTML = '';
            node.connections.forEach((conn, idx) => {
              addConnectionField(conn);
            });
            
            document.getElementById('node-modal').style.display = 'block';
          } catch (error) {
            console.error('加载节点信息失败:', error);
            alert('加载节点信息失败');
          }
        };
        
        window.copyToken = async (token) => {
          try {
            await navigator.clipboard.writeText(token);
            alert('Token已复制到剪贴板');
          } catch (error) {
            const textarea = document.createElement('textarea');
            textarea.value = token;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
              document.execCommand('copy');
              alert('Token已复制到剪贴板');
            } catch (err) {
              alert('复制失败，请手动复制');
            }
            document.body.removeChild(textarea);
          }
        };
        
        window.regenerateToken = async (nodeId) => {
          if (!confirm('确定要重新生成Token吗？旧Token将失效！')) return;
          try {
            const response = await fetch(\`/api/nodes/\${nodeId}/regenerate-token\`, {
              method: 'POST',
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            const data = await response.json();
            if (response.ok) {
              alert('Token重新生成成功！新Token: ' + data.token);
              loadMyNodes();
              document.getElementById('node-detail-modal').style.display = 'none';
            } else {
              alert(data.error || '重新生成Token失败');
            }
          } catch (error) {
            console.error('重新生成Token失败:', error);
            alert('重新生成Token失败，请稍后重试');
          }
        };
        
        window.deleteNode = async (nodeId) => {
          if (!confirm('确定要删除这个节点吗？此操作不可恢复！')) return;
          try {
            const response = await fetch(\`/api/nodes/\${nodeId}\`, {
              method: 'DELETE',
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            const data = await response.json();
            if (response.ok) {
              alert('节点删除成功');
              loadMyNodes();
            } else {
              alert(data.error || '删除失败');
            }
          } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请稍后重试');
          }
        };
        
        function addConnectionField(conn = null) {
          const container = document.getElementById('connections-container');
          const index = container.children.length;
          const div = document.createElement('div');
          div.className = 'connection-item';
          div.style.cssText = 'display: grid; grid-template-columns: 120px 1fr 100px 60px; gap: 10px; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;';
          div.innerHTML = \`
            <select class="conn-type" required>
              <option value="TCP" \${conn?.type === 'TCP' ? 'selected' : ''}>TCP</option>
              <option value="UDP" \${conn?.type === 'UDP' ? 'selected' : ''}>UDP</option>
              <option value="WS" \${conn?.type === 'WS' ? 'selected' : ''}>WS</option>
              <option value="WSS" \${conn?.type === 'WSS' ? 'selected' : ''}>WSS</option>
              <option value="WG" \${conn?.type === 'WG' ? 'selected' : ''}>WG</option>
            </select>
            <input type="text" class="conn-ip" placeholder="IP地址" value="\${conn?.ip || ''}" required />
            <input type="number" class="conn-port" placeholder="端口" value="\${conn?.port || ''}" min="1" max="65535" required />
            <button type="button" class="btn-danger btn-small" onclick="this.parentElement.remove()" style="padding: 8px;">删除</button>
          \`;
          container.appendChild(div);
        }
        
        document.getElementById('add-connection-btn')?.addEventListener('click', () => {
          addConnectionField();
        });
        
        document.getElementById('add-node-btn')?.addEventListener('click', () => {
          currentEditingNodeId = null;
          document.getElementById('modal-title').textContent = '添加节点';
          document.getElementById('node-form').reset();
          document.getElementById('connections-container').innerHTML = '';
          addConnectionField(); // 默认添加一个连接
          document.getElementById('node-modal').style.display = 'block';
          const lt = document.getElementById('valid-long-term');
          const du = document.getElementById('valid-until');
          if (lt && du && lt.addEventListener) {
            lt.addEventListener('change', function() {
              if (lt.checked) du.value = '2099-12-31';
            });
          }
        });
        
        document.getElementById('node-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // 收集连接方式
          const connectionItems = document.querySelectorAll('.connection-item');
          const connections = Array.from(connectionItems).map(item => ({
            type: item.querySelector('.conn-type').value,
            ip: item.querySelector('.conn-ip').value,
            port: parseInt(item.querySelector('.conn-port').value)
          }));
          
          if (connections.length === 0) {
            alert('请至少添加一个连接方式');
            return;
          }
          
          const nodeData = {
            node_name: document.getElementById('node-name').value,
            region_type: document.getElementById('region-type').value,
            region_detail: document.getElementById('region-detail').value,
            connections: connections,
            max_bandwidth: parseFloat(document.getElementById('max-bandwidth').value),
            max_traffic: parseFloat(document.getElementById('max-traffic').value),
            reset_cycle: parseInt(document.getElementById('reset-cycle').value),
            max_connections: parseInt(document.getElementById('max-connections').value),
            valid_until: (document.getElementById('valid-long-term').checked
              ? '2099-12-31T23:59:59Z'
              : (document.getElementById('valid-until').value + 'T23:59:59Z')),
            allow_relay: document.getElementById('allow-relay').checked ? 1 : 0,
            tags: document.getElementById('tags').value,
            notes: document.getElementById('notes').value
          };
          
          try {
            const url = currentEditingNodeId 
              ? \`/api/nodes/\${currentEditingNodeId}\`
              : '/api/nodes';
            const method = currentEditingNodeId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
              method: method,
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(nodeData)
            });
            
            const data = await response.json();
            if (response.ok) {
              alert(currentEditingNodeId ? '节点更新成功' : '节点创建成功');
              document.getElementById('node-modal').style.display = 'none';
              loadMyNodes();
            } else {
              alert(data.error || '操作失败');
            }
          } catch (error) {
            console.error('保存节点失败:', error);
            alert('保存节点失败，请稍后重试');
          }
        });
        
        document.querySelector('.close')?.addEventListener('click', () => {
          document.getElementById('node-modal').style.display = 'none';
        });
        
        document.getElementById('detail-close')?.addEventListener('click', () => {
          document.getElementById('node-detail-modal').style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
          if (e.target.id === 'node-modal') {
            document.getElementById('node-modal').style.display = 'none';
          }
          if (e.target.id === 'node-detail-modal') {
            document.getElementById('node-detail-modal').style.display = 'none';
          }
        });
        
        checkAdminAccess();
        loadMyNodes();
      `}} />
    </div>
  )
}

// 管理员页面组件
function AdminPage() {
  return (
    <div class="container">
      <Header title="EasyTier 节点管理系统 - 管理面板" />
      
      <main class="main">
        <h2>所有节点</h2>
        <div class="nodes-table-container">
          <table class="nodes-table" id="admin-nodes-table">
            <thead>
              <tr>
                <th>节点名称</th>
                <th>状态</th>
                <th>地域</th>
                <th>当前带宽</th>
                <th>最大带宽</th>
                <th>连接数</th>
                <th>备注</th>
                <th>已用流量</th>
                <th>最大流量</th>
                <th>允许中转</th>
                <th>标签</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="nodes-container">
              <tr><td colspan="12" style="text-align: center;">加载中...</td></tr>
            </tbody>
          </table>
        </div>
      </main>
      
      <script dangerouslySetInnerHTML={{__html: `
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) {
          alert('请先登录');
          window.location.href = '/login';
        }
        const user = JSON.parse(userStr);
        if (!user.is_admin && !user.is_super_admin) {
          alert('需要管理员权限才能访问此页面');
          window.location.href = '/dashboard';
        }
        
        document.title = 'EasyTier 节点管理系统 - 管理面板';
        document.getElementById('logout-link')?.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
        });
        
        function escapeHtml(text) {
          if (!text) return '';
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
        
        function formatDate(dateStr) {
          if (!dateStr) return '-';
          return new Date(dateStr).toLocaleString('zh-CN');
        }
        
        function renderNodeRows(nodes) {
          return nodes.map(node => \`
            <tr>
              <td>\${escapeHtml(node.node_name)}</td>
              <td><span class="node-status \${node.status}">\${node.status === 'online' ? '在线' : '离线'}</span></td>
              <td>\${node.region_type === 'domestic' ? '大陆' : '海外'} - \${escapeHtml(node.region_detail || '-')}</td>
              <td>\${(node.current_bandwidth || 0).toFixed(2)} Mbps</td>
              <td>\${(node.max_bandwidth || 0).toFixed(2)} Mbps</td>
              <td>\${node.connection_count} / \${node.max_connections}</td>
              <td>\${(node.used_traffic || 0).toFixed(2)} GB</td>
              <td>\${node.max_traffic === 0 ? '无限制' : node.max_traffic.toFixed(2) + ' GB'}</td>
              <td>\${node.allow_relay ? '是' : '否'}</td>
              <td>\${escapeHtml(node.tags || '-')}</td>
              <td>
                <button class="btn-small" onclick="viewAdminNodeDetail(\${node.id})">详情</button>
                <button class="btn-small" onclick="editAdminNode(\${node.id})">编辑</button>
                <button class="btn-small btn-danger" onclick="deleteAdminNode(\${node.id})">删除</button>
              </td>
            </tr>
          \`).join('');
        }
        
        async function loadAllNodes() {
          try {
            const response = await fetch('/api/nodes/all', {
              headers: { 'Authorization': \`Bearer \${token}\` }
            });
            const data = await response.json();
            if (!response.ok) {
              if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
              }
              throw new Error(data.error);
            }
            const container = document.getElementById('nodes-container');
            if (data.nodes.length === 0) {
              container.innerHTML = '<tr><td colspan="11" style="text-align: center;">暂无节点</td></tr>';
              return;
            }
            
            container.innerHTML = renderNodeRows(data.nodes);
          } catch (error) {
            console.error('加载节点列表失败:', error);
            document.getElementById('nodes-container').innerHTML = '<tr><td colspan="11" style="text-align: center;">加载失败，请刷新重试</td></tr>';
          }
        }
        
        window.viewAdminNodeDetail = async (nodeId) => {
          try {
            const response = await fetch('/api/nodes/' + nodeId, { headers: { 'Authorization': 'Bearer ' + token } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            const node = data.node;
            const connsHtml = node.connections.map((conn, idx) => (
              '    <div class="node-info" style="background: white; padding: 8px; margin: 5px 0; border-radius: 4px;">' +
              '      <strong>连接 ' + (idx + 1) + ':</strong> ' + conn.type + ' - ' + conn.ip + ':' + conn.port +
              '    </div>'
            )).join('');
            const detailContent = [
              '<div style="display: grid; gap: 15px;">',
              '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
              '    <h3 style="margin-bottom: 10px; color: #667eea;">基本信息</h3>',
              '    <div class="node-info"><strong>节点名称:</strong> ' + escapeHtml(node.node_name) + '</div>',
              '    <div class="node-info"><strong>地域:</strong> ' + (node.region_type === 'domestic' ? '大陆' : '海外') + ' - ' + escapeHtml(node.region_detail || '') + '</div>',
              '    <div class="node-info"><strong>用户邮箱:</strong> ' + escapeHtml(node.user_email) + '</div>',
              '    <div class="node-info"><strong>创建时间:</strong> ' + new Date(node.created_at).toLocaleString('zh-CN') + '</div>',
              '    <div class="node-info"><strong>有效期至:</strong> ' + new Date(node.valid_until).toLocaleString('zh-CN') + '</div>',
              '    <div class="node-info"><strong>当前状态:</strong> <span class="node-status ' + node.status + '">' + (node.status === 'online' ? '在线' : '离线') + '</span></div>',
              '    <div class="node-info"><strong>最后上报:</strong> ' + new Date(node.last_report_at).toLocaleString('zh-CN') + '</div>',
              '    <div class="node-info"><strong>允许中转:</strong> ' + (node.allow_relay ? '是' : '否') + '</div>',
              node.tags ? ('    <div class="node-info"><strong>标签:</strong> ' + escapeHtml(node.tags) + '</div>') : '',
              node.notes ? ('    <div class="node-info"><strong>备注:</strong> ' + escapeHtml(node.notes) + '</div>') : '',
              '  </div>',
              '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
              '    <h3 style="margin-bottom: 10px; color: #667eea;">连接方式</h3>',
              connsHtml,
              '  </div>',
              '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
              '    <h3 style="margin-bottom: 10px; color: #667eea;">带宽与流量</h3>',
              '    <div class="node-info"><strong>当前带宽:</strong> ' + Number(node.current_bandwidth || 0).toFixed(2) + ' Mbps</div>',
              '    <div class="node-info"><strong>阶梯带宽:</strong> ' + Number(node.tier_bandwidth || 0).toFixed(2) + ' Mbps</div>',
              '    <div class="node-info"><strong>最大带宽:</strong> ' + Number(node.max_bandwidth || 0).toFixed(2) + ' Mbps</div>',
              '    <div class="node-info"><strong>已用流量:</strong> ' + Number(node.used_traffic || 0).toFixed(2) + ' GB</div>',
              '    <div class="node-info"><strong>修正流量:</strong> ' + Number(node.correction_traffic || 0).toFixed(2) + ' GB</div>',
              '    <div class="node-info"><strong>上报流量:</strong> ' + Number((node.used_traffic || 0) - (node.correction_traffic || 0)).toFixed(2) + ' GB</div>',
              '    <div class="node-info"><strong>最大流量:</strong> ' + Number(node.max_traffic || 0).toFixed(2) + ' GB</div>',
              '    <div class="node-info"><strong>重置周期:</strong> ' + node.reset_cycle + ' 天</div>',
              '    <div class="node-info"><strong>下次重置:</strong> ' + new Date(node.reset_date).toLocaleString('zh-CN') + '</div>',
              '  </div>',
              '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
              '    <h3 style="margin-bottom: 10px; color: #667eea;">连接信息</h3>',
              '    <div class="node-info"><strong>当前连接数:</strong> ' + node.connection_count + '</div>',
              '    <div class="node-info"><strong>最大连接数:</strong> ' + node.max_connections + '</div>',
              '  </div>',
              '  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">',
              '    <h3 style="margin-bottom: 10px; color: #856404;">上报Token</h3>',
              '    <div style="background: white; padding: 12px; border-radius: 4px; margin: 10px 0;">',
              '      <code style="font-family: monospace; font-size: 13px; word-break: break-all; color: #333;">' + (node.report_token || '未生成') + '</code>',
              '    </div>',
              '    <div style="display: flex; gap: 10px; margin-top: 10px;">',
              '      <button class="btn-small" onclick="copyAdminToken(' + JSON.stringify(node.report_token || '') + ')">复制Token</button>',
              '      <button class="btn-small" onclick="regenerateAdminToken(' + node.id + ')">重新生成Token</button>',
              '    </div>',
              '  </div>',
              '</div>'
            ].join('');
            document.getElementById('admin-detail-node-name').textContent = node.node_name;
            document.getElementById('admin-node-detail-content').innerHTML = detailContent;
            document.getElementById('admin-node-detail-modal').style.display = 'block';
          } catch (error) {
            console.error('加载节点详情失败:', error);
            alert('加载节点详情失败');
          }
        };

        window.copyAdminToken = async (token) => {
          try { await navigator.clipboard.writeText(token); alert('Token已复制'); } catch (e) { alert('复制失败'); }
        };
        window.regenerateAdminToken = async (nodeId) => {
          if (!confirm('确定要重新生成Token吗？旧Token将失效！')) return;
          try {
            const response = await fetch('/api/nodes/' + nodeId + '/regenerate-token', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
            const data = await response.json();
            if (response.ok) { alert('Token重新生成成功！新Token: ' + data.token); loadAllNodes(); document.getElementById('admin-node-detail-modal').style.display = 'none'; }
            else { alert(data.error || '重新生成Token失败'); }
          } catch (error) { console.error('重新生成Token失败:', error); alert('重新生成Token失败，请稍后重试'); }
        };

        window.editAdminNode = async (nodeId) => {
          try {
            const response = await fetch('/api/nodes/' + nodeId, { headers: { 'Authorization': 'Bearer ' + token } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            const node = data.node;
            (document.getElementById('admin-node-id')).value = String(nodeId);
            document.getElementById('admin-modal-title').textContent = '编辑节点';
            (document.getElementById('admin-node-name')).value = node.node_name;
            (document.getElementById('admin-region-type')).value = node.region_type;
            (document.getElementById('admin-region-detail')).value = node.region_detail || '';
            (document.getElementById('admin-max-bandwidth')).value = String(node.max_bandwidth || 0);
            (document.getElementById('admin-max-traffic')).value = String(node.max_traffic || 0);
            (document.getElementById('admin-reset-cycle')).value = String(node.reset_cycle || 0);
            (document.getElementById('admin-max-connections')).value = String(node.max_connections || 0);
            const isLongTerm = String(node.valid_until).startsWith('2099-12-31');
            (document.getElementById('admin-valid-long-term')).checked = isLongTerm;
            (document.getElementById('admin-valid-until')).value = isLongTerm ? '2099-12-31' : String(node.valid_until).split('T')[0];
            (document.getElementById('admin-allow-relay')).checked = node.allow_relay === 1 || node.allow_relay === true;
            (document.getElementById('admin-tags')).value = node.tags || '';
            (document.getElementById('admin-notes')).value = node.notes || '';
            const ctn = document.getElementById('admin-connections-container'); ctn.innerHTML = '';
            node.connections.forEach((conn) => { addAdminConnectionField(conn); });
            document.getElementById('admin-node-modal').style.display = 'block';
          } catch (error) {
            console.error('加载节点信息失败:', error);
            alert('加载节点信息失败');
          }
        };

        function addAdminConnectionField(conn = null) {
          const container = document.getElementById('admin-connections-container');
          const div = document.createElement('div');
          div.className = 'connection-item';
          div.style.cssText = 'display: grid; grid-template-columns: 120px 1fr 100px 60px; gap: 10px; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;';
          div.innerHTML = [
            '<select class="conn-type" required>',
            '  <option value="TCP"' + (conn && conn.type === 'TCP' ? ' selected' : '') + '>TCP</option>',
            '  <option value="UDP"' + (conn && conn.type === 'UDP' ? ' selected' : '') + '>UDP</option>',
            '  <option value="WS"' + (conn && conn.type === 'WS' ? ' selected' : '') + '>WS</option>',
            '  <option value="WSS"' + (conn && conn.type === 'WSS' ? ' selected' : '') + '>WSS</option>',
            '  <option value="WG"' + (conn && conn.type === 'WG' ? ' selected' : '') + '>WG</option>',
            '</select>',
            '<input type="text" class="conn-ip" placeholder="IP地址" value="' + (conn ? (conn.ip || '') : '') + '" required />',
            '<input type="number" class="conn-port" placeholder="端口" value="' + (conn ? (conn.port || '') : '') + '" min="1" max="65535" required />',
            '<button type="button" class="btn-danger btn-small" onclick="this.parentElement.remove()" style="padding: 8px;">删除</button>'
          ].join('');
          container.appendChild(div);
        }
        document.getElementById('admin-add-connection-btn')?.addEventListener('click', () => { addAdminConnectionField(); });
        const adminLT = document.getElementById('admin-valid-long-term');
        const adminDU = document.getElementById('admin-valid-until');
        if (adminLT && adminDU && adminLT.addEventListener) {
          adminLT.addEventListener('change', function() {
            if (adminLT.checked) adminDU.value = '2099-12-31';
          });
        }

        window.deleteAdminNode = async (nodeId) => {
          if (!confirm('确定要删除这个节点吗？此操作不可恢复！')) return;
          try {
            const response = await fetch('/api/nodes/' + nodeId, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
            const data = await response.json();
            if (response.ok) { alert('节点删除成功'); loadAllNodes(); }
            else { alert(data.error || '删除失败'); }
          } catch (error) { console.error('删除失败:', error); alert('删除失败，请稍后重试'); }
        };

        document.getElementById('admin-node-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const connectionItems = document.querySelectorAll('#admin-connections-container .connection-item');
          const connections = Array.from(connectionItems).map(item => ({
            type: (item.querySelector('.conn-type')).value,
            ip: (item.querySelector('.conn-ip')).value,
            port: parseInt((item.querySelector('.conn-port')).value)
          }));
          const nodeId = (document.getElementById('admin-node-id')).value;
          const nodeData = {
            node_name: (document.getElementById('admin-node-name')).value,
            region_type: (document.getElementById('admin-region-type')).value,
            region_detail: (document.getElementById('admin-region-detail')).value,
            connections,
            max_bandwidth: parseFloat((document.getElementById('admin-max-bandwidth')).value),
            max_traffic: parseFloat((document.getElementById('admin-max-traffic')).value),
            reset_cycle: parseInt((document.getElementById('admin-reset-cycle')).value),
            max_connections: parseInt((document.getElementById('admin-max-connections')).value),
            valid_until: ((document.getElementById('admin-valid-long-term')).checked ? '2099-12-31T23:59:59Z' : ((document.getElementById('admin-valid-until')).value + 'T23:59:59Z')),
            allow_relay: (document.getElementById('admin-allow-relay')).checked ? 1 : 0,
            tags: (document.getElementById('admin-tags')).value,
            notes: (document.getElementById('admin-notes')).value
          };
          try {
            const response = await fetch('/api/nodes/' + nodeId, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(nodeData) });
            const data = await response.json();
            if (response.ok) { alert('节点更新成功'); document.getElementById('admin-node-modal').style.display = 'none'; loadAllNodes(); }
            else { alert(data.error || '操作失败'); }
          } catch (error) { console.error('保存节点失败:', error); alert('保存节点失败，请稍后重试'); }
        });

        document.getElementById('admin-edit-close')?.addEventListener('click', () => { document.getElementById('admin-node-modal').style.display = 'none'; });
        document.getElementById('admin-detail-close')?.addEventListener('click', () => { document.getElementById('admin-node-detail-modal').style.display = 'none'; });
        window.addEventListener('click', (e) => {
          const t = e.target;
          if (t && t.id === 'admin-node-modal') document.getElementById('admin-node-modal').style.display = 'none';
          if (t && t.id === 'admin-node-detail-modal') document.getElementById('admin-node-detail-modal').style.display = 'none';
        });

        loadAllNodes();
        setInterval(loadAllNodes, 30000);
      `}} />
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
            <input type="password" id="password" name="password" required minLength={6} />
          </div>
          <div class="form-group">
            <label for="confirm-password">确认密码</label>
            <input type="password" id="confirm-password" name="confirm-password" required />
          </div>
          <button type="submit" id="init-submit-btn">初始化系统</button>
        </form>
        <div id="message"></div>
      </div>
      <script dangerouslySetInnerHTML={{__html: `
        document.addEventListener('DOMContentLoaded', async () => {
          const form = document.getElementById('init-form');
          const messageDiv = document.getElementById('message');
          const initBtn = document.getElementById('init-submit-btn');
          
          try {
            const response = await fetch('/api/system/check-init');
            const data = await response.json();
            if (data.initialized) {
              messageDiv.innerHTML = '<p class="success">系统已经初始化，正在跳转到登录页面...</p>';
              setTimeout(() => { window.location.href = '/login'; }, 2000);
              return;
            }
          } catch (error) {
            console.error('检查初始化状态失败:', error);
          }
          
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const jwtSecret = document.getElementById('jwt-secret').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (!jwtSecret) {
              messageDiv.innerHTML = '<p class="error">请输入 JWT 密钥</p>';
              return;
            }
            if (!email || !password) {
              messageDiv.innerHTML = '<p class="error">请填写所有必填字段</p>';
              return;
            }
            if (password !== confirmPassword) {
              messageDiv.innerHTML = '<p class="error">两次输入的密码不一致</p>';
              return;
            }
            if (password.length < 6) {
              messageDiv.innerHTML = '<p class="error">密码长度至少为 6 位</p>';
              return;
            }
            
            initBtn.disabled = true;
            initBtn.textContent = '初始化中...';
            messageDiv.innerHTML = '<p class="info">正在导入数据库并创建管理员账户...</p>';
            
            try {
              const response = await fetch('/api/system/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt_secret: jwtSecret, email, password })
              });
              const data = await response.json();
              if (response.ok) {
                messageDiv.innerHTML = \`<p class="success">\${data.message}，正在跳转到登录页面...</p>\`;
                setTimeout(() => { window.location.href = '/login'; }, 2000);
              } else {
                messageDiv.innerHTML = \`<p class="error">\${data.error || '初始化失败'}</p>\`;
                initBtn.disabled = false;
                initBtn.textContent = '初始化系统';
              }
            } catch (error) {
              console.error('初始化失败:', error);
              messageDiv.innerHTML = '<p class="error">初始化失败，请检查网络连接</p>';
              initBtn.disabled = false;
              initBtn.textContent = '初始化系统';
            }
          });
        });
      `}} />
    </div>
  )
}

// 系统设置页面组件
function SettingsPage() {
  return (
    <div class="container">
      <Header title="EasyTier 节点管理系统 - 系统设置" />
      
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
      
      <script dangerouslySetInnerHTML={{__html: `
        document.addEventListener('DOMContentLoaded', async () => {
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          if (!token || !userStr) {
            alert('请先登录');
            window.location.href = '/login';
            return;
          }
          try {
            const user = JSON.parse(userStr);
            if (!user.is_admin && !user.is_super_admin) {
              alert('需要管理员权限才能访问此页面');
              window.location.href = '/dashboard';
              return;
            }
          } catch (error) {
            console.error('解析用户信息失败:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
          
          const settingsForm = document.getElementById('settings-form');
          const usersContainer = document.getElementById('users-container');
          const messageDiv = document.getElementById('message');
          
          document.getElementById('logout-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '/login';
          });
          
          async function loadSettings() {
            try {
              const response = await fetch('/api/system/settings', {
                headers: { 'Authorization': \`Bearer \${token}\` }
              });
              if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
              }
              if (!response.ok) throw new Error('加载设置失败');
              const settings = await response.json();
              document.getElementById('resend-api-key').value = settings.resend_api_key || '';
              document.getElementById('resend-from-email').value = settings.resend_from_email || '';
              document.getElementById('resend-from-domain').value = settings.resend_from_domain || '';
              document.getElementById('site-name').value = settings.site_name || '';
              document.getElementById('site-url').value = settings.site_url || '';
            } catch (error) {
              console.error('加载设置失败:', error);
              messageDiv.innerHTML = '<p class="error">加载设置失败</p>';
            }
          }
          
          settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const settings = {
              resend_api_key: document.getElementById('resend-api-key').value,
              resend_from_email: document.getElementById('resend-from-email').value,
              resend_from_domain: document.getElementById('resend-from-domain').value,
              site_name: document.getElementById('site-name').value,
              site_url: document.getElementById('site-url').value
            };
            try {
              const response = await fetch('/api/system/settings', {
                method: 'PUT',
                headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
              });
              const data = await response.json();
              if (response.ok) {
                messageDiv.innerHTML = \`<p class="success">\${data.message}</p>\`;
                setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
              } else {
                messageDiv.innerHTML = \`<p class="error">\${data.error || '保存失败'}</p>\`;
              }
            } catch (error) {
              console.error('保存设置失败:', error);
              messageDiv.innerHTML = '<p class="error">保存设置失败</p>';
            }
          });
          
          async function loadUsers() {
            try {
              const response = await fetch('/api/system/users', {
                headers: { 'Authorization': \`Bearer \${token}\` }
              });
              if (!response.ok) throw new Error('加载用户列表失败');
              const users = await response.json();
              if (users.length === 0) {
                usersContainer.innerHTML = '<p>暂无用户</p>';
                return;
              }
              usersContainer.innerHTML = \`
                <table class="users-table">
                  <thead><tr><th>邮箱</th><th>管理员</th><th>超级管理员</th><th>已验证</th><th>注册时间</th><th>操作</th></tr></thead>
                  <tbody>
                    \${users.map(user => \`
                      <tr>
                        <td>\${user.email}</td>
                        <td>\${user.is_admin ? '是' : '否'}</td>
                        <td>\${user.is_super_admin ? '是' : '否'}</td>
                        <td>\${user.is_verified ? '是' : '否'}</td>
                        <td>\${new Date(user.created_at).toLocaleString()}</td>
                        <td>\${!user.is_super_admin ? \`
                          <button class="btn-small" onclick="toggleAdmin('\${user.email}', \${!user.is_admin})">
                            \${user.is_admin ? '撤销管理员' : '设为管理员'}
                          </button>
                          <button class="btn-small btn-danger" onclick="deleteUser('\${user.email}')">删除</button>
                        \` : '<span>-</span>'}</td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
              \`;
            } catch (error) {
              console.error('加载用户列表失败:', error);
              usersContainer.innerHTML = '<p class="error">加载用户列表失败</p>';
            }
          }
          
          window.toggleAdmin = async (email, isAdmin) => {
            if (!confirm(\`确定要\${isAdmin ? '授予' : '撤销'}用户 \${email} 的管理员权限吗？\`)) return;
            try {
              const response = await fetch(\`/api/system/users/\${email}/admin\`, {
                method: 'PUT',
                headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_admin: isAdmin })
              });
              const data = await response.json();
              if (response.ok) {
                messageDiv.innerHTML = \`<p class="success">\${data.message}</p>\`;
                setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
                loadUsers();
              } else {
                messageDiv.innerHTML = \`<p class="error">\${data.error || '操作失败'}</p>\`;
              }
            } catch (error) {
              console.error('设置权限失败:', error);
              messageDiv.innerHTML = '<p class="error">设置权限失败</p>';
            }
          };
          
          window.deleteUser = async (email) => {
            if (!confirm(\`确定要删除用户 \${email} 吗？此操作将同时删除该用户的所有节点，且不可恢复！\`)) return;
            try {
              const response = await fetch(\`/api/system/users/\${email}\`, {
                method: 'DELETE',
                headers: { 'Authorization': \`Bearer \${token}\` }
              });
              const data = await response.json();
              if (response.ok) {
                messageDiv.innerHTML = \`<p class="success">\${data.message}</p>\`;
                setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
                loadUsers();
              } else {
                messageDiv.innerHTML = \`<p class="error">\${data.error || '删除失败'}</p>\`;
              }
            } catch (error) {
              console.error('删除用户失败:', error);
              messageDiv.innerHTML = '<p class="error">删除用户失败</p>';
            }
          };
          
          await loadSettings();
          await loadUsers();
        });
      `}} />
    </div>
  )
}

export default app
// 公共节点页面JavaScript代码

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

// 检查用户状态
async function checkUserStatus() {
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

// 加载首页统计信息（环形图百分比展示）
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

// 加载公共节点列表 - 使用统一的节点加载函数
async function loadPublicNodes() {
  return loadNodes('/api/public', 'public', 'publicNodesCache', 11);
}

// 查看公共节点详情
window.viewPublicNodeDetail = (nodeId) => {
  try {
    const nodes = window.publicNodesCache || [];
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      alert('未找到节点');
      return;
    }
    
    // 生成连接信息HTML
    const connsHtml = node.connections && node.connections.length > 0 
      ? node.connections.map((conn, idx) => (
          '    <div class="node-info" style="background: white; padding: 8px; margin: 5px 0; border-radius: 4px;">' +
          '      <strong>连接 ' + (idx + 1) + ':</strong> ' + conn.type + ' - ' + conn.ip + ':' + conn.port +
          '    </div>'
        )).join('')
      : '    <div class="node-info">暂无连接信息</div>';
    
    const content = [
      '<div style="display: grid; gap: 15px;">',
      '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
      '    <h3 style="margin-bottom: 10px; color: #667eea;">基本信息</h3>',
      '    <div class="node-info"><strong>节点名称:</strong> ' + escapeHtml(node.node_name) + '</div>',
      '    <div class="node-info"><strong>地域:</strong> ' + (node.region_type === 'domestic' ? '大陆' : '海外') + ' - ' + escapeHtml(node.region_detail || '-') + '</div>',
      '    <div class="node-info"><strong>当前状态:</strong> <span class="node-status ' + node.status + '">' + (node.status === 'online' ? '在线' : '离线') + '</span></div>',
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
    
    document.getElementById('home-detail-node-name').textContent = node.node_name;
    document.getElementById('home-node-detail-content').innerHTML = content;
    document.getElementById('home-node-detail-modal').style.display = 'block';
  } catch (error) {
    console.error('显示节点详情失败:', error);
    alert('显示节点详情失败');
  }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', async () => {
  document.title = 'EasyTier 节点管理系统 - 公共节点';
  const initialized = await checkSystemInit();
  if (initialized) {
    checkUserStatus();
    loadHomeStats();
    loadPublicNodes();
  }

  // 监听开关变化
  const offlineToggleEl = document.getElementById('show-offline-toggle');
  if (offlineToggleEl) {
    offlineToggleEl.addEventListener('change', loadPublicNodes);
  }

  // 模态框关闭事件
document.getElementById('home-detail-close')?.addEventListener('click', () => {
    document.getElementById('home-node-detail-modal').style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.id === 'home-node-detail-modal') {
      document.getElementById('home-node-detail-modal').style.display = 'none';
    }
  });

  // 定期刷新
  setInterval(() => {
    loadHomeStats();
    loadPublicNodes();
  }, 30000);
});
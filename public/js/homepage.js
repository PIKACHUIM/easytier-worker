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
function loadPublicNodes() {
  // 检查离线开关状态
  const showOfflineToggle = document.getElementById('show-offline-toggle');
  const showOffline = showOfflineToggle ? showOfflineToggle.checked : false;
  const apiEndpoint = showOffline ? '/api/public?show_offline=true' : '/api/public';
  
  return loadNodes(apiEndpoint, 'public', 'publicNodesCache', 11);
}

// 查看公共节点详情 - 使用统一的节点详情查看函数
window.viewPublicNodeDetail = (nodeId) => {
  showNodeDetail(nodeId, 'public', 'home-node-detail-modal', 'home-detail-node-name', 'home-node-detail-content');
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
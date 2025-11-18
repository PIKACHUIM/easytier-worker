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
      document.getElementById('token-link').style.display = 'inline';
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

// 加载首页统计信息（新布局：统计卡片+饼图+折线图）
async function loadHomeStats() {
  const nodesTextEl = document.getElementById('nodes-text');
  const connectionsTextEl = document.getElementById('connections-text');
  const bandwidthTextEl = document.getElementById('bandwidth-text');

  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    const totalNodes = Number(data.total_nodes || 0);
    const onlineNodesCount = Number(data.online_nodes || 0);

    // 更新统计卡片
    if (nodesTextEl) nodesTextEl.textContent = onlineNodesCount + '/' + totalNodes;
    
    const currentConnections = Number(data.connection_count_total || 0);
    const maxConnections = Number(data.max_connections_total || 0);
    if (connectionsTextEl) connectionsTextEl.textContent = currentConnections + '/' + maxConnections;

    const currentBandwidth = Number(data.current_bandwidth_total || 0);
    const maxBandwidth = Number(data.max_bandwidth_total || 0);
    if (bandwidthTextEl) bandwidthTextEl.textContent = currentBandwidth.toFixed(1) + '/' + maxBandwidth.toFixed(1) + ' Mbps';

    // 更新饼图
    upsertDonut('nodesChart', 'nodes-chart', onlineNodesCount, totalNodes);
    upsertDonut('connectionsChart', 'connections-chart', currentConnections, maxConnections);
    upsertDonut('bandwidthChart', 'bandwidth-chart', currentBandwidth, maxBandwidth);

    // 更新三个独立的趋势图
    if (data.history) {
      updateNodesTrendChart(data.history.online_nodes || []);
      updateConnectionsTrendChart(data.history.connections || []);
      updateBandwidthTrendChart(data.history.bandwidth || []);
    }
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
      options: { 
        plugins: { 
          legend: { display: false }, 
          tooltip: { enabled: false } 
        }, 
        cutout: '70%',
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    });
    window[chartKey] = chart;
  } else {
    chart.data.datasets[0].data = data;
    chart.update();
  }
}

// 生成时间标签（最近24小时）
function generateTimeLabels() {
  const maxPoints = 144; // 24小时，每10分钟一个点
  const labels = [];
  const now = new Date();
  for (let i = maxPoints - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 10 * 60 * 1000);
    labels.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
  }
  return labels;
}

// 处理历史数据
function processHistoryData(historyData) {
  const maxPoints = 144;
  const values = [];
  for (let i = 0; i < maxPoints; i++) {
    const point = historyData[i];
    values.push(point ? point.value : 0);
  }
  return values;
}

// 创建小型趋势图的通用配置
function createMiniTrendChart(canvasId, data, color, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return null;

  const labels = generateTimeLabels();
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: color,
          borderWidth: 1,
          cornerRadius: 4,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const value = context.parsed.y;
              if (label.includes('带宽')) {
                return value.toFixed(1) + ' Mbps';
              }
              return value.toString();
            }
          }
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: false,
          beginAtZero: true
        }
      },
      elements: {
        point: {
          hoverBackgroundColor: '#fff',
          hoverBorderWidth: 2
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      }
    }
  });
}

// 更新在线节点趋势图
function updateNodesTrendChart(historyData) {
  const data = processHistoryData(historyData);
  let chart = window.nodesTrendChart;
  
  if (!chart) {
    chart = createMiniTrendChart('nodes-trend-chart', data, '#667eea', '在线节点');
    window.nodesTrendChart = chart;
  } else {
    chart.data.labels = generateTimeLabels();
    chart.data.datasets[0].data = data;
    chart.update('none');
  }
}

// 更新连接数趋势图
function updateConnectionsTrendChart(historyData) {
  const data = processHistoryData(historyData);
  let chart = window.connectionsTrendChart;
  
  if (!chart) {
    chart = createMiniTrendChart('connections-trend-chart', data, '#764ba2', '连接数');
    window.connectionsTrendChart = chart;
  } else {
    chart.data.labels = generateTimeLabels();
    chart.data.datasets[0].data = data;
    chart.update('none');
  }
}

// 更新带宽趋势图
function updateBandwidthTrendChart(historyData) {
  const data = processHistoryData(historyData);
  let chart = window.bandwidthTrendChart;
  
  if (!chart) {
    chart = createMiniTrendChart('bandwidth-trend-chart', data, '#28a745', '带宽使用');
    window.bandwidthTrendChart = chart;
  } else {
    chart.data.labels = generateTimeLabels();
    chart.data.datasets[0].data = data;
    chart.update('none');
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
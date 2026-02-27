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
    const tierbandwidth = Number(data.tier_bandwidth_total || 0);
    function formatBandwidth(mbVal) {
      if (mbVal >= 1024 * 1024) return (mbVal / (1024 * 1024)).toFixed(0) + ' T';
      if (mbVal >= 1024) return (mbVal / 1024).toFixed(0) + ' G';
      return mbVal.toFixed(0) + ' M';
    }
    if (bandwidthTextEl) bandwidthTextEl.textContent = formatBandwidth(currentBandwidth) + '/' + formatBandwidth(tierbandwidth);

    // 更新饼图（各卡片使用对应主题色）
    upsertDonut('nodesChart', 'nodes-chart', onlineNodesCount, totalNodes, '#10b981');
    upsertDonut('connectionsChart', 'connections-chart', currentConnections, maxConnections, '#3b82f6');
    upsertDonut('bandwidthChart', 'bandwidth-chart', currentBandwidth, tierbandwidth, '#f59e0b');

    // 更新三个独立的趋势图
    console.log('历史数据:', data.history);
    if (data.history) {
      console.log('在线节点历史:', data.history.online_nodes);
      console.log('连接数历史:', data.history.connections);
      console.log('带宽历史:', data.history.bandwidth);
      console.log('阶梯带宽历史:', data.history.tierband);
      
      updateNodesTrendChart(data.history.online_nodes || [], onlineNodesCount);
      updateConnectionsTrendChart(data.history.connections || [], currentConnections);
      
      // 获取阶梯带宽总量
      const tierbandTotal = Number(data.tier_bandwidth_total || 0);
      updateBandwidthTrendChart(data.history.bandwidth || [], currentBandwidth, data.history.tierband || [], tierbandTotal);
    } else {
      console.log('没有历史数据，使用当前值创建数据点');
      updateNodesTrendChart([], onlineNodesCount);
      updateConnectionsTrendChart([], currentConnections);
      updateBandwidthTrendChart([], currentBandwidth, [], 0);
    }
  } catch (error) {
    console.error('加载首页统计失败:', error);
    if (nodesTextEl) nodesTextEl.textContent = '-/-';
    if (connectionsTextEl) connectionsTextEl.textContent = '-/-';
    if (bandwidthTextEl) bandwidthTextEl.textContent = '-/-';
  }
}

// 封装：图表更新/创建（支持自定义主题色）
function upsertDonut(chartKey, canvasId, value, total, activeColor) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return;
  const rest = Math.max(0, total - value);
  const data = [value, rest];
  const mainColor = activeColor || '#667eea';
  // 空余部分颜色：根据主题自适应
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const restColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const colors = [mainColor, restColor];
  let chart = window[chartKey];
  if (!chart) {
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: { datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 3 }] },
      options: { 
        plugins: { 
          legend: { display: false }, 
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            titleColor: '#94a3b8',
            bodyColor: '#f1f5f9',
            cornerRadius: 8,
            padding: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                const val = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round(val / total * 100) : 0;
                return context.dataIndex === 0 ? `已用: ${val} (${pct}%)` : `剩余: ${val}`;
              }
            }
          }
        }, 
        cutout: '72%',
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
          easing: 'easeInOutCubic'
        }
      }
    });
    window[chartKey] = chart;
  } else {
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
  }
}

// 从历史数据中提取时间标签（按整时段推定）
function generateTimeLabelsFromHistory(historyData) {
  if (!historyData || historyData.length === 0) {
    // 如果没有历史数据，生成一个当前时间的标签
    const now = new Date();
    const roundedTime = roundToNearestTenMinutes(now);
    return [formatTimeLabel(roundedTime)];
  }
  
  const labels = [];
  const now = new Date();
  const latestTime = roundToNearestTenMinutes(now);
  
  console.log('生成时间标签:', {
    dataLength: historyData.length,
    currentTime: now.toLocaleTimeString('zh-CN'),
    latestRoundedTime: latestTime.toLocaleTimeString('zh-CN')
  });
  
  // 从最新时间往前推算
  for (let i = 0; i < historyData.length; i++) {
    const timeOffset = (historyData.length - 1 - i) * 10 * 60 * 1000; // 10分钟间隔
    const time = new Date(latestTime.getTime() - timeOffset);
    const label = formatTimeLabel(time);
    labels.push(label);
    
    if (i < 3) { // 只打印前3个标签用于调试
      console.log(`标签 ${i}:`, {
        time: time.toLocaleTimeString('zh-CN'),
        label: label
      });
    }
  }
  
  console.log('生成的时间标签:', labels);
  return labels;
}

// 将时间向下取整到最近10分钟整点
function roundToNearestTenMinutes(date) {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  // 向下取整到最近的10分钟整点
  const roundedMinutes = Math.floor(minutes / 10) * 10;
  
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  
  console.log('时间取整:', {
    original: date.toLocaleTimeString('zh-CN'),
    rounded: rounded.toLocaleTimeString('zh-CN')
  });
  
  return rounded;
}

// 格式化时间标签，0:00时显示日期
function formatTimeLabel(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (hours === 0 && minutes === 0) {
    // 0:00时显示日期
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  } else {
    // 其他时间显示时:分
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

// 处理历史数据
function processHistoryData(historyData) {
  if (!historyData || historyData.length === 0) {
    return [0]; // 如果没有数据，返回一个默认值
  }
  const values = [];
  for (let i = 0; i < historyData.length; i++) {
    const point = historyData[i];
    if (point && typeof point.value === 'number') {
      values.push(point.value);
    } else if (typeof point === 'number') {
      // 兼容旧格式（直接是数字）
      values.push(point);
    } else {
      values.push(0);
    }
  }
  return values;
}

// 创建小型趋势图的通用配置
function createMiniTrendChart(canvasId, data, color, label, historyData) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return null;

  const labels = generateTimeLabelsFromHistory(historyData);
  
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
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 100,
      onResize: function(chart, size) {
        // 确保图表在resize时正确更新
        if (size.width > 0 && size.height > 0) {
          chart.update('none');
        }
      },
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
                return value.toFixed(1) + ' M';
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

// 创建完整趋势图的配置（显示坐标轴）
function createFullTrendChart(canvasId, data, color, label, historyData) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return null;

  const labels = generateTimeLabelsFromHistory(historyData);
  // 生成渐变色背景
  const gradientFill = (context) => {
    const chart = context.chart;
    const { ctx: c, chartArea } = chart;
    if (!chartArea) return color + '30';
    const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, color + '55');
    gradient.addColorStop(1, color + '05');
    return gradient;
  };

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        borderColor: color,
        backgroundColor: gradientFill,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color,
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 100,
      onResize: function(chart, size) {
        if (size.width > 0 && size.height > 0) {
          chart.update('none');
        }
      },
      plugins: {
        legend: { 
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#64748b',
            font: { size: 11, weight: '500' },
            boxWidth: 10,
            boxHeight: 10,
            borderRadius: 3,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleColor: '#94a3b8',
          bodyColor: '#f1f5f9',
          borderColor: color,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return '🕐 ' + context[0].label;
            },
            label: function(context) {
              const value = context.parsed.y;
              if (label.includes('带宽')) return '📡 ' + value.toFixed(1) + ' M';
              if (label.includes('节点')) return '🖥️ ' + value + ' 个';
              return '🔗 ' + value;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            maxTicksLimit: 8,
            maxRotation: 0,
            callback: function(value, index) {
              const totalLabels = this.chart.data.labels.length;
              const interval = Math.max(1, Math.floor(totalLabels / 8));
              if (index % interval === 0) return this.getLabelForValue(value);
              return '';
            }
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
            lineWidth: 1
          },
          border: { dash: [4, 4], color: 'rgba(148, 163, 184, 0.2)' }
        },
        y: {
          display: true,
          title: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            maxTicksLimit: 5,
            callback: function(value) {
              if (label.includes('带宽')) return value.toFixed(1) + 'M';
              return Math.round(value);
            }
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
            lineWidth: 1
          },
          border: { dash: [4, 4], color: 'rgba(148, 163, 184, 0.2)' }
        }
      },
      animation: {
        duration: 600,
        easing: 'easeInOutCubic'
      }
    }
  });
}

// 创建带宽趋势图的配置（双数据线：当前带宽和阶梯带宽）
function createBandwidthTrendChart(canvasId, currentData, tierbandData, historyData) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.Chart) return null;

  const labels = generateTimeLabelsFromHistory(historyData);
  // 生成渐变色背景
  const gradientGreen = (context) => {
    const chart = context.chart;
    const { ctx: c, chartArea } = chart;
    if (!chartArea) return '#10b98130';
    const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, '#10b98155');
    gradient.addColorStop(1, '#10b98105');
    return gradient;
  };

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '当前带宽',
        data: currentData,
        borderColor: '#10b981',
        backgroundColor: gradientGreen,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#10b981',
        pointHoverBorderWidth: 2
      }, {
        label: '阶梯带宽',
        data: tierbandData,
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 3],
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#f59e0b',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 100,
      onResize: function(chart, size) {
        if (size.width > 0 && size.height > 0) {
          chart.update('none');
        }
      },
      plugins: {
        legend: { 
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#64748b',
            font: { size: 11, weight: '500' },
            boxWidth: 10,
            boxHeight: 10,
            borderRadius: 3,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleColor: '#94a3b8',
          bodyColor: '#f1f5f9',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return '🕐 ' + context[0].label;
            },
            label: function(context) {
              const value = context.parsed.y;
              const icon = context.datasetIndex === 0 ? '📡' : '⚡';
              return icon + ' ' + context.dataset.label + ': ' + value.toFixed(1) + ' M';
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            maxTicksLimit: 8,
            maxRotation: 0,
            callback: function(value, index) {
              const totalLabels = this.chart.data.labels.length;
              const interval = Math.max(1, Math.floor(totalLabels / 8));
              if (index % interval === 0) return this.getLabelForValue(value);
              return '';
            }
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
            lineWidth: 1
          },
          border: { dash: [4, 4], color: 'rgba(148, 163, 184, 0.2)' }
        },
        y: {
          display: true,
          title: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            maxTicksLimit: 5,
            callback: function(value) {
              return value.toFixed(1) + 'M';
            }
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
            lineWidth: 1
          },
          border: { dash: [4, 4], color: 'rgba(148, 163, 184, 0.2)' }
        }
      },
      animation: {
        duration: 600,
        easing: 'easeInOutCubic'
      }
    }
  });
}

// 更新在线节点趋势图
function updateNodesTrendChart(historyData, currentValue) {
  // 如果没有历史数据但有当前值，创建一个数据点
  if ((!historyData || historyData.length === 0) && typeof currentValue === 'number') {
    historyData = [{ value: currentValue, timestamp: new Date().toISOString() }];
  }
  
  const data = processHistoryData(historyData);
  let chart = window.nodesTrendChart;
  
  console.log('节点趋势图数据:', { historyData, data });
  
  if (!chart) {
    // 延迟创建图表，确保DOM和布局完全稳定
    setTimeout(() => {
      const container = document.getElementById('nodes-trend-chart');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        if (containerRect.width > 0 && containerRect.height > 0) {
    chart = createFullTrendChart('nodes-trend-chart', data, '#10b981', '在线节点', historyData);
          window.nodesTrendChart = chart;
        } else {
          console.warn('节点趋势图容器尺寸无效，重试中...');
          setTimeout(() => updateNodesTrendChart(historyData, currentValue), 100);
        }
      }
    }, 50);
  } else {
    chart.data.labels = generateTimeLabelsFromHistory(historyData);
    chart.data.datasets[0].data = data;
    chart.update('none');
  }
}

// 更新连接数趋势图
function updateConnectionsTrendChart(historyData, currentValue) {
  // 如果没有历史数据但有当前值，创建一个数据点
  if ((!historyData || historyData.length === 0) && typeof currentValue === 'number') {
    historyData = [{ value: currentValue, timestamp: new Date().toISOString() }];
  }
  
  const data = processHistoryData(historyData);
  let chart = window.connectionsTrendChart;
  
  console.log('连接数趋势图数据:', { historyData, data });
  
  if (!chart) {
    // 延迟创建图表，确保DOM和布局完全稳定
    setTimeout(() => {
      const container = document.getElementById('connections-trend-chart');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        if (containerRect.width > 0 && containerRect.height > 0) {
          chart = createFullTrendChart('connections-trend-chart', data, '#3b82f6', '连接数', historyData);
          window.connectionsTrendChart = chart;
        } else {
          console.warn('连接数趋势图容器尺寸无效，重试中...');
          setTimeout(() => updateConnectionsTrendChart(historyData, currentValue), 100);
        }
      }
    }, 100);
  } else {
    chart.data.labels = generateTimeLabelsFromHistory(historyData);
    chart.data.datasets[0].data = data;
    chart.update('none');
  }
}

// 更新带宽趋势图
function updateBandwidthTrendChart(historyData, currentValue, tierbandHistoryData, tierbandCurrentValue) {
  // 如果没有历史数据但有当前值，创建一个数据点
  if ((!historyData || historyData.length === 0) && typeof currentValue === 'number') {
    historyData = [{ value: currentValue, timestamp: new Date().toISOString() }];
  }
  
  if ((!tierbandHistoryData || tierbandHistoryData.length === 0) && typeof tierbandCurrentValue === 'number') {
    tierbandHistoryData = [{ value: tierbandCurrentValue, timestamp: new Date().toISOString() }];
  }
  
  const data = processHistoryData(historyData);
  const tierbandData = processHistoryData(tierbandHistoryData);
  let chart = window.bandwidthTrendChart;
  
  console.log('带宽趋势图数据:', { historyData, data, tierbandHistoryData, tierbandData });
  
  if (!chart) {
    chart = createBandwidthTrendChart('bandwidth-trend-chart', data, tierbandData, historyData);
    window.bandwidthTrendChart = chart;
  } else {
    chart.data.labels = generateTimeLabelsFromHistory(historyData);
    chart.data.datasets[0].data = data;
    chart.data.datasets[1].data = tierbandData;
    chart.update('none');
  }
}

// 加载公共节点列表 - 使用统一的节点加载函数
function loadPublicNodes() {
  // 检查离线开关状态
  const showOfflineToggle = document.getElementById('show-offline-toggle');
  const showOffline = showOfflineToggle ? showOfflineToggle.checked : false;
  const apiEndpoint = showOffline ? '/api/public?show_offline=true' : '/api/public';
  
  return loadNodes(apiEndpoint, 'public', 'publicNodesCache', 12);
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

  // 监听窗口大小变化，调整图表大小
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // 获取所有趋势图容器并检查尺寸
      const trendContainers = [
        { chart: window.nodesTrendChart, id: 'nodes-trend-chart' },
        { chart: window.connectionsTrendChart, id: 'connections-trend-chart' },
        { chart: window.bandwidthTrendChart, id: 'bandwidth-trend-chart' }
      ];

      trendContainers.forEach(({ chart, id }) => {
        if (chart) {
          const container = document.getElementById(id);
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            
            console.log(`调整图表 ${id} 大小:`, {
              containerWidth,
              containerHeight,
              canvasWidth: container.width,
              canvasHeight: container.height
            });
            
            // 如果容器有有效尺寸，调整图表大小
            if (containerWidth > 0 && containerHeight > 0) {
              // 设置canvas的实际像素尺寸
              container.width = containerWidth * window.devicePixelRatio;
              container.height = containerHeight * window.devicePixelRatio;
              
              // 设置canvas的CSS尺寸
              container.style.width = containerWidth + 'px';
              container.style.height = containerHeight + 'px';
              
              // 调整图表大小并更新
              chart.resize();
              chart.update('none');
            }
          }
        }
      });
    }, 150); // 增加防抖时间到150ms，确保布局稳定
  });
});
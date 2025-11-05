// 首页脚本 - 加载统计信息和公开节点列表

// 检查系统是否已初始化
async function checkSystemInit() {
  try {
    const response = await fetch('/api/system/check-init');
    const data = await response.json();
    
    if (!data.initialized) {
      // 系统未初始化，跳转到初始化页面
      window.location.href = '/initialize';
      return false;
    }
    return true;
  } catch (error) {
    console.error('检查初始化状态失败:', error);
    return true; // 出错时假定已初始化，避免阻塞
  }
}

// 检查用户登录状态和权限
function checkUserStatus() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      
      // 隐藏登录/注册链接
      document.getElementById('login-link')!.style.display = 'none';
      document.getElementById('register-link')!.style.display = 'none';
      
      // 显示用户相关链接
      document.getElementById('dashboard-link')!.style.display = 'inline';
      document.getElementById('logout-link')!.style.display = 'inline';
      
      // 如果是管理员，显示管理面板和系统设置链接
      if (user.is_admin || user.is_super_admin) {
        document.getElementById('admin-link')!.style.display = 'inline';
        document.getElementById('settings-link')!.style.display = 'inline';
      }
      
      // 退出登录事件
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
  }
}

// 加载统计信息
async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    
    document.getElementById('total-nodes').textContent = data.total_nodes;
    document.getElementById('online-nodes').textContent = data.online_nodes;
    document.getElementById('total-bandwidth').textContent = `${data.total_bandwidth.toFixed(2)} Mbps`;
  } catch (error) {
    console.error('加载统计信息失败:', error);
  }
}

// 加载公开节点列表
async function loadPublicNodes() {
  try {
    const response = await fetch('/api/public');
    const data = await response.json();
    
    const container = document.getElementById('nodes-container');
    
    if (data.nodes.length === 0) {
      container.innerHTML = '<p>暂无在线节点</p>';
      return;
    }
    
    container.innerHTML = data.nodes.map(node => `
      <div class="node-card">
        <h3>${escapeHtml(node.node_name)}</h3>
        <div class="node-info">
          <strong>地域:</strong> ${node.region_type === 'domestic' ? '国内' : '海外'} - ${escapeHtml(node.region_detail)}
        </div>
        <div class="node-info">
          <strong>带宽:</strong> ${node.current_bandwidth.toFixed(2)} / ${node.tier_bandwidth.toFixed(2)} Mbps
        </div>
        <div class="node-info">
          <strong>流量:</strong> ${node.used_traffic.toFixed(2)} / ${node.max_traffic.toFixed(2)} GB
        </div>
        <div class="node-info">
          <strong>连接数:</strong> ${node.connection_count} / ${node.max_connections}
        </div>
        <div class="node-info">
          <strong>允许中转:</strong> ${node.allow_relay ? '是' : '否'}
        </div>
        ${node.tags ? `<div class="node-info"><strong>标签:</strong> ${escapeHtml(node.tags)}</div>` : ''}
        <span class="node-status ${node.status}">${node.status === 'online' ? '在线' : '离线'}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('加载节点列表失败:', error);
    document.getElementById('nodes-container').innerHTML = '<p>加载失败，请稍后重试</p>';
  }
}

// HTML 转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 页面加载时执行
(async () => {
  const initialized = await checkSystemInit();
  if (initialized) {
    checkUserStatus();
    loadStats();
    loadPublicNodes();
  }
})();

// 每 30 秒刷新一次数据
setInterval(() => {
  loadStats();
  loadPublicNodes();
}, 30000);

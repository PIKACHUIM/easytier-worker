// 管理员页面脚本

// 检查登录状态和管理员权限
const authToken = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

if (!authToken || !userStr) {
  alert('请先登录');
  window.location.href = '/login';
}

const user = JSON.parse(userStr!);
// 检查是否为管理员或超级管理员
if (!user.is_admin && !user.is_super_admin) {
  alert('需要管理员权限才能访问此页面');
  window.location.href = '/dashboard';
}

// 退出登录
document.getElementById('logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// 加载所有节点列表
async function loadAllNodes() {
  try {
const response = await fetch('/api/nodes/all', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
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
      container!.innerHTML = '<p>暂无节点</p>';
      return;
    }
    
    container!.innerHTML = data.nodes.map((node: any) => `
      <div class="node-card">
        <h3>${escapeHtml(node.node_name)}</h3>
        <div class="node-info">
          <strong>所有者:</strong> ${escapeHtml(node.user_email)}
        </div>
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
          <strong>修正流量:</strong> ${node.correction_traffic.toFixed(2)} GB
        </div>
        <div class="node-info">
          <strong>连接数:</strong> ${node.connection_count} / ${node.max_connections}
        </div>
        <div class="node-info">
          <strong>创建时间:</strong> ${new Date(node.created_at).toLocaleString()}
        </div>
        <div class="node-info">
          <strong>有效期至:</strong> ${new Date(node.valid_until).toLocaleString()}
        </div>
        <div class="node-info">
          <strong>最后上报:</strong> ${node.last_report_at ? new Date(node.last_report_at).toLocaleString() : '从未上报'}
        </div>
        <span class="node-status ${node.status}">${node.status === 'online' ? '在线' : '离线'}</span>
        <div style="margin-top: 10px;">
          <button onclick="viewNodeDetails(${node.id})">查看详情</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('加载节点列表失败:', error);
  }
}

// HTML 转义函数
function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 查看节点详情
(window as any).viewNodeDetails = async (nodeId: number) => {
  try {
const response = await fetch(`/api/nodes/${nodeId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert(JSON.stringify(data.node, null, 2));
    } else {
      alert(data.error || '获取详情失败');
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    alert('获取详情失败，请稍后重试');
  }
};

// 页面加载时执行
loadAllNodes();

// 每 30 秒刷新一次数据
setInterval(loadAllNodes, 30000);

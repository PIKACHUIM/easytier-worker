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

    const nodes = data.nodes || [];

    // 空节点处理
    if (nodes.length === 0) {
      const tbody = document.getElementById('nodes-container');
      const cardView = document.getElementById('admin-card-view');
      if (tbody) tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:40px;color:var(--text-muted);">暂无节点数据</td></tr>';
      if (cardView) cardView.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">暂无节点数据</div>';
      return;
    }

    // 调用统一渲染函数（同时处理表格行和卡片视图）
    if ((window as any).renderNodeRows) {
      const rowsHtml = (window as any).renderNodeRows('admin', nodes);
      const tbody = document.getElementById('nodes-container');
      if (tbody) tbody.innerHTML = rowsHtml;
    }

  } catch (error) {
    console.error('加载节点列表失败:', error);
    const tbody = document.getElementById('nodes-container');
    if (tbody) tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:40px;color:var(--danger);">加载失败，请稍后重试</td></tr>';
  }
}

// 查看节点详情
(window as any).viewNodeDetail = async (nodeId: number) => {
  try {
    const response = await fetch(`/api/nodes/${nodeId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const node = data.node;
    const modal = document.getElementById('admin-node-detail-modal');
    const nameEl = document.getElementById('admin-detail-node-name');
    const contentEl = document.getElementById('admin-node-detail-content');
    if (!modal || !contentEl) return;

    if (nameEl) nameEl.textContent = node.node_name;
    contentEl.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:14px;">
        <div><span style="color:var(--text-muted);">所有者：</span>${escapeHtml(node.user_email || '-')}</div>
        <div><span style="color:var(--text-muted);">状态：</span>${node.status === 'online' ? '🟢 在线' : '🔴 离线'}</div>
        <div><span style="color:var(--text-muted);">地域：</span>${node.region_type === 'domestic' ? '大陆' : '海外'} - ${escapeHtml(node.region_detail || '-')}</div>
        <div><span style="color:var(--text-muted);">启用状态：</span>${getNodeStatusText(node.is_enabled)}</div>
        <div><span style="color:var(--text-muted);">带宽：</span>${Number(node.current_bandwidth).toFixed(2)} / ${Number(node.max_bandwidth).toFixed(2)} Mbps</div>
        <div><span style="color:var(--text-muted);">连接数：</span>${node.connection_count} / ${node.max_connections}</div>
        <div><span style="color:var(--text-muted);">流量：</span>${Number(node.used_traffic).toFixed(2)} / ${node.max_traffic === 0 ? '∞' : Number(node.max_traffic).toFixed(2)} GB</div>
        <div><span style="color:var(--text-muted);">修正流量：</span>${Number(node.correction_traffic || 0).toFixed(2)} GB</div>
        <div><span style="color:var(--text-muted);">创建时间：</span>${new Date(node.created_at).toLocaleString()}</div>
        <div><span style="color:var(--text-muted);">有效期至：</span>${new Date(node.valid_until).toLocaleString()}</div>
        <div><span style="color:var(--text-muted);">最后上报：</span>${node.last_report_at ? new Date(node.last_report_at).toLocaleString() : '从未上报'}</div>
        <div><span style="color:var(--text-muted);">允许中转：</span>${node.allow_relay ? '是' : '否'}</div>
        ${node.tags ? `<div style="grid-column:1/-1;"><span style="color:var(--text-muted);">标签：</span>${escapeHtml(node.tags)}</div>` : ''}
        ${node.notes ? `<div style="grid-column:1/-1;"><span style="color:var(--text-muted);">备注：</span>${escapeHtml(node.notes)}</div>` : ''}
      </div>
    `;
    modal.style.display = 'flex';

    const closeBtn = document.getElementById('admin-detail-close');
    if (closeBtn) {
      closeBtn.onclick = () => { modal.style.display = 'none'; };
    }
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
  } catch (error) {
    console.error('获取详情失败:', error);
    alert('获取详情失败，请稍后重试');
  }
};

// 编辑节点（管理员）
(window as any).editNode = async (nodeId: number) => {
  // 跳转到节点编辑页或弹出编辑模态框
  window.location.href = `/admin/nodes/${nodeId}/edit`;
};

// 删除节点（管理员）
(window as any).deleteNode = async (nodeId: number) => {
  if (!confirm('确定要删除这个节点吗？此操作不可撤销！')) return;
  try {
    const response = await fetch(`/api/nodes/${nodeId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (response.ok) {
      loadAllNodes();
    } else {
      alert(data.error || '删除失败');
    }
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败，请稍后重试');
  }
};

// HTML 转义函数
function escapeHtml(text: string) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 获取节点启用状态文本
function getNodeStatusText(isEnabled: number): string {
  switch (isEnabled) {
    case -1: return 'ℹ️ 待审核';
    case 0:  return '❌ 已禁用';
    case 1:  return '✅ 已启用';
    default: return '❔ 未知';
  }
}

// 页面加载时执行
loadAllNodes();

// 每 30 秒刷新一次数据
setInterval(loadAllNodes, 30000);
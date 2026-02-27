// 仪表板页面脚本

// 检查登录状态
const authToken = localStorage.getItem('token');
if (!authToken) {
  window.location.href = '/login';
}

// 检查用户权限并显示管理员链接
function checkAdminAccess() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      
      // 如果是管理员，显示管理面板和系统设置链接
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

// 退出登录
document.getElementById('logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
});

// 加载用户的节点列表
async function loadMyNodes() {
  try {
    const response = await fetch('/api/nodes/my', {
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
    const cardView = document.getElementById('dashboard-card-view');

    if (data.nodes.length === 0) {
      const emptyHtml = '<tr><td colspan="12" style="text-align:center;padding:40px;color:var(--text-muted);">您还没有添加任何节点</td></tr>';
      if (container) container.innerHTML = emptyHtml;
      if (cardView) cardView.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">您还没有添加任何节点</div>';
      return;
    }

    // 使用全局渲染函数（同时处理表格行和卡片视图）
    if ((window as any).renderNodeRows) {
      const rowsHtml = (window as any).renderNodeRows('dashboard', data.nodes);
      if (container) container.innerHTML = rowsHtml;
    }
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

// 添加节点按钮
document.getElementById('add-node-btn')?.addEventListener('click', () => {
  showNodeModal();
});

// 显示节点模态框
function showNodeModal(nodeId?: number) {
  const modal = document.getElementById('node-modal');
  const modalTitle = document.getElementById('modal-title');
  
  if (nodeId) {
    modalTitle!.textContent = '编辑节点';
    // TODO: 加载节点数据
  } else {
    modalTitle!.textContent = '添加节点';
    (document.getElementById('node-form') as HTMLFormElement).reset();
  }
  
  modal!.style.display = 'block';
}

// 关闭模态框
document.querySelector('.close')?.addEventListener('click', () => {
  document.getElementById('node-modal')!.style.display = 'none';
});

// 节点表单提交
document.getElementById('node-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    node_name: (document.getElementById('node-name') as HTMLInputElement).value,
    region_type: (document.getElementById('region-type') as HTMLSelectElement).value,
    region_detail: (document.getElementById('region-detail') as HTMLInputElement).value,
    connections: [], // TODO: 从表单收集连接信息
    tier_bandwidth: parseFloat((document.getElementById('tier-bandwidth') as HTMLInputElement).value),
    max_bandwidth: parseFloat((document.getElementById('max-bandwidth') as HTMLInputElement).value),
    max_traffic: parseFloat((document.getElementById('max-traffic') as HTMLInputElement).value),
    reset_cycle: parseInt((document.getElementById('reset-cycle') as HTMLInputElement).value),
    max_connections: parseInt((document.getElementById('max-connections') as HTMLInputElement).value),
    valid_until: (document.getElementById('valid-until') as HTMLInputElement).value,
    allow_relay: (document.getElementById('allow-relay') as HTMLInputElement).checked ? 1 : 0,
    tags: (document.getElementById('tags') as HTMLInputElement).value,
    notes: (document.getElementById('notes') as HTMLTextAreaElement).value,
  };
  
  try {
const response = await fetch('/api/nodes/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('节点添加成功');
      document.getElementById('node-modal')!.style.display = 'none';
      loadMyNodes();
    } else {
      alert(data.error || '操作失败');
    }
  } catch (error) {
    console.error('操作失败:', error);
    alert('操作失败，请稍后重试');
  }
});

// 编辑节点
(window as any).editNode = async (nodeId: number) => {
  showNodeModal(nodeId);
  // TODO: 加载节点数据并填充表单
};

// 复制token
(window as any).copyToken = async (token: string) => {
  try {
    await navigator.clipboard.writeText(token);
    alert('Token已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    // 降级方案：使用传统方法
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

// 重新生成token
(window as any).regenerateToken = async (nodeId: number) => {
  if (!confirm('确定要重新生成Token吗？旧Token将失效！')) {
    return;
  }
  
  try {
const response = await fetch(`/api/nodes/${nodeId}/regenerate-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Token重新生成成功！');
      // 更新页面上的token显示
      const tokenElement = document.getElementById(`token-${nodeId}`);
      if (tokenElement) {
        tokenElement.textContent = data.token;
      }
      // 重新加载节点列表以确保数据同步
      loadMyNodes();
    } else {
      alert(data.error || '重新生成Token失败');
    }
  } catch (error) {
    console.error('重新生成Token失败:', error);
    alert('重新生成Token失败，请稍后重试');
  }
};

// 删除节点
(window as any).deleteNode = async (nodeId: number) => {
  if (!confirm('确定要删除这个节点吗？')) {
    return;
  }
  
  try {
const response = await fetch(`/api/nodes/${nodeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
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

// 页面加载时执行
checkAdminAccess();
loadMyNodes();

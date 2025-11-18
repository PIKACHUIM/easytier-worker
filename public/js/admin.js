// 管理员页面JavaScript代码

// 检查用户登录状态和权限
async function checkAdminAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  
  try {
    // 调用API获取最新的用户信息
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        alert('登录已过期，请重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
      }
      throw new Error('获取用户信息失败');
    }
    
    const user = await response.json();
    
    // 更新localStorage中的用户信息
    localStorage.setItem('user', JSON.stringify(user));
    
    // 检查管理员权限
    if (!user.is_admin && !user.is_super_admin) {
      alert('您的管理员权限已被撤销，无法访问此页面');
      window.location.href = '/dashboard';
      return false;
    }
    
    return user;
  } catch (error) {
    console.error('验证用户权限失败:', error);
    alert('验证权限失败，请重新登录');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return false;
  }
}

// 管理员连接方式管理
window.adminConnections = [];

function addAdminConnectionItem(connection = null) {
  const container = document.getElementById('admin-connections-container');
  if (!container) return;
  
  const index = window.adminConnections.length;
  const connectionData = connection || { type: 'TCP', ip: '', port: '' };
  window.adminConnections.push(connectionData);
  
  const connectionDiv = document.createElement('div');
  connectionDiv.className = 'connection-item';
  connectionDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 2fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: center;';
  connectionDiv.innerHTML = `
    <select id="admin-connection-type-${index}" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      <option value="TCP" ${connectionData.type === 'TCP' ? 'selected' : ''}>TCP</option>
      <option value="UDP" ${connectionData.type === 'UDP' ? 'selected' : ''}>UDP</option>
      <option value="WS" ${connectionData.type === 'WS' ? 'selected' : ''}>WebSocket</option>
      <option value="WSS" ${connectionData.type === 'WSS' ? 'selected' : ''}>WebSocket Secure</option>
      <option value="WG" ${connectionData.type === 'WG' ? 'selected' : ''}>WireGuard</option>
    </select>
    <input type="text" id="admin-connection-ip-${index}" placeholder="IP地址" value="${connectionData.ip}" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
    <input type="number" id="admin-connection-port-${index}" placeholder="端口" value="${connectionData.port}" required min="1" max="65535" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
    <button type="button" onclick="removeAdminConnectionItem(${index})" style="padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
  `;
  
  container.appendChild(connectionDiv);
}

window.removeAdminConnectionItem = function(index) {
  const container = document.getElementById('admin-connections-container');
  if (!container) return;
  
  // 从数据中移除
  window.adminConnections.splice(index, 1);
  
  // 清空容器
  container.innerHTML = '';
  
  // 重新渲染所有连接项
  const tempConnections = [...window.adminConnections];
  window.adminConnections = [];
  tempConnections.forEach(conn => addAdminConnectionItem(conn));
};

window.clearAdminConnections = function() {
  const container = document.getElementById('admin-connections-container');
  if (container) {
    container.innerHTML = '';
  }
  window.adminConnections = [];
};

window.collectAdminConnections = function() {
  const result = [];
  for (let i = 0; i < window.adminConnections.length; i++) {
    const type = document.getElementById(`admin-connection-type-${i}`);
    const ip = document.getElementById(`admin-connection-ip-${i}`);
    const port = document.getElementById(`admin-connection-port-${i}`);
    
    if (type && ip && port) {
      const connData = {
        type: type.value,
        ip: ip.value.trim(),
        port: parseInt(port.value)
      };
      
      if (connData.ip && connData.port) {
        result.push(connData);
      }
    }
  }
  return result;
};

// 加载所有节点数据 - 使用统一的节点加载函数
function loadAllNodes() {
  return loadNodes('/api/nodes/all', 'admin', 'adminNodesCache', 12);
}

// 查看管理员节点详情 - 使用统一的节点详情查看函数
window.viewAdminNodeDetail = (nodeId) => {
  showNodeDetail(nodeId, 'admin', 'admin-node-detail-modal', 'admin-detail-node-name', 'admin-node-detail-content');
};

// 复制管理员Token
window.copyAdminToken = (nodeId) => {
  const nodes = window.adminNodesCache || [];
  const node = nodes.find(n => n.id === nodeId);
  if (node && node.report_token) {
    navigator.clipboard.writeText(node.report_token).then(() => {
      alert('Token已复制到剪贴板');
    }).catch(() => {
      // 备用方案
      const textArea = document.createElement('textarea');
      textArea.value = node.report_token;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Token已复制到剪贴板');
    });
  } else {
    alert('Token不存在');
  }
};

// 重新生成管理员Token
window.regenerateAdminToken = async (nodeId) => {
  if (!confirm('确定要重新生成Token吗？重新生成后需要更新节点配置。')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/nodes/${nodeId}/regenerate-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('Token重新生成成功');
      loadAllNodes();
      document.getElementById('admin-node-detail-modal').style.display = 'none';
    } else {
      const result = await response.json();
      alert(result.message || '重新生成Token失败');
    }
  } catch (error) {
    console.error('重新生成Token失败:', error);
    alert('网络错误，请稍后重试');
  }
};

// 编辑管理员节点
window.editAdminNode = (nodeId) => {
  const nodes = window.adminNodesCache || [];
  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    alert('未找到节点');
    return;
  }
  
// 填充表单数据
  document.getElementById('admin-node-id').value = node.id;
  document.getElementById('admin-node-name').value = node.node_name;
  document.getElementById('admin-region-type').value = node.region_type;
  document.getElementById('admin-region-detail').value = node.region_detail || '';
  document.getElementById('admin-max-bandwidth').value = node.max_bandwidth || '';
  document.getElementById('admin-max-connections').value = node.max_connections || '';
  document.getElementById('admin-max-traffic').value = node.max_traffic || '';
  document.getElementById('admin-reset-cycle').value = node.reset_cycle || '';
  document.getElementById('admin-allow-relay').checked = node.allow_relay;
  document.getElementById('admin-tags').value = node.tags || '';
  document.getElementById('admin-notes').value = node.notes || '';
  
  // 处理有效期和长期有效逻辑
  const validLongTermCheckbox = document.getElementById('admin-valid-long-term');
  const validUntilInput = document.getElementById('admin-valid-until');
  
  if (validLongTermCheckbox && validUntilInput) {
    const validUntil = node.valid_until ? new Date(node.valid_until).toISOString().split('T')[0] : '';
    
    if (validUntil === '2999-12-31') {
      // 长期有效
      validLongTermCheckbox.checked = true;
      validUntilInput.value = '2999-12-31';
      validUntilInput.disabled = true;
    } else {
      // 非长期有效
      validLongTermCheckbox.checked = false;
      validUntilInput.value = validUntil || '';
      validUntilInput.disabled = false;
    }
  }
  
  // 加载现有连接方式
  window.clearAdminConnections();
  if (node.connections && node.connections.length > 0) {
    node.connections.forEach(conn => addAdminConnectionItem(conn));
  } else {
    addAdminConnectionItem(); // 如果没有连接，添加一个默认的
  }
  
  document.getElementById('admin-modal-title').textContent = '编辑节点';
  document.getElementById('admin-node-modal').style.display = 'block';
};

// 删除管理员节点
window.deleteAdminNode = async (nodeId) => {
  if (!confirm('确定要删除这个节点吗？此操作不可恢复。')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/nodes/${nodeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('节点删除成功');
      loadAllNodes();
    } else {
      const result = await response.json();
      alert(result.message || '删除失败');
    }
  } catch (error) {
    console.error('删除节点失败:', error);
    alert('网络错误，请稍后重试');
  }
};

// 管理员节点表单提交
window.handleAdminNodeSubmit = async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '保存中...';
  
  // 收集连接方式数据
  const connections = window.collectAdminConnections();
  if (connections.length === 0) {
    alert('请至少添加一个连接方式');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    return;
  }
  
const data = {
    node_name: document.getElementById('admin-node-name').value,
    region_type: document.getElementById('admin-region-type').value,
    region_detail: document.getElementById('admin-region-detail').value,
    connections: connections,
    max_bandwidth: parseFloat(document.getElementById('admin-max-bandwidth').value) || 0,
    max_connections: parseInt(document.getElementById('admin-max-connections').value) || 0,
    max_traffic: parseFloat(document.getElementById('admin-max-traffic').value) || 0,
    reset_cycle: parseInt(document.getElementById('admin-reset-cycle').value) || 0,
    allow_relay: document.getElementById('admin-allow-relay').checked ? 1 : 0,
    tags: document.getElementById('admin-tags').value,
    notes: document.getElementById('admin-notes').value,
    valid_until: document.getElementById('admin-valid-until').value || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
  
  const nodeId = document.getElementById('admin-node-id').value;
  
  try {
    const token = localStorage.getItem('token');
    const url = nodeId ? `/api/nodes/${nodeId}` : '/api/nodes';
    const method = nodeId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
if (response.ok) {
      alert(nodeId ? '节点更新成功' : '节点添加成功');
      form.reset();
      window.clearAdminConnections();
      document.getElementById('admin-node-modal').style.display = 'none';
      
      // 异步加载节点列表，错误不影响成功提示
      loadAllNodes().catch(error => {
        console.error('刷新节点列表失败:', error);
        // 不显示错误提示，因为节点创建/更新已经成功
      });
    } else {
      const result = await response.json();
      alert(result.error || (nodeId ? '更新失败' : '添加失败'));
    }
  } catch (error) {
    console.error('保存节点失败:', error);
    alert('网络错误，请稍后重试');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', async () => {
  document.title = 'EasyTier 节点管理系统 - 管理员面板';
  
  const user = await checkAdminAuth();
  if (!user) return;
  
  // 显示导航链接
  const tokenLink = document.getElementById('token-link');
  if (tokenLink) tokenLink.style.display = 'inline';
  
  const userInfoElement = document.getElementById('user-info-text');
  if (userInfoElement) {
    userInfoElement.textContent = `欢迎，${user.username}（管理员）`;
  }
  
  loadAllNodes();
  
// 模态框事件监听
  document.getElementById('admin-detail-close')?.addEventListener('click', () => {
    document.getElementById('admin-node-detail-modal').style.display = 'none';
  });
  
  document.getElementById('admin-modal-close')?.addEventListener('click', () => {
    document.getElementById('admin-node-modal').style.display = 'none';
  });
  
document.getElementById('add-node-btn')?.addEventListener('click', () => {
    document.getElementById('admin-modal-title').textContent = '添加节点';
    document.getElementById('admin-node-form').reset();
    document.getElementById('admin-node-id').value = '';
    window.clearAdminConnections();
    addAdminConnectionItem(); // 添加一个默认连接项
    
    // 设置默认值：默认勾选长期有效
    const validLongTermCheckbox = document.getElementById('admin-valid-long-term');
    const validUntilInput = document.getElementById('admin-valid-until');
    if (validLongTermCheckbox && validUntilInput) {
      validLongTermCheckbox.checked = true;
      validUntilInput.value = '2999-12-31';
      validUntilInput.disabled = true;
    }
    
    document.getElementById('admin-node-modal').style.display = 'block';
  });
  
// 表单提交事件
  const adminNodeForm = document.getElementById('admin-node-form');
  if (adminNodeForm) {
    adminNodeForm.addEventListener('submit', window.handleAdminNodeSubmit);
  }
  
// 添加连接按钮事件
  const addAdminConnectionBtn = document.getElementById('admin-add-connection-btn');
  if (addAdminConnectionBtn) {
    addAdminConnectionBtn.addEventListener('click', () => {
      addAdminConnectionItem();
    });
  }
  
  // 长期有效复选框事件
  const validLongTermCheckbox = document.getElementById('admin-valid-long-term');
  const validUntilInput = document.getElementById('admin-valid-until');
  
  // 设置默认值：默认勾选长期有效
  if (validLongTermCheckbox && validUntilInput) {
    validLongTermCheckbox.checked = true;
    validUntilInput.value = '2999-12-31';
    validUntilInput.disabled = true;
    
    validLongTermCheckbox.addEventListener('change', function() {
      if (this.checked) {
        // 勾选长期有效，设置为2999/12/31并禁用输入
        validUntilInput.value = '2999-12-31';
        validUntilInput.disabled = true;
      } else {
        // 取消勾选，设置为一年后的今天并启用输入
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        validUntilInput.value = oneYearLater.toISOString().split('T')[0];
        validUntilInput.disabled = false;
      }
    });
  }
  
  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.id === 'admin-node-detail-modal') {
      document.getElementById('admin-node-detail-modal').style.display = 'none';
    }
    if (target && target.id === 'admin-node-modal') {
      document.getElementById('admin-node-modal').style.display = 'none';
    }
  });
  
  // 定期刷新
  setInterval(() => {
    loadAllNodes();
  }, 30000);
});
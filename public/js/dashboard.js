// 我的节点页面JavaScript代码

const token = localStorage.getItem('token');
if (!token) window.location.href = '/login';
document.title = 'EasyTier 节点管理系统 - 我的节点';

let currentEditingNodeId = null;



// 连接方式管理
window.connections = [];

function addConnectionItem(connection = null) {
  const container = document.getElementById('dashboard-connections-container');
  if (!container) return;
  
  const index = window.connections.length;
  const connectionData = connection || { type: 'TCP', ip: '', port: '' };
  window.connections.push(connectionData);
  
  const connectionDiv = document.createElement('div');
  connectionDiv.className = 'connection-item';
  connectionDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 2fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: center;';
  connectionDiv.innerHTML = `
    <select id="dashboard-connection-type-${index}" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      <option value="TCP" ${connectionData.type === 'TCP' ? 'selected' : ''}>TCP</option>
      <option value="UDP" ${connectionData.type === 'UDP' ? 'selected' : ''}>UDP</option>
      <option value="WS" ${connectionData.type === 'WS' ? 'selected' : ''}>WebSocket</option>
      <option value="WSS" ${connectionData.type === 'WSS' ? 'selected' : ''}>WebSocket Secure</option>
      <option value="WG" ${connectionData.type === 'WG' ? 'selected' : ''}>WireGuard</option>
    </select>
    <input type="text" id="dashboard-connection-ip-${index}" placeholder="IP地址" value="${connectionData.ip}" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
    <input type="number" id="dashboard-connection-port-${index}" placeholder="端口" value="${connectionData.port}" required min="1" max="65535" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
    <button type="button" onclick="removeConnectionItem(${index})" style="padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
  `;
  
  container.appendChild(connectionDiv);
}

window.removeConnectionItem = function(index) {
  const container = document.getElementById('dashboard-connections-container');
  if (!container) return;
  
  // 从数据中移除
  window.connections.splice(index, 1);
  
  // 清空容器
  container.innerHTML = '';
  
  // 重新渲染所有连接项
  const tempConnections = [...window.connections];
  window.connections = [];
  tempConnections.forEach(conn => addConnectionItem(conn));
};

window.clearConnections = function() {
  const container = document.getElementById('dashboard-connections-container');
  if (container) {
    container.innerHTML = '';
  }
  window.connections = [];
};

window.collectConnections = function() {
  const result = [];
  for (let i = 0; i < window.connections.length; i++) {
    const type = document.getElementById(`dashboard-connection-type-${i}`);
    const ip = document.getElementById(`dashboard-connection-ip-${i}`);
    const port = document.getElementById(`dashboard-connection-port-${i}`);
    
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

function checkAdminAccess() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const tokenLink = document.getElementById('token-link');
      if (tokenLink) tokenLink.style.display = 'inline';
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

// 加载我的节点数据 - 使用统一的节点加载函数
function loadMyNodes() {
  return loadNodes('/api/nodes/my', 'my', 'myNodesCache', 13, '您还没有添加任何节点，点击上方"添加节点"按钮开始添加');
}

// 查看节点详情 - 使用统一的节点详情查看函数
window.viewNodeDetail = (nodeId) => {
  showNodeDetail(nodeId, 'my', 'dashboard-node-detail-modal', 'dashboard-detail-node-name', 'dashboard-node-detail-content');
};

// 复制Token
window.copyToken = (token) => {
  if (!token) {
    alert('Token不存在');
    return;
  }
  
  navigator.clipboard.writeText(token).then(() => {
    alert('Token已复制到剪贴板');
  }).catch(() => {
    // 备用方案
    const textArea = document.createElement('textarea');
    textArea.value = token;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Token已复制到剪贴板');
  });
};

// 重新生成Token
window.regenerateToken = async (nodeId) => {
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
      loadMyNodes();
      document.getElementById('node-detail-modal').style.display = 'none';
    } else {
      const result = await response.json();
      alert(result.message || '重新生成Token失败');
    }
  } catch (error) {
    console.error('重新生成Token失败:', error);
    alert('网络错误，请稍后重试');
  }
};

// 编辑节点
window.editNode = (nodeId) => {
  const nodes = window.myNodesCache || [];
  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    alert('未找到节点');
    return;
  }
  
// 填充表单数据
  document.getElementById('dashboard-node-id').value = node.id;
  document.getElementById('dashboard-node-name').value = node.node_name;
  document.getElementById('dashboard-region-type').value = node.region_type;
  document.getElementById('dashboard-region-detail').value = node.region_detail || '';
  document.getElementById('dashboard-max-bandwidth').value = node.max_bandwidth || '';
  document.getElementById('dashboard-max-connections').value = node.max_connections || '';
  document.getElementById('dashboard-max-traffic').value = node.max_traffic || '';
  document.getElementById('dashboard-reset-cycle').value = node.reset_cycle || '';
  document.getElementById('dashboard-allow-relay').checked = node.allow_relay;
  document.getElementById('dashboard-tags').value = node.tags || '';
  document.getElementById('dashboard-notes').value = node.notes || '';
  
  // 处理有效期和长期有效逻辑
  const validLongTermCheckbox = document.getElementById('dashboard-valid-long-term');
  const validUntilInput = document.getElementById('dashboard-valid-until');
  
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
  window.clearConnections();
  if (node.connections && node.connections.length > 0) {
    node.connections.forEach(conn => addConnectionItem(conn));
  } else {
    addConnectionItem(); // 如果没有连接，添加一个默认的
  }
  
  document.getElementById('dashboard-modal-title').textContent = '编辑节点';
  document.getElementById('dashboard-node-modal').style.display = 'block';
};

// 删除节点
window.deleteNode = async (nodeId) => {
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
      loadMyNodes();
    } else {
      const result = await response.json();
      alert(result.message || '删除失败');
    }
  } catch (error) {
    console.error('删除节点失败:', error);
    alert('网络错误，请稍后重试');
  }
};

// 添加节点表单提交
window.handleNodeSubmit = async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '保存中...';
  
  // 收集连接方式数据
  const connections = window.collectConnections();
  if (connections.length === 0) {
    alert('请至少添加一个连接方式');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    return;
  }
  
const data = {
    node_name: document.getElementById('dashboard-node-name').value,
    region_type: document.getElementById('dashboard-region-type').value,
    region_detail: document.getElementById('dashboard-region-detail').value,
    connections: connections,
    max_bandwidth: parseFloat(document.getElementById('dashboard-max-bandwidth').value) || 0,
    max_connections: parseInt(document.getElementById('dashboard-max-connections').value) || 0,
    max_traffic: parseFloat(document.getElementById('dashboard-max-traffic').value) || 0,
    reset_cycle: parseInt(document.getElementById('dashboard-reset-cycle').value) || 30,
    allow_relay: document.getElementById('dashboard-allow-relay').checked ? 1 : 0,
    tags: document.getElementById('dashboard-tags').value,
    notes: document.getElementById('dashboard-notes').value,
    valid_until: document.getElementById('dashboard-valid-until')?.value || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };
  
  const nodeId = document.getElementById('dashboard-node-id').value;
  
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
      window.clearConnections();
      document.getElementById('dashboard-node-modal').style.display = 'none';
      
      // 异步加载节点列表，错误不影响成功提示
      loadMyNodes().catch(error => {
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

// 检查用户权限
function checkUserPermissions() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }
  return null;
}




// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
  document.title = 'EasyTier 节点管理系统 - 我的节点';
  
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  const user = checkUserPermissions();
  if (user) {
    const userInfoElement = document.getElementById('user-info-text');
    if (userInfoElement) {
      userInfoElement.textContent = `欢迎，${user.email || user.username}`;
    }
  }
  
  loadMyNodes();
  checkAdminAccess();
  
  // 模态框事件监听
  document.getElementById('dashboard-detail-close')?.addEventListener('click', () => {
    document.getElementById('dashboard-node-detail-modal').style.display = 'none';
  });
  
document.getElementById('dashboard-modal-close')?.addEventListener('click', () => {
    document.getElementById('dashboard-node-modal').style.display = 'none';
  });
  
document.getElementById('add-node-btn')?.addEventListener('click', () => {
    document.getElementById('dashboard-modal-title').textContent = '添加节点';
    document.getElementById('dashboard-node-form').reset();
    document.getElementById('dashboard-node-id').value = '';
    window.clearConnections();
    addConnectionItem(); // 添加一个默认连接项
    
    // 设置默认值：默认勾选长期有效
    const validLongTermCheckbox = document.getElementById('dashboard-valid-long-term');
    const validUntilInput = document.getElementById('dashboard-valid-until');
    if (validLongTermCheckbox && validUntilInput) {
      validLongTermCheckbox.checked = true;
      validUntilInput.value = '2999-12-31';
      validUntilInput.disabled = true;
    }
    
    document.getElementById('dashboard-node-modal').style.display = 'block';
  });
  
// 表单提交事件
  const nodeForm = document.getElementById('dashboard-node-form');
  if (nodeForm) {
    nodeForm.addEventListener('submit', window.handleNodeSubmit);
  }
  
// 添加连接按钮事件
  const addConnectionBtn = document.getElementById('dashboard-add-connection-btn');
  if (addConnectionBtn) {
    addConnectionBtn.addEventListener('click', () => {
      addConnectionItem();
    });
  }
  
  // 长期有效复选框事件
  const validLongTermCheckbox = document.getElementById('dashboard-valid-long-term');
  const validUntilInput = document.getElementById('dashboard-valid-until');
  
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
    if (target && target.id === 'dashboard-node-detail-modal') {
      document.getElementById('dashboard-node-detail-modal').style.display = 'none';
    }
    if (target && target.id === 'dashboard-node-modal') {
      document.getElementById('dashboard-node-modal').style.display = 'none';
    }
  });
  
  // 定期刷新
  setInterval(() => {
    loadMyNodes();
  }, 30000);
});
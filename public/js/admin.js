// 管理员页面JavaScript代码

// 检查用户登录状态和权限
function checkAdminAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (!user.is_admin && !user.is_super_admin) {
        alert('无权限访问管理员页面');
        window.location.href = '/dashboard';
        return false;
      }
      return user;
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }
  
  alert('用户信息异常，请重新登录');
  window.location.href = '/login';
  return false;
}

// 转义HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 渲染节点行
function renderNodeRows(nodes, mode) {
  return nodes.map(node => `
    <tr>
      <td>${escapeHtml(node.node_name)}</td>
      <td><span class="node-status ${node.status}">${node.status === 'online' ? '在线' : '离线'}</span></td>
      <td>${node.region_type === 'domestic' ? '大陆' : '海外'} - ${escapeHtml(node.region_detail || '-')}</td>
      <td>${(node.current_bandwidth || 0).toFixed(2)} Mbps</td>
      <td>${(node.max_bandwidth || 0).toFixed(2)} Mbps</td>
      <td>${node.connection_count} / ${node.max_connections}</td>
      <td>${(node.used_traffic || 0).toFixed(2)} GB</td>
      <td>${node.max_traffic === 0 ? '无限制' : node.max_traffic.toFixed(2) + ' GB'}</td>
      <td>${node.allow_relay ? '是' : '否'}</td>
      <td>${escapeHtml(node.tags || '-')}</td>
      <td>${escapeHtml(node.notes || '-')}</td>
      <td>
        <button class="btn-small" onclick="viewAdminNodeDetail(${node.id})">详情</button>
        <button class="btn-small" onclick="editAdminNode(${node.id})">编辑</button>
        <button class="btn-small btn-danger" onclick="deleteAdminNode(${node.id})">删除</button>
      </td>
    </tr>
  `).join('');
}

// 加载所有节点数据
async function loadAllNodes() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/nodes/all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    const container = document.getElementById('nodes-container');
    
    if (response.ok) {
      // 缓存节点数据供详情查看使用
      window.adminNodesCache = data.nodes;
      
      if (data.nodes.length === 0) {
        container.innerHTML = '<tr><td colspan="12" style="text-align: center;">暂无节点</td></tr>';
        return;
      }
      
      container.innerHTML = renderNodeRows(data.nodes, 'admin');
    } else {
      container.innerHTML = '<tr><td colspan="12" style="text-align: center;">加载失败，请稍后重试</td></tr>';
    }
  } catch (error) {
    console.error('加载节点列表失败:', error);
    document.getElementById('nodes-container').innerHTML = '<tr><td colspan="12" style="text-align: center;">加载失败，请稍后重试</td></tr>';
  }
}

// 查看管理员节点详情
window.viewAdminNodeDetail = (nodeId) => {
  try {
    const nodes = window.adminNodesCache || [];
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      alert('未找到节点');
      return;
    }
    
    const content = [
      '<div style="display: grid; gap: 15px;">',
      '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
      '    <h3 style="margin-bottom: 10px; color: #667eea;">基本信息</h3>',
      '    <div class="node-info"><strong>节点名称:</strong> ' + escapeHtml(node.node_name) + '</div>',
      '    <div class="node-info"><strong>所有者:</strong> ' + escapeHtml(node.owner_name || '未知') + '</div>',
      '    <div class="node-info"><strong>地域:</strong> ' + (node.region_type === 'domestic' ? '大陆' : '海外') + ' - ' + escapeHtml(node.region_detail || '-') + '</div>',
      '    <div class="node-info"><strong>当前状态:</strong> <span class="node-status ' + node.status + '">' + (node.status === 'online' ? '在线' : '离线') + '</span></div>',
      '    <div class="node-info"><strong>允许中转:</strong> ' + (node.allow_relay ? '是' : '否') + '</div>',
      node.tags ? ('    <div class="node-info"><strong>标签:</strong> ' + escapeHtml(node.tags) + '</div>') : '',
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
      '  <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border: 1px solid #28a745;">',
      '    <h3 style="margin-bottom: 10px; color: #28a745;">上报Token</h3>',
      '    <div class="node-info"><strong>Token:</strong> <code style="background: #f8f9fa; padding: 5px; border-radius: 3px;">' + escapeHtml(node.report_token || '未设置') + '</code></div>',
      '    <div style="margin-top: 10px;">',
      '      <button class="btn-small" onclick="copyAdminToken(' + node.id + ')">复制Token</button>',
      '      <button class="btn-small btn-warning" onclick="regenerateAdminToken(' + node.id + ')" style="margin-left: 10px;">重新生成</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
    
    document.getElementById('admin-detail-node-name').textContent = node.node_name;
    document.getElementById('admin-node-detail-content').innerHTML = content;
    document.getElementById('admin-node-detail-modal').style.display = 'block';
  } catch (error) {
    console.error('显示节点详情失败:', error);
    alert('显示节点详情失败');
  }
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
  document.getElementById('admin-allow-relay').checked = node.allow_relay;
  document.getElementById('admin-tags').value = node.tags || '';
  document.getElementById('admin-notes').value = node.notes || '';
  
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
  
  const formData = new FormData(form);
  const data = {
    node_name: formData.get('node_name'),
    region_type: formData.get('region_type'),
    region_detail: formData.get('region_detail'),
    max_bandwidth: parseFloat(formData.get('max_bandwidth')) || 0,
    max_connections: parseInt(formData.get('max_connections')) || 0,
    max_traffic: parseFloat(formData.get('max_traffic')) || 0,
    allow_relay: formData.get('allow_relay') === 'on',
    tags: formData.get('tags'),
    notes: formData.get('notes')
  };
  
  const nodeId = formData.get('node_id');
  
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
      document.getElementById('admin-node-modal').style.display = 'none';
      loadAllNodes();
    } else {
      const result = await response.json();
      alert(result.message || (nodeId ? '更新失败' : '添加失败'));
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
document.addEventListener('DOMContentLoaded', () => {
  document.title = 'EasyTier 节点管理系统 - 管理员面板';
  
  const user = checkAdminAuth();
  if (!user) return;
  
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
  
  document.getElementById('admin-add-node-btn')?.addEventListener('click', () => {
    document.getElementById('admin-modal-title').textContent = '添加节点';
    document.getElementById('admin-node-form').reset();
    document.getElementById('admin-node-id').value = '';
    document.getElementById('admin-node-modal').style.display = 'block';
  });
  
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
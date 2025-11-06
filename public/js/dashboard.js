// 我的节点页面JavaScript代码

const token = localStorage.getItem('token');
if (!token) window.location.href = '/login';
document.title = 'EasyTier 节点管理系统 - 我的节点';

let currentEditingNodeId = null;

function checkAdminAccess() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// 统一渲染节点行（主页标准，仪表板加操作）
function renderNodeRows(mode, nodes) {
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
      ${mode === 'my' ? `<td>
          <button class="btn-small" onclick="viewNodeDetail(${node.id})">详情</button>
          <button class="btn-small" onclick="editNode(${node.id})">编辑</button>
          <button class="btn-small btn-danger" onclick="deleteNode(${node.id})">删除</button>
        </td>` : ''}
    </tr>
  `).join('');
}

// 加载我的节点数据
async function loadMyNodes() {
  try {
    const response = await fetch('/api/nodes/my', {
      headers: { 'Authorization': `Bearer ${token}` }
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
      container.innerHTML = '<tr><td colspan="13" style="text-align: center;">您还没有添加任何节点，点击上方"添加节点"按钮开始添加</td></tr>';
      return;
    }
    // 使用统一渲染器（带操作）
    container.innerHTML = renderNodeRows('my', data.nodes);
  } catch (error) {
    console.error('加载节点列表失败:', error);
    document.getElementById('nodes-container').innerHTML = '<tr><td colspan="13" style="text-align: center;">加载失败，请刷新重试</td></tr>';
  }
}

// 查看节点详情
window.viewNodeDetail = async (nodeId) => {
  try {
    const response = await fetch(`/api/nodes/${nodeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    const node = data.node;
    const connsHtml = node.connections.map((conn, idx) => (
      '    <div class="node-info" style="background: white; padding: 8px; margin: 5px 0; border-radius: 4px;">' +
      '      <strong>连接 ' + (idx + 1) + ':</strong> ' + conn.type + ' - ' + conn.ip + ':' + conn.port +
      '    </div>'
    )).join('');
    const detailContent = [
      '<div style="display: grid; gap: 15px;">',
      '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
      '    <h3 style="margin-bottom: 10px; color: #667eea;">基本信息</h3>',
      '    <div class="node-info"><strong>节点名称:</strong> ' + escapeHtml(node.node_name) + '</div>',
      '    <div class="node-info"><strong>地域:</strong> ' + (node.region_type === 'domestic' ? '大陆' : '海外') + ' - ' + escapeHtml(node.region_detail) + '</div>',
      '    <div class="node-info"><strong>用户邮箱:</strong> ' + escapeHtml(node.user_email) + '</div>',
      '    <div class="node-info"><strong>创建时间:</strong> ' + formatDate(node.created_at) + '</div>',
      '    <div class="node-info"><strong>有效期至:</strong> ' + formatDate(node.valid_until) + '</div>',
      '    <div class="node-info"><strong>当前状态:</strong> <span class="node-status ' + node.status + '">' + (node.status === 'online' ? '在线' : '离线') + '</span></div>',
      '    <div class="node-info"><strong>最后上报:</strong> ' + formatDate(node.last_report_at) + '</div>',
      '    <div class="node-info"><strong>允许中转:</strong> ' + (node.allow_relay ? '是' : '否') + '</div>',
      node.tags ? ('    <div class="node-info"><strong>标签:</strong> ' + escapeHtml(node.tags) + '</div>') : '',
      node.notes ? ('    <div class="node-info"><strong>备注:</strong> ' + escapeHtml(node.notes) + '</div>') : '',
      '  </div>',
      '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
      '    <h3 style="margin-bottom: 10px; color: #667eea;">连接方式</h3>',
      connsHtml,
      '  </div>',
      '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
      '    <h3 style="margin-bottom: 10px; color: #667eea;">带宽与流量</h3>',
      '    <div class="node-info"><strong>当前带宽:</strong> ' + Number(node.current_bandwidth || 0).toFixed(2) + ' Mbps</div>',
      '    <div class="node-info"><strong>阶梯带宽:</strong> ' + Number(node.tier_bandwidth || 0).toFixed(2) + ' Mbps</div>',
      '    <div class="node-info"><strong>最大带宽:</strong> ' + Number(node.max_bandwidth || 0).toFixed(2) + ' Mbps</div>',
      '    <div class="node-info"><strong>已用流量:</strong> ' + Number(node.used_traffic || 0).toFixed(2) + ' GB</div>',
      '    <div class="node-info"><strong>修正流量:</strong> ' + Number(node.correction_traffic || 0).toFixed(2) + ' GB</div>',
      '    <div class="node-info"><strong>上报流量:</strong> ' + Number((node.used_traffic || 0) - (node.correction_traffic || 0)).toFixed(2) + ' GB</div>',
      '    <div class="node-info"><strong>最大流量:</strong> ' + Number(node.max_traffic || 0).toFixed(2) + ' GB</div>',
      '    <div class="node-info"><strong>重置周期:</strong> ' + node.reset_cycle + ' 天</div>',
      '    <div class="node-info"><strong>下次重置:</strong> ' + formatDate(node.reset_date) + '</div>',
      '  </div>',
      '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
      '    <h3 style="margin-bottom: 10px; color: #667eea;">连接信息</h3>',
      '    <div class="node-info"><strong>当前连接数:</strong> ' + node.connection_count + '</div>',
      '    <div class="node-info"><strong>最大连接数:</strong> ' + node.max_connections + '</div>',
      '  </div>',
      '  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">',
      '    <h3 style="margin-bottom: 10px; color: #856404;">上报Token</h3>',
      '    <div style="background: white; padding: 12px; border-radius: 4px; margin: 10px 0;">',
      '      <code style="font-family: monospace; font-size: 13px; word-break: break-all; color: #333;">' + (node.report_token || '未生成') + '</code>',
      '    </div>',
      '    <div style="display: flex; gap: 10px; margin-top: 10px;">',
      '      <button class="btn-small" onclick="copyToken(' + JSON.stringify(node.report_token || '') + ')">复制Token</button>',
      '      <button class="btn-small" onclick="regenerateToken(' + node.id + ')">重新生成Token</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
    
    document.getElementById('detail-node-name').textContent = node.node_name;
    document.getElementById('node-detail-content').innerHTML = detailContent;
    document.getElementById('node-detail-modal').style.display = 'block';
  } catch (error) {
    console.error('加载节点详情失败:', error);
    alert('加载节点详情失败');
  }
};

// 复制Token
window.copyToken = (nodeId) => {
  const nodes = window.myNodesCache || [];
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
  document.getElementById('node-id').value = node.id;
  document.getElementById('node-name').value = node.node_name;
  document.getElementById('region-type').value = node.region_type;
  document.getElementById('region-detail').value = node.region_detail || '';
  document.getElementById('max-bandwidth').value = node.max_bandwidth || '';
  document.getElementById('max-connections').value = node.max_connections || '';
  document.getElementById('max-traffic').value = node.max_traffic || '';
  document.getElementById('allow-relay').checked = node.allow_relay;
  document.getElementById('tags').value = node.tags || '';
  document.getElementById('notes').value = node.notes || '';
  
  document.getElementById('node-modal-title').textContent = '编辑节点';
  document.getElementById('node-modal').style.display = 'block';
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
      document.getElementById('node-modal').style.display = 'none';
      loadMyNodes();
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
      userInfoElement.textContent = `欢迎，${user.username}`;
    }
  }
  
  loadMyNodes();
  
  // 模态框事件监听
  document.getElementById('detail-close')?.addEventListener('click', () => {
    document.getElementById('node-detail-modal').style.display = 'none';
  });
  
  document.getElementById('modal-close')?.addEventListener('click', () => {
    document.getElementById('node-modal').style.display = 'none';
  });
  
  document.getElementById('add-node-btn')?.addEventListener('click', () => {
    document.getElementById('node-modal-title').textContent = '添加节点';
    document.getElementById('node-form').reset();
    document.getElementById('node-id').value = '';
    document.getElementById('node-modal').style.display = 'block';
  });
  
  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.id === 'node-detail-modal') {
      document.getElementById('node-detail-modal').style.display = 'none';
    }
    if (target && target.id === 'node-modal') {
      document.getElementById('node-modal').style.display = 'none';
    }
  });
  
  // 定期刷新
  setInterval(() => {
    loadMyNodes();
  }, 30000);
});
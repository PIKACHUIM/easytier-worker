// 公共工具函数库
// 用于减少代码重复，提高可维护性

// HTML转义函数
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 邮箱验证函数
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 日期格式化函数
function formatDate(dateString) {
  if (!dateString) return '无';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  } catch (error) {
    return '格式错误';
  }
}

// 日期格式化函数（短格式）
function formatDateShort(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  } catch (error) {
    return '格式错误';
  }
}

// 统一的节点加载函数
async function loadNodes(apiEndpoint, mode, cacheKey, colSpan, customEmptyMessage = null) {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch(apiEndpoint, { headers });
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      throw new Error(data.error);
    }
    
    // 缓存节点数据
    window[cacheKey] = data.nodes;
    
    const container = document.getElementById('nodes-container');
    const emptyMessage = customEmptyMessage || '暂无节点';
    
    if (data.nodes.length === 0) {
      container.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center;">${emptyMessage}</td></tr>`;
      return;
    }
    
    // 使用统一渲染器
    container.innerHTML = renderNodeRows(mode, data.nodes);
    
    // 如果有统计数据，显示统计信息（仅适用于公共节点）
    if (mode === 'public' && data.stats) {
      const statsDiv = document.getElementById('public-stats');
      if (statsDiv) {
        statsDiv.innerHTML = `
          <strong>在线节点统计：</strong>
          总连接数: ${data.stats.total_connections} |
          平均连接数: ${data.stats.avg_connections.toFixed(2)} |
          平均带宽: ${data.stats.avg_bandwidth.toFixed(2)} Mbps |
          平均流量: ${data.stats.avg_traffic.toFixed(2)} GB
        `;
      }
    }
  } catch (error) {
    console.error('加载节点列表失败:', error);
    const container = document.getElementById('nodes-container');
    container.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center;">加载失败，请刷新重试</td></tr>`;
  }
}

// 统一的节点行渲染函数
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
        </td>` : 
        mode === 'admin' ? `<td>
          <button class="btn-small" onclick="viewAdminNodeDetail(${node.id})">详情</button>
          <button class="btn-small" onclick="editAdminNode(${node.id})">编辑</button>
          <button class="btn-small btn-danger" onclick="deleteAdminNode(${node.id})">删除</button>
        </td>` :
        mode === 'public' ? `<td><button class="btn-small" onclick="viewPublicNodeDetail(${node.id})">详情</button></td>` : ''}
    </tr>
  `).join('');
}

// 连接方式管理类
class ConnectionManager {
  constructor(prefix = '') {
    this.prefix = prefix;
    this.connections = [];
  }

  addConnection(connection = null) {
    const container = document.getElementById(`${this.prefix}-connections-container`);
    if (!container) return;
    
    const index = this.connections.length;
    const connectionData = connection || { type: 'TCP', ip: '', port: '' };
    this.connections.push(connectionData);
    
    const connectionDiv = document.createElement('div');
    connectionDiv.className = 'connection-item';
    connectionDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 2fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: center;';
    connectionDiv.innerHTML = `
      <select id="${this.prefix}-connection-type-${index}" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <option value="TCP" ${connectionData.type === 'TCP' ? 'selected' : ''}>TCP</option>
        <option value="UDP" ${connectionData.type === 'UDP' ? 'selected' : ''}>UDP</option>
        <option value="WS" ${connectionData.type === 'WS' ? 'selected' : ''}>WebSocket</option>
        <option value="WSS" ${connectionData.type === 'WSS' ? 'selected' : ''}>WebSocket Secure</option>
        <option value="WG" ${connectionData.type === 'WG' ? 'selected' : ''}>WireGuard</option>
      </select>
      <input type="text" id="${this.prefix}-connection-ip-${index}" placeholder="IP地址" value="${connectionData.ip}" required style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      <input type="number" id="${this.prefix}-connection-port-${index}" placeholder="端口" value="${connectionData.port}" required min="1" max="65535" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      <button type="button" onclick="window.${this.prefix}ConnectionManager.removeConnection(${index})" style="padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
    `;
    
    container.appendChild(connectionDiv);
  }

  removeConnection(index) {
    const container = document.getElementById(`${this.prefix}-connections-container`);
    if (!container) return;
    
    // 从数据中移除
    this.connections.splice(index, 1);
    
    // 清空容器
    container.innerHTML = '';
    
    // 重新渲染所有连接项
    const tempConnections = [...this.connections];
    this.connections = [];
    tempConnections.forEach(conn => this.addConnection(conn));
  }

  clearConnections() {
    const container = document.getElementById(`${this.prefix}-connections-container`);
    if (container) {
      container.innerHTML = '';
    }
    this.connections = [];
  }

  collectConnections() {
    const result = [];
    for (let i = 0; i < this.connections.length; i++) {
      const type = document.getElementById(`${this.prefix}-connection-type-${i}`);
      const ip = document.getElementById(`${this.prefix}-connection-ip-${i}`);
      const port = document.getElementById(`${this.prefix}-connection-port-${i}`);
      
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
  }
}

// 导出函数到全局作用域
window.escapeHtml = escapeHtml;
window.validateEmail = validateEmail;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.renderNodeRows = renderNodeRows;
window.loadNodes = loadNodes;
window.ConnectionManager = ConnectionManager;
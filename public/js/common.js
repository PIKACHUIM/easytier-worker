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
        const headers = token ? {'Authorization': `Bearer ${token}`} : {};

        const response = await fetch(apiEndpoint, {headers});
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
            const message = mode === 'public' && document.getElementById('show-offline-toggle') &&
            !document.getElementById('show-offline-toggle').checked ?
                '暂无在线节点' : emptyMessage;
            container.innerHTML = `<tr><td colspan="${colSpan}" style="text-align: center;">${message}</td></tr>`;
            // 同时更新卡片视图为空状态
            var cardMode = mode === 'public' ? 'home' : (mode === 'my' ? 'dashboard' : mode);
            var cardView = document.getElementById(cardMode + '-card-view');
            if (cardView) {
                cardView.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">' + message + '</div>';
            }
            return;
        }

        // 使用统一渲染器写入表格行
        container.innerHTML = renderNodeRows(mode, data.nodes);

        // 同时渲染卡片视图
        // mode映射：public->home, my->dashboard, admin->admin
        var cardMode = mode === 'public' ? 'home' : (mode === 'my' ? 'dashboard' : mode);
        var cardView = document.getElementById(cardMode + '-card-view');
        if (cardView) {
            if (window.renderNodeCards) {
                window.renderNodeCards(cardMode, data.nodes);
            } else {
                // 降级：直接生成简单卡片
                cardView.innerHTML = data.nodes.map(function(node) {
                    var isOnline = node.status === 'online' || node.always_online === 1;
                    var statusClass = isOnline ? 'online-card' : 'offline-card';
                    var statusText = isOnline ? '在线' : '离线';
                    var bw = Number(node.current_bandwidth || 0).toFixed(1);
                    var maxBw = Number(node.max_bandwidth || 0);
                    var conn = Number(node.connection_count || 0);
                    var maxConn = Number(node.max_connections || 0);
                    var notesHtml = (node.notes && node.notes.trim())
                        ? '<div style="padding:6px 8px;border-top:1px solid var(--bg-glass-border,#eee);display:flex;align-items:flex-start;gap:6px;">' +
                            '<span style="font-size:11px;color:#999;flex-shrink:0;">💬</span>' +
                            '<span style="font-size:11px;color:#666;line-height:1.5;word-break:break-all;">' + escapeHtml(node.notes) + '</span>' +
                          '</div>'
                        : '';
                    return '<div class="node-card-view ' + statusClass + '">' +
                        '<div class="node-card-header">' +
                            '<div class="node-card-name">' + escapeHtml(node.node_name) + '</div>' +
                            '<span class="node-status ' + (isOnline ? 'online' : 'offline') + '">' + statusText + '</span>' +
                        '</div>' +
                        '<div class="node-card-metrics">' +
                            '<div class="node-metric"><div class="node-metric-label">带宽</div><div class="node-metric-value">' + bw + '/' + maxBw + '</div></div>' +
                            '<div class="node-metric"><div class="node-metric-label">连接</div><div class="node-metric-value">' + conn + '/' + maxConn + '</div></div>' +
                        '</div>' +
                        notesHtml +
                    '</div>';
                }).join('');
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
    return nodes.map(node => {
        // 计算带宽使用率
        const currentBandwidth = Number(node.current_bandwidth || 0);
        const maxBandwidth = Number(node.max_bandwidth || 0);
        const bandwidthUsage = maxBandwidth > 0 ? (currentBandwidth / maxBandwidth * 100) : 0;
        const bandwidthColor = bandwidthUsage < 40 ? '#4caf50' : (bandwidthUsage < 60 ? '#2196f3' : (bandwidthUsage < 80 ? '#ff9800' : '#f44336'));
        
// 计算流量使用率
        const usedTraffic = Number(node.used_traffic || 0);
        const maxTraffic = Number(node.max_traffic || 0);
        const trafficUsage = maxTraffic > 0 ? (usedTraffic / maxTraffic * 100) : 0;
        const trafficColor = trafficUsage < 40 ? '#4caf50' : (trafficUsage < 60 ? '#2196f3' : (trafficUsage < 80 ? '#ff9800' : '#f44336'));
        
// 计算连接数使用率
        const connectionCount = Number(node.connection_count || 0);
        const maxConnections = Number(node.max_connections || 0);
        const connectionUsage = maxConnections > 0 ? (connectionCount / maxConnections * 100) : 0;
        const connectionColor = connectionUsage < 40 ? '#4caf50' : (connectionUsage < 60 ? '#2196f3' : (connectionUsage < 80 ? '#ff9800' : '#f44336'));
        
// 生成连接信息HTML - 带样式和复制功能
        let connectionInfo = '';
        if (node.connections && node.connections.length > 0) {
            connectionInfo = node.connections.map(conn => {
                const connText = `${conn.type}://${conn.ip}:${conn.port}`;
                let bgColor, borderColor, textColor, icon;
                
                // 根据连接类型设置不同的颜色和图标
                switch(conn.type) {
                    case 'TCP':
                        bgColor = '#e3f2fd';
                        borderColor = '#2196f3';
                        textColor = '#1976d2';
                        icon = '🔗';
                        break;
                    case 'UDP':
                        bgColor = '#f3e5f5';
                        borderColor = '#9c27b0';
                        textColor = '#7b1fa2';
                        icon = '⚡';
                        break;
                    case 'WS':
                        bgColor = '#fff3e0';
                        borderColor = '#ff9800';
                        textColor = '#f57c00';
                        icon = '🌐';
                        break;
                    case 'WSS':
                        bgColor = '#e8f5e8';
                        borderColor = '#4caf50';
                        textColor = '#388e3c';
                        icon = '🔒';
                        break;
                    case 'WG':
                        bgColor = '#fce4ec';
                        borderColor = '#e91e63';
                        textColor = '#c2185b';
                        icon = '🛡️';
                        break;
                    default:
                        bgColor = '#f5f5f5';
                        borderColor = '#9e9e9e';
                        textColor = '#616161';
                        icon = '🔌';
                }
                
                return `<span class="connection-badge" 
                    data-connection="${connText}"
                    style="
                        display: block;
                        padding: 6px 10px;
                        margin: 3px 0;
                        background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%);
                        border: 1px solid ${borderColor};
                        border-radius: 6px;
                        color: ${textColor};
                        font-size: 12px;
                        font-family: 'Courier New', Consolas, monospace;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        white-space: nowrap;
                        width: fit-content;
                    "
                    onclick="copyToClipboard('${connText.replace(/'/g, "\\'")}', this)"
                    title="点击复制 ${connText}">
                    <span style="margin-right: 4px; font-size: 11px;">${icon}</span>
                    ${connText}
                </span>`;
            }).join('');
        } else {
            connectionInfo = '<span style="color: #999; font-style: italic; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; display: inline-block;">暂无连接</span>';
        }

return `
    <tr>
      <td>${escapeHtml(node.node_name)}</td>
      <td><span class="node-status ${node.status}">${node.status === 'online' ? '在线' : '离线'}</span></td>
      <td>${node.region_type === 'domestic' ? '大陆' : '海外'} - ${escapeHtml(node.region_detail || '-')}</td>
      <td>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${Math.min(bandwidthUsage, 100)}%; background-color: ${bandwidthColor};"></div>
        </div>
        <div class="progress-text">${currentBandwidth.toFixed(2)} / ${maxBandwidth.toFixed(2)} M</div>
      </td>
      <td>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${Math.min(connectionUsage, 100)}%; background-color: ${connectionColor};"></div>
        </div>
        <div class="progress-text">${connectionCount} / ${maxConnections} 连接数</div>
      </td>
      <td>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${Math.min(trafficUsage, 100)}%; background-color: ${trafficColor};"></div>
        </div>
        <div class="progress-text">${usedTraffic.toFixed(2)} / ${maxTraffic === 0 ? '无限制' : maxTraffic.toFixed(2) + ' GB'}</div>
      </td>
<td>${connectionInfo}</td>
<td>${node.allow_relay ? '是' : '否'}</td>
      <td>
        <span class="status-badge ${getNodeStatusClass(node.is_enabled)}">
          ${getNodeStatusText(node.is_enabled)}
        </span>
      </td>
      ${mode === 'admin' ? `<td>${escapeHtml(node.user_email || '-')}</td>` : ''}
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
  `;
    }).join('');
}

// 获取节点状态文本
function getNodeStatusText(isEnabled) {
  switch (isEnabled) {
    case -1:
      return 'ℹ️ 待审核';
    case 0:
      return '❌️ 已禁用';
    case 1:
      return '✅️ 已启用';
    default:
      return '❔ 未知的';
  }
}

// 获取节点状态样式类
function getNodeStatusClass(isEnabled) {
  switch (isEnabled) {
      case -1:
          return 'ℹ️ pending';
      case 0:
          return '❌️ disable';
      case 1:
          return '✅️ enabled';
      default:
          return '❔ unknown';
  }
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
        const connectionData = connection || {type: 'TCP', ip: '', port: ''};
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

// 统一的节点详情查看函数
function showNodeDetail(nodeId, mode, modalId, titleId, contentId) {
    try {
        // 根据模式获取节点数据
        let node;
        if (mode === 'my') {
            // 我的节点需要从服务器获取最新数据
            const token = localStorage.getItem('token');
            return fetch(`/api/nodes/${nodeId}`, {
                headers: {'Authorization': `Bearer ${token}`}
            }).then(response => {
                if (!response.ok) throw new Error('获取节点详情失败');
                return response.json();
            }).then(data => {
                node = data.node;
                renderNodeDetail(node, mode, modalId, titleId, contentId);
            });
        } else if (mode === 'admin') {
            // 管理节点从缓存获取
            const nodes = window.adminNodesCache || [];
            node = nodes.find(n => n.id === nodeId);
            if (!node) {
                window.showAlert('未找到节点', { type: 'error' });
                return;
            }
            renderNodeDetail(node, mode, modalId, titleId, contentId);
        } else if (mode === 'public') {
            // 公共节点从缓存获取
            const nodes = window.publicNodesCache || [];
            node = nodes.find(n => n.id === nodeId);
            if (!node) {
                window.showAlert('未找到节点', { type: 'error' });
                return;
            }
            renderNodeDetail(node, mode, modalId, titleId, contentId);
        }
    } catch (error) {
        console.error('获取节点详情失败:', error);
        window.showAlert('获取节点详情失败', { type: 'error' });
    }
}

// 渲染节点详情
function renderNodeDetail(node, mode, modalId, titleId, contentId) {
    // 生成连接信息HTML
    const connsHtml = node.connections && node.connections.length > 0
        ? node.connections.map((conn, idx) => (
            '    <div class="node-info" style="background: white; padding: 8px; margin: 5px 0; border-radius: 4px;">' +
            '      <strong>连接 ' + (idx + 1) + ':</strong> ' + conn.type + ' - ' + conn.ip + ':' + conn.port +
            '    </div>'
        )).join('')
        : '    <div class="node-info">暂无连接信息</div>';

    // 构建内容数组
const content = [
        '<div style="display: grid; gap: 15px;">',
        '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
        '    <h3 style="margin-bottom: 10px; color: #667eea;">基本信息</h3>',
        '    <div class="node-info"><strong>节点名称:</strong> ' + escapeHtml(node.node_name) + '</div>',
        '    <div class="node-info"><strong>地域:</strong> ' + (node.region_type === 'domestic' ? '大陆' : '海外') + ' - ' + escapeHtml(node.region_detail || '-') + '</div>',
        '    <div class="node-info"><strong>测试网络名称:</strong> ' + escapeHtml(node.network_name || '-') + '</div>',
        '    <div class="node-info"><strong>测试网络密码:</strong> ' + escapeHtml(node.network_token || '-') + '</div>',
    ];

    // 根据模式添加不同字段
    if (mode === 'my') {
        content.push(
            '    <div class="node-info"><strong>用户邮箱:</strong> ' + escapeHtml(node.user_email) + '</div>',
            '    <div class="node-info"><strong>创建时间:</strong> ' + formatDate(node.created_at) + '</div>',
            '    <div class="node-info"><strong>有效期至:</strong> ' + formatDate(node.valid_until) + '</div>',
            '    <div class="node-info"><strong>最后上报:</strong> ' + formatDate(node.last_report_at) + '</div>'
        );
    } else if (mode === 'admin') {
        content.push(
            '    <div class="node-info"><strong>所有者:</strong> ' + escapeHtml(node.user_email || '未知') + '</div>'
        );
    }

    content.push(
        '    <div class="node-info"><strong>当前状态:</strong> <span class="node-status ' + node.status + '">' + (node.status === 'online' ? '在线' : '离线') + '</span></div>',
        '    <div class="node-info"><strong>允许中转:</strong> ' + (node.allow_relay ? '是' : '否') + '</div>',
'    <div class="node-info"><strong>节点启用:</strong> ' + 
        (node.is_enabled === -1 ? '<span style="color: #ff9800;">ℹ️</span>' :
         node.is_enabled === 1 ? '<span style="color: #4caf50;">✓</span>' :
         '<span style="color: #f44336;">✗</span>') + '</div>'
    );

    if (node.tags) {
        content.push('    <div class="node-info"><strong>标签:</strong> ' + escapeHtml(node.tags) + '</div>');
    }
    if (node.notes) {
        content.push('    <div class="node-info"><strong>备注:</strong> ' + escapeHtml(node.notes) + '</div>');
    }

    content.push(
        '  </div>',
        '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
        '    <h3 style="margin-bottom: 10px; color: #667eea;">连接方式</h3>',
        connsHtml,
        '  </div>',
        '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
        '    <h3 style="margin-bottom: 10px; color: #667eea;">带宽与流量</h3>',
        '    <div class="node-info"><strong>当前带宽:</strong> ' + Number(node.current_bandwidth || 0).toFixed(2) + ' Mbps</div>',
        '    <div class="node-info"><strong>阶梯带宽:</strong> ' + Number(node.tier_bandwidth || 0).toFixed(2) + ' Mbps</div>',
        '    <div class="node-info"><strong>最大带宽:</strong> ' + Number(node.max_bandwidth || 0).toFixed(2) + ' Mbps</div>'
    );

    // 根据模式添加流量信息
    if (mode === 'my') {
        content.push(
            '    <div class="node-info"><strong>已用流量:</strong> ' + Number(node.used_traffic || 0).toFixed(2) + ' GB</div>',
            '    <div class="node-info"><strong>修正流量:</strong> ' + Number(node.correction_traffic || 0).toFixed(2) + ' GB</div>',
            '    <div class="node-info"><strong>上报流量:</strong> ' + Number((node.used_traffic || 0) - (node.correction_traffic || 0)).toFixed(2) + ' GB</div>',
            '    <div class="node-info"><strong>最大流量:</strong> ' + Number(node.max_traffic || 0).toFixed(2) + ' GB</div>',
            '    <div class="node-info"><strong>重置周期:</strong> ' + node.reset_cycle + ' 天</div>',
            '    <div class="node-info"><strong>下次重置:</strong> ' + formatDate(node.reset_date) + '</div>'
        );
    } else {
        content.push(
            '    <div class="node-info"><strong>已用流量:</strong> ' + Number(node.used_traffic || 0).toFixed(2) + ' GB</div>',
            '    <div class="node-info"><strong>最大流量:</strong> ' + (node.max_traffic === 0 ? '无限制' : Number(node.max_traffic || 0).toFixed(2) + ' GB') + '</div>',
            '    <div class="node-info"><strong>重置日期:</strong> ' + (node.reset_date ? new Date(node.reset_date).toLocaleString('zh-CN') : '-') + '</div>'
        );
    }

    content.push(
        '  </div>',
        '  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">',
        '    <h3 style="margin-bottom: 10px; color: #667eea;">连接信息</h3>',
        '    <div class="node-info"><strong>当前连接数:</strong> ' + (node.connection_count || 0) + '</div>',
        '    <div class="node-info"><strong>最大连接数:</strong> ' + (node.max_connections || 0) + '</div>',
        '  </div>'
    );

    if (mode === 'my' || mode === 'admin') {
        content.push(
            '  <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">',
            '    <h3 style="margin-bottom: 10px; color: #28a745;">上报Token</h3>',
            '    <div style="background: white; padding: 12px; border-radius: 4px; margin: 10px 0;">',
            '      <code style="font-family: monospace; font-size: 13px; word-break: break-all; color: #333;">' + (node.report_token || '未生成') + '</code>',
            '    </div>',
            '    <div style="display: flex; gap: 10px; margin-top: 10px;">',
            '      <button class="btn-small" onclick="copyToken(' + JSON.stringify(node.report_token || '') + ')">复制Token</button>',
            '      <button class="btn-small" onclick="regenerateToken(' + node.id + ')">重新生成Token</button>',
            '    </div>',
            '  </div>'
        );
    }

    content.push('</div>');

// 更新DOM，添加元素存在性检查
    const titleElement = document.getElementById(titleId);
    const contentElement = document.getElementById(contentId);
    const modalElement = document.getElementById(modalId);
    
    if (titleElement) {
        titleElement.textContent = node.node_name;
    } else {
        console.error('找不到标题元素:', titleId);
        return;
    }
    
    if (contentElement) {
        contentElement.innerHTML = content.join('');
    } else {
        console.error('找不到内容元素:', contentId);
        return;
    }
    
    if (modalElement) {
        // 将模态框移动到body下，避免被父元素的stacking context遮挡
        if (modalElement.parentElement !== document.body) {
            document.body.appendChild(modalElement);
        }
        modalElement.style.display = 'block';
    } else {
        console.error('找不到模态框元素:', modalId);
        return;
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
window.showNodeDetail = showNodeDetail;
window.renderNodeDetail = renderNodeDetail;

// 复制到剪贴板功能
function copyToClipboard(text, element) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess(element);
        }).catch(err => {
            fallbackCopyTextToClipboard(text, element);
        });
    } else {
        fallbackCopyTextToClipboard(text, element);
    }
}

// 备用复制方法
function fallbackCopyTextToClipboard(text, element) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess(element);
        } else {
            showCopyError(element);
        }
    } catch (err) {
        showCopyError(element);
    }
    
    document.body.removeChild(textArea);
}

// 显示复制成功提示
function showCopySuccess(element) {
    const originalContent = element.innerHTML;
    const originalStyle = element.style.cssText;
    
    // 添加成功动画类
    element.classList.add('copied-success');
    
    // 更新样式显示成功状态
    element.style.background = 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)';
    element.style.borderColor = '#4caf50';
    element.style.color = '#2e7d32';
    element.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
    element.innerHTML = '<span style="margin-right: 4px;">✅</span>已复制';
    
    // 恢复原始状态
    setTimeout(() => {
        element.classList.remove('copied-success');
        element.style.cssText = originalStyle;
        element.innerHTML = originalContent;
    }, 2000);
}

// 显示复制失败提示
function showCopyError(element) {
    const originalContent = element.innerHTML;
    const originalStyle = element.style.cssText;
    
    // 添加错误动画类
    element.classList.add('copied-error');
    
    // 更新样式显示错误状态
    element.style.background = 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)';
    element.style.borderColor = '#f44336';
    element.style.color = '#c62828';
    element.style.boxShadow = '0 2px 8px rgba(244, 67, 54, 0.3)';
    element.innerHTML = '<span style="margin-right: 4px;">❌</span>复制失败';
    
    // 恢复原始状态
    setTimeout(() => {
        element.classList.remove('copied-error');
        element.style.cssText = originalStyle;
        element.innerHTML = originalContent;
    }, 2000);
}

// 设置节点状态联动逻辑
window.setupNodeStatusToggle = function(mode = 'admin') {
    const prefix = mode === 'admin' ? 'admin-' : 'dashboard-';
    const enabledCheckbox = document.getElementById(`${prefix}is-enabled`);
    const approvedCheckbox = document.getElementById(`${prefix}is-approved`);
    
    if (!enabledCheckbox || !approvedCheckbox) {
        console.warn('找不到节点状态复选框元素');
        return;
    }
    
    // 当节点启用状态改变时
    enabledCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // 如果启用节点，自动勾选通过审核
            approvedCheckbox.checked = true;
            approvedCheckbox.disabled = false;
            approvedCheckbox.title = '节点启用时自动通过审核';
        } else {
            // 如果禁用节点，保持审核状态不变（允许管理员手动控制）
            approvedCheckbox.title = '审核状态可独立控制';
        }
    });
    
    // 当审核状态改变时
    approvedCheckbox.addEventListener('change', function() {
        if (!this.checked) {
            // 如果取消审核，自动禁用节点
            enabledCheckbox.checked = false;
            enabledCheckbox.title = '未审核状态下无法启用节点';
        } else {
            // 如果通过审核，可以选择是否启用节点
            enabledCheckbox.disabled = false;
            enabledCheckbox.title = '通过审核后可选择是否启用节点';
        }
    });
    
    // 初始化状态提示
    if (approvedCheckbox.checked) {
        enabledCheckbox.title = '通过审核后可选择是否启用节点';
    } else {
        enabledCheckbox.title = '未审核状态下无法启用节点';
    }
    
    console.log(`节点状态联动逻辑已初始化 (${mode}模式)`);
};

// 导出新增函数到全局作用域
window.copyToClipboard = copyToClipboard;
window.fallbackCopyTextToClipboard = fallbackCopyTextToClipboard;
window.showCopySuccess = showCopySuccess;
window.showCopyError = showCopyError;
window.setupNodeStatusToggle = window.setupNodeStatusToggle;

/* ===== 统一弹窗系统（替代原生 alert / confirm）===== */
(function() {
  // 注入弹窗样式（只注入一次）
  function injectDialogStyles() {
    if (document.getElementById('__dialog-styles')) return;
    var style = document.createElement('style');
    style.id = '__dialog-styles';
    style.textContent = `
      .__dialog-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        animation: __dlg-fade-in 0.18s ease;
      }
      @keyframes __dlg-fade-in { from { opacity:0; } to { opacity:1; } }
      .__dialog-box {
        background: var(--bg-glass, #1e1e3a);
        border: 1px solid var(--bg-glass-border, rgba(255,255,255,0.12));
        border-radius: 16px;
        padding: 28px 32px 24px;
        min-width: 320px; max-width: 440px; width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: __dlg-slide-in 0.2s cubic-bezier(0.34,1.56,0.64,1);
        color: var(--text-primary, #f1f5f9);
      }
      @keyframes __dlg-slide-in { from { transform: scale(0.88) translateY(-16px); opacity:0; } to { transform: scale(1) translateY(0); opacity:1; } }
      .__dialog-icon { font-size: 32px; margin-bottom: 12px; text-align: center; }
      .__dialog-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary, #f1f5f9); }
      .__dialog-msg { font-size: 14px; color: var(--text-secondary, #94a3b8); line-height: 1.6; margin-bottom: 20px; }
      .__dialog-btns { display: flex; gap: 10px; justify-content: flex-end; }
      .__dialog-btn {
        padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer;
        font-size: 14px; font-weight: 600; transition: all 0.15s ease;
      }
      .__dialog-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
      .__dialog-btn-primary {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: #fff; box-shadow: 0 4px 12px rgba(79,70,229,0.4);
      }
      .__dialog-btn-danger {
        background: linear-gradient(135deg, #ef4444, #f87171);
        color: #fff; box-shadow: 0 4px 12px rgba(239,68,68,0.4);
      }
      .__dialog-btn-cancel {
        background: var(--bg-card, rgba(255,255,255,0.08));
        color: var(--text-secondary, #94a3b8);
        border: 1px solid var(--bg-glass-border, rgba(255,255,255,0.12));
      }
      [data-theme="light"] .__dialog-box {
        background: #fff; border-color: rgba(79,70,229,0.15); color: #1e1b4b;
      }
      [data-theme="light"] .__dialog-title { color: #1e1b4b; }
      [data-theme="light"] .__dialog-msg { color: #4338ca; }
      [data-theme="light"] .__dialog-btn-cancel { background: #f0f4ff; color: #4338ca; border-color: rgba(79,70,229,0.2); }
    `;
    document.head.appendChild(style);
  }

  /**
   * 显示提示弹窗（替代 alert）
   * @param {string} message - 消息内容
   * @param {object} [opts] - 可选配置 { title, icon, type: 'info'|'success'|'warning'|'error' }
   * @returns {Promise<void>}
   */
  window.showAlert = function(message, opts) {
    injectDialogStyles();
    opts = opts || {};
    var type = opts.type || 'info';
    var iconMap = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    var titleMap = { info: '提示', success: '成功', warning: '警告', error: '错误' };
    var icon = opts.icon || iconMap[type] || 'ℹ️';
    var title = opts.title || titleMap[type] || '提示';

    return new Promise(function(resolve) {
      var overlay = document.createElement('div');
      overlay.className = '__dialog-overlay';
      overlay.innerHTML =
        '<div class="__dialog-box">' +
          '<div class="__dialog-icon">' + icon + '</div>' +
          '<div class="__dialog-title">' + title + '</div>' +
          '<div class="__dialog-msg">' + escapeHtml(message) + '</div>' +
          '<div class="__dialog-btns">' +
            '<button class="__dialog-btn __dialog-btn-primary" id="__dlg-ok">确定</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#__dlg-ok').focus();
      function close() {
        overlay.style.animation = 'none';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.15s';
        setTimeout(function() { document.body.removeChild(overlay); resolve(); }, 150);
      }
      overlay.querySelector('#__dlg-ok').addEventListener('click', close);
      overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Enter' || e.key === 'Escape') { document.removeEventListener('keydown', handler); close(); }
      });
    });
  };

  /**
   * 显示确认弹窗（替代 confirm）
   * @param {string} message - 消息内容
   * @param {object} [opts] - 可选配置 { title, icon, confirmText, cancelText, danger }
   * @returns {Promise<boolean>}
   */
  window.showConfirm = function(message, opts) {
    injectDialogStyles();
    opts = opts || {};
    var icon = opts.icon || '❓';
    var title = opts.title || '确认操作';
    var confirmText = opts.confirmText || '确定';
    var cancelText = opts.cancelText || '取消';
    var isDanger = opts.danger !== false && (opts.danger || true);

    return new Promise(function(resolve) {
      var overlay = document.createElement('div');
      overlay.className = '__dialog-overlay';
      overlay.innerHTML =
        '<div class="__dialog-box">' +
          '<div class="__dialog-icon">' + icon + '</div>' +
          '<div class="__dialog-title">' + title + '</div>' +
          '<div class="__dialog-msg">' + escapeHtml(message) + '</div>' +
          '<div class="__dialog-btns">' +
            '<button class="__dialog-btn __dialog-btn-cancel" id="__dlg-cancel">' + cancelText + '</button>' +
            '<button class="__dialog-btn ' + (isDanger ? '__dialog-btn-danger' : '__dialog-btn-primary') + '" id="__dlg-confirm">' + confirmText + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#__dlg-confirm').focus();
      function close(result) {
        overlay.style.animation = 'none';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.15s';
        setTimeout(function() { document.body.removeChild(overlay); resolve(result); }, 150);
      }
      overlay.querySelector('#__dlg-confirm').addEventListener('click', function() { close(true); });
      overlay.querySelector('#__dlg-cancel').addEventListener('click', function() { close(false); });
      overlay.addEventListener('click', function(e) { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Enter') { document.removeEventListener('keydown', handler); close(true); }
        if (e.key === 'Escape') { document.removeEventListener('keydown', handler); close(false); }
      });
    });
  };
})();
import { jsxRenderer } from 'hono/jsx-renderer'
import chartUmd from '../public/chart.umd.min.js?raw'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>EasyTier 节点管理系统</title>
        <style dangerouslySetInnerHTML={{__html: `
          /* 全局样式 */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }

          .container {
            max-width: 90%;
            margin: 0 auto;
            padding: 20px;
          }

          /* 头部样式 */
          .header {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }

          .header h1 {
            font-size: 24px;
            color: #667eea;
          }

          .header nav a {
            margin-left: 20px;
            text-decoration: none;
            color: #667eea;
            font-weight: 500;
            transition: color 0.3s;
          }

          .header nav a:hover {
            color: #764ba2;
          }

          /* 主要内容区域 */
          .main {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
          }

          /* Hero 区域 */
          .hero {
            text-align: center;
            padding: 40px 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 40px;
          }

          .hero h2 {
            font-size: 32px;
            color: #333;
            margin-bottom: 10px;
          }

          .hero p {
            font-size: 18px;
            color: #666;
          }

          /* 统计卡片 */
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }

          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
            color: white;
            text-align: center;
          }

          .stat-card h3 {
            font-size: 16px;
            margin-bottom: 10px;
            opacity: 0.9;
          }

          .stat-value {
            font-size: 36px;
            font-weight: bold;
          }

          /* 节点列表 */
          .nodes-list h2 {
            margin-bottom: 20px;
            color: #333;
          }

          .nodes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }

          .node-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #e9ecef;
            transition: all 0.3s;
          }

          .node-card:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
          }

          .node-card h3 {
            color: #667eea;
            margin-bottom: 10px;
          }

          .node-card .node-info {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
          }

          .node-card .node-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 10px;
          }

          .node-status.online {
            background: #d4edda;
            color: #155724;
          }

          .node-status.offline {
            background: #f8d7da;
            color: #721c24;
          }

          /* 认证表单 */
          .auth-form {
            max-width: 400px;
            margin: 100px auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
          }

          .auth-form h1 {
            text-align: center;
            color: #667eea;
            margin-bottom: 30px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: 500;
          }

          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 5px;
            font-size: 14px;
            transition: border-color 0.3s;
          }

          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
          }

          .form-group textarea {
            resize: vertical;
            min-height: 100px;
          }

          button[type="submit"],
          .btn-primary {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s;
          }

          button[type="submit"]:hover,
          .btn-primary:hover {
            transform: translateY(-2px);
          }

          .auth-form p {
            text-align: center;
            margin-top: 20px;
            color: #666;
          }

          .auth-form a {
            color: #667eea;
            text-decoration: none;
          }

          .auth-form a:hover {
            text-decoration: underline;
          }

          /* 仪表板 */
          .dashboard-actions {
            margin-bottom: 20px;
          }

          .dashboard-actions .btn-primary {
            width: auto;
            padding: 10px 20px;
          }

          /* 模态框 */
          .modal {
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            overflow: auto;
          }

          .modal-content {
            background: white;
            margin: 50px auto;
            padding: 30px;
            border-radius: 10px;
            max-width: 600px;
            position: relative;
          }

          .close {
            position: absolute;
            right: 20px;
            top: 20px;
            font-size: 28px;
            font-weight: bold;
            color: #aaa;
            cursor: pointer;
          }

          .close:hover {
            color: #000;
          }

          /* 页脚 */
          .footer {
            text-align: center;
            color: white;
            padding: 20px;
          }

          /* 消息提示 */
          #message {
            margin: 20px 0;
          }

          #message .success {
            padding: 12px;
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
          }

          #message .error {
            padding: 12px;
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
          }

          .info {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
          }

          .form-group small {
            display: block;
            margin-top: 5px;
            color: #666;
            font-size: 12px;
          }

          .form-group small a {
            color: #667eea;
            text-decoration: none;
          }

          .form-group small a:hover {
            text-decoration: underline;
          }

          /* 系统设置页面 */
          .settings-section {
            margin-bottom: 40px;
            padding-bottom: 40px;
            border-bottom: 1px solid #eee;
          }

          .settings-section:last-child {
            border-bottom: none;
          }

          .settings-section h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 20px;
          }

          /* 用户管理表格和节点表格 */
          .users-table,
          .nodes-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
          }

          .users-table th,
          .users-table td,
          .nodes-table th,
          .nodes-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }

          .users-table th,
          .nodes-table th {
            background: #f8f9fa;
            color: #333;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .users-table tr:hover,
          .nodes-table tbody tr:hover {
            background: #f8f9fa;
          }
          
          .nodes-table-container {
            overflow-x: auto;
            margin-top: 20px;
          }
          
          .toggle-switch {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .toggle-switch input[type="checkbox"] {
            width: 40px;
            height: 20px;
            cursor: pointer;
          }
          
          .stats-row {
            background: #e8f4f8;
            font-weight: 600;
          }

          .btn-small {
            padding: 6px 12px;
            font-size: 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 5px;
            background: #667eea;
            color: white;
            transition: background 0.3s;
          }

          .btn-small:hover {
            background: #764ba2;
          }

          .btn-danger {
            background: #dc3545;
          }

          .btn-danger:hover {
            background: #c82333;
          }

          .chart-text {
            text-align: center;
            margin-top: 8px;
          }

          /* 限制统计图容器最大宽度 */
          .donut-container {
            max-width: 300px;
            width: 100%;
            margin: 0 auto;
          }

          /* 导航菜单增强样式 */
          .header nav {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
          }

          .header nav a {
            padding: 8px 16px;
            border-radius: 6px;
            transition: all 0.3s;
            font-size: 14px;
          }

          /* 导航链接颜色样式 */
          #home-link {
            background-color: rgba(102, 126, 234, 0.15);
            border: 1px solid rgba(102, 126, 234, 0.4);
            color: #3f51b5;
            font-weight: 600;
          }
          #home-link:hover {
            background-color: rgba(102, 126, 234, 0.25);
            border-color: rgba(102, 126, 234, 0.6);
            color: #283593;
          }

          #dashboard-link {
            background-color: rgba(0, 150, 136, 0.15);
            border: 1px solid rgba(0, 150, 136, 0.4);
            color: #00796b;
            font-weight: 600;
          }
          #dashboard-link:hover {
            background-color: rgba(0, 150, 136, 0.25);
            border-color: rgba(0, 150, 136, 0.6);
            color: #00695c;
          }

          /* 管理员链接特殊样式 */
          #admin-link {
            background-color: rgba(255, 193, 7, 0.15);
            border: 1px solid rgba(255, 193, 7, 0.4);
            color: #f57c00;
            font-weight: 600;
          }

          #admin-link:hover {
            background-color: rgba(255, 193, 7, 0.25);
            border-color: rgba(255, 193, 7, 0.6);
            color: #e65100;
          }

          #settings-link {
            background-color: rgba(76, 175, 80, 0.15);
            border: 1px solid rgba(76, 175, 80, 0.4);
            color: #388e3c;
            font-weight: 600;
          }

          #settings-link:hover {
            background-color: rgba(76, 175, 80, 0.25);
            border-color: rgba(76, 175, 80, 0.6);
            color: #2e7d32;
          }

          #login-link {
            background-color: rgba(33, 150, 243, 0.15);
            border: 1px solid rgba(33, 150, 243, 0.4);
            color: #1976d2;
            font-weight: 600;
          }
          #login-link:hover {
            background-color: rgba(33, 150, 243, 0.25);
            border-color: rgba(33, 150, 243, 0.6);
            color: #1565c0;
          }

          #logout-link {
            background-color: rgba(220, 53, 69, 0.15);
            border: 1px solid rgba(220, 53, 69, 0.4);
            color: #c62828;
            font-weight: 600;
          }
#logout-link:hover {
            background-color: rgba(220, 53, 69, 0.25);
            border-color: rgba(220, 53, 69, 0.6);
            color: #b71c1c;
          }

          /* 进度条样式 */
          .progress-container {
            width: 100%;
            height: 8px;
            background-color: #e0e0e0;
            border-radius: 4px;
            margin-bottom: 4px;
            overflow: hidden;
          }

          .progress-bar {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease, background-color 0.3s ease;
            min-width: 2px;
          }

          .progress-text {
            font-size: 12px;
            color: #666;
            text-align: center;
            margin-top: 2px;
          }

          /* 响应式设计 */
          @media (max-width: 768px) {
            .header {
              flex-direction: column;
              text-align: center;
            }
            
            .header nav {
              margin-top: 15px;
            }
            
            .header nav a {
              margin: 0 10px;
            }
            
            .stats {
              grid-template-columns: 1fr;
            }
            
            .nodes-grid {
              grid-template-columns: 1fr;
            }
            
            .auth-form {
              margin: 50px 20px;
            }
            
            .users-table {
              font-size: 12px;
            }
            
            .users-table th,
            .users-table td {
              padding: 8px;
            }
            
            .btn-small {
              display: block;
              margin: 5px 0;
              width: 100%;
            }
          }
        `}} />
        <script dangerouslySetInnerHTML={{__html: `
          // 全局工具：转义和统一节点行渲染
          window.escapeHtml = function(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
          };

window.renderNodeRows = function(mode, nodes) {
            return nodes.map(function(node) {
              // 计算带宽使用率
              var currentBandwidth = Number(node.current_bandwidth || 0);
              var maxBandwidth = Number(node.max_bandwidth || 0);
              var bandwidthUsage = maxBandwidth > 0 ? (currentBandwidth / maxBandwidth * 100) : 0;
              var bandwidthColor = bandwidthUsage < 40 ? '#4caf50' : (bandwidthUsage < 60 ? '#2196f3' : (bandwidthUsage < 80 ? '#ff9800' : '#f44336'));
              
              // 计算流量使用率
              var usedTraffic = Number(node.used_traffic || 0);
              var maxTraffic = Number(node.max_traffic || 0);
              var trafficUsage = maxTraffic > 0 ? (usedTraffic / maxTraffic * 100) : 0;
              var trafficColor = trafficUsage < 40 ? '#4caf50' : (trafficUsage < 60 ? '#2196f3' : (trafficUsage < 80 ? '#ff9800' : '#f44336'));
              
              // 计算连接数使用率
              var connectionCount = Number(node.connection_count || 0);
              var maxConnections = Number(node.max_connections || 0);
              var connectionUsage = maxConnections > 0 ? (connectionCount / maxConnections * 100) : 0;
              var connectionColor = connectionUsage < 40 ? '#4caf50' : (connectionUsage < 60 ? '#2196f3' : (connectionUsage < 80 ? '#ff9800' : '#f44336'));
              
              // 生成连接信息字符串
              var connectionInfo = '';
              if (node.connections && node.connections.length > 0) {
                connectionInfo = node.connections.map(function(conn) {
                  return conn.type + '://' + conn.ip + ':' + conn.port;
                }).join(', ');
              } else {
                connectionInfo = '-';
              }

              var baseCols = '' +
                '<td>' + window.escapeHtml(node.node_name) + '</td>' +
                '<td><span class="node-status ' + node.status + '">' + (node.status === 'online' ? '在线' : '离线') + '</span></td>' +
                '<td>' + (node.region_type === 'domestic' ? '大陆' : '海外') + ' - ' + window.escapeHtml(node.region_detail || '-') + '</td>' +
                '<td>' +
                  '<div class="progress-container">' +
                    '<div class="progress-bar" style="width: ' + Math.min(bandwidthUsage, 100) + '%; background-color: ' + bandwidthColor + ';"></div>' +
                  '</div>' +
                  '<div class="progress-text">' + currentBandwidth.toFixed(2) + ' / ' + maxBandwidth.toFixed(2) + ' Mbps</div>' +
                '</td>' +
                '<td>' +
                  '<div class="progress-container">' +
                    '<div class="progress-bar" style="width: ' + Math.min(connectionUsage, 100) + '%; background-color: ' + connectionColor + ';"></div>' +
                  '</div>' +
                  '<div class="progress-text">' + connectionCount + ' / ' + maxConnections + '</div>' +
                '</td>' +
                '<td>' +
                  '<div class="progress-container">' +
                    '<div class="progress-bar" style="width: ' + Math.min(trafficUsage, 100) + '%; background-color: ' + trafficColor + ';"></div>' +
                  '</div>' +
                  '<div class="progress-text">' + usedTraffic.toFixed(2) + ' / ' + (maxTraffic === 0 ? '无限制' : maxTraffic.toFixed(2) + ' GB') + '</div>' +
                '</td>' +
                '<td>' + window.escapeHtml(connectionInfo) + '</td>' +
                '<td>' + (node.allow_relay ? '是' : '否') + '</td>' +
                '<td>' + window.escapeHtml(node.tags || '-') + '</td>';

              var actionCol = '';
              if (mode === 'my') {
                actionCol = '<td>' +
                  '<button class="btn-small" onclick="viewNodeDetail(' + node.id + ')">详情</button>' +
                  '<button class="btn-small" onclick="editNode(' + node.id + ')">编辑</button>' +
                  '<button class="btn-small btn-danger" onclick="deleteNode(' + node.id + ')">删除</button>' +
                '</td>';
              }
              return '<tr>' + baseCols + (actionCol || '') + '</tr>';
            }).join('');
          };
        `}} />
      </head>
      <body>{children}
        <script dangerouslySetInnerHTML={{__html: chartUmd}} />
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            function updateNav() {
              try {
                var token = localStorage.getItem('token');
                var userStr = localStorage.getItem('user');
                var user = null;
                if (userStr) { try { user = JSON.parse(userStr); } catch (e) { user = null; } }

                var loginLink = document.getElementById('login-link');
                var logoutLink = document.getElementById('logout-link');
                var dashboardLink = document.getElementById('dashboard-link');
                var adminLink = document.getElementById('admin-link');
                var settingsLink = document.getElementById('settings-link');

                if (loginLink) loginLink.style.display = token ? 'none' : 'inline';
                if (logoutLink) logoutLink.style.display = token ? 'inline' : 'none';
                if (dashboardLink) dashboardLink.style.display = token ? 'inline' : 'none';

                var isAdmin = !!(user && (user.is_admin || user.is_super_admin));
                if (adminLink) adminLink.style.display = (token && isAdmin) ? 'inline' : 'none';
                if (settingsLink) settingsLink.style.display = (token && isAdmin) ? 'inline' : 'none';

                if (logoutLink && !logoutLink._bound) {
                  logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    location.href = '/';
                  });
                  // 标记避免重复绑定
                  logoutLink._bound = true;
                }
              } catch (err) {
                console.error('导航初始化失败:', err);
              }
            }

            document.addEventListener('DOMContentLoaded', updateNav);
          })();
        `}} />
      </body>
    </html>
  )
})

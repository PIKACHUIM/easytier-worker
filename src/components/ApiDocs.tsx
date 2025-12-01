function ApiDocs() {
    return (
        <div className="main">
            <div className="hero">
                <h2>API 文档</h2>
                <p>EasyTier 节点管理系统 API 接口详细说明</p>
            </div>

            <div className="api-docs-container">
                <div className="api-section">
                    <h3>基础信息</h3>
                    <div className="api-info">
                        <p><strong>Base URL:</strong> <code>https://your-domain.workers.dev</code></p>
                        <p><strong>认证方式:</strong> Bearer Token (JWT)</p>
                        <p><strong>Content-Type:</strong> <code>application/json</code></p>
                    </div>
                </div>

                <div className="api-section">
                    <h3>认证 API</h3>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method post">POST</span>
                            <span className="path">/api/auth/register</span>
                            <span className="description">用户注册</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>请求体</h4>
                                <pre><code>{`{
  "email": "user@example.com",
  "password": "password123"
}`}</code></pre>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "message": "注册成功，请查收验证邮件",
  "verification_token": "token_string"
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>201</code>: 注册成功</li>
                                    <li><code>400</code>: 请求参数错误</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method post">POST</span>
                            <span className="path">/api/auth/login</span>
                            <span className="description">用户登录</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>请求体</h4>
                                <pre><code>{`{
                              "email": "user@example.com",
                              "password": "password123"
                            }`}</code></pre>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
                                  "token": "jwt_token_string",
                                  "user": {
                                    "email": "user@example.com",
                                    "is_admin": false
                                  }
                                }`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 登录成功</li>
                                    <li><code>401</code>: 邮箱或密码错误</li>
                                    <li><code>403</code>: 邮箱未验证</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method get">GET</span>
                            <span className="path">/api/auth/verify?token=&lt;verification_token&gt;</span>
                            <span className="description">验证邮箱</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>查询参数</h4>
                                <ul>
                                    <li><code>token</code>: 验证令牌（从注册邮件中获取）</li>
                                </ul>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "message": "邮箱验证成功"
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 验证成功</li>
                                    <li><code>400</code>: 验证令牌无效</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="api-section">
                    <h3>节点管理 API</h3>
                    <p className="api-note">所有节点管理 API 都需要在请求头中包含 JWT token: <code>Authorization:
                        Bearer &lt;your_jwt_token&gt;</code></p>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method get">GET</span>
                            <span className="path">/api/nodes/my</span>
                            <span className="description">获取我的节点列表</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "nodes": [
    {
      "id": 1,
      "node_name": "节点1",
      "region_type": "domestic",
      "region_detail": "北京",
      "connections": [
        {
          "type": "TCP",
          "ip": "1.2.3.4",
          "port": 8080
        }
      ],
      "current_bandwidth": 50.5,
      "tier_bandwidth": 100,
      "max_bandwidth": 1000,
      "used_traffic": 50.2,
      "max_traffic": 1000,
      "connection_count": 5,
      "max_connections": 100,
      "tags": "高速,稳定",
      "status": "online"
    }
  ]
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 成功</li>
                                    <li><code>401</code>: 未授权</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method post">POST</span>
                            <span className="path">/api/nodes/</span>
                            <span className="description">创建节点</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>请求体</h4>
                                <pre><code>{`{
  "node_name": "节点1",
  "region_type": "domestic",
  "region_detail": "北京",
  "connections": [
    {
      "type": "TCP",
      "ip": "1.2.3.4",
      "port": 8080
    }
  ],
  "tier_bandwidth": 100,
  "max_bandwidth": 1000,
  "max_traffic": 1000,
  "reset_cycle": 30,
  "max_connections": 100,
  "tags": "高速,稳定",
  "valid_until": "2026-11-04",
  "allow_relay": 1
}`}</code></pre>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "message": "节点创建成功",
  "node_id": 1
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>201</code>: 创建成功</li>
                                    <li><code>400</code>: 请求参数错误</li>
                                    <li><code>401</code>: 未授权</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method put">PUT</span>
                            <span className="path">/api/nodes/&lt;id&gt;</span>
                            <span className="description">更新节点</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>路径参数</h4>
                                <ul>
                                    <li><code>id</code>: 节点 ID</li>
                                </ul>
                                <h4>请求体</h4>
                                <p>同创建节点，所有字段都是可选的</p>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "message": "节点更新成功"
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 更新成功</li>
                                    <li><code>400</code>: 请求参数错误</li>
                                    <li><code>401</code>: 未授权</li>
                                    <li><code>403</code>: 无权修改此节点</li>
                                    <li><code>404</code>: 节点不存在</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method delete">DELETE</span>
                            <span className="path">/api/nodes/&lt;id&gt;</span>
                            <span className="description">删除节点</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>路径参数</h4>
                                <ul>
                                    <li><code>id</code>: 节点 ID</li>
                                </ul>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "message": "节点删除成功"
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 删除成功</li>
                                    <li><code>401</code>: 未授权</li>
                                    <li><code>403</code>: 无权删除此节点</li>
                                    <li><code>404</code>: 节点不存在</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="api-section">
                    <h3>公开 API</h3>
                    <p className="api-note">以下 API 不需要认证</p>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method post">POST</span>
                            <span className="path">/api/report</span>
                            <span className="description">节点上报</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>请求体</h4>
                                <pre><code>{`{
  "node_name": "my-node",
  "email": "user@example.com",
  "token": "your-report-token",
  "current_bandwidth": 50.5,
  "reported_traffic": 0.5,
  "connection_count": 5,
  "status": "online"
}`}</code></pre>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "message": "上报成功",
  "used_traffic": 50.7,
  "max_traffic": 1000,
  "reset_date": "2025-12-04T00:00:00.000Z"
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 上报成功</li>
                                    <li><code>400</code>: 请求参数错误</li>
                                    <li><code>403</code>: Token验证失败或节点已过期</li>
                                    <li><code>404</code>: 节点不存在</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method post">POST</span>
                            <span className="path">/api/query</span>
                            <span className="description">查询节点（智能负载均衡）</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>请求体</h4>
                                <pre><code>{`{
  "region": "domestic",
  "priority": "traffic",
  "relay_only": false
}`}</code></pre>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "nodes": [
    {
      "id": 1,
      "node_name": "节点1",
      "region_type": "domestic",
      "region_detail": "北京",
      "connections": [
        {
          "type": "TCP",
          "ip": "1.2.3.4",
          "port": 8080
        }
      ],
      "current_bandwidth": 50.5,
      "tier_bandwidth": 100,
      "connection_count": 5,
      "max_connections": 100,
      "used_traffic": 50.2,
      "max_traffic": 1000,
      "tags": "高速,稳定",
      "allow_relay": 1
    }
  ]
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 查询成功</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method get">GET</span>
                            <span className="path">/api/public</span>
                            <span className="description">获取公开节点列表</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "nodes": [
    {
      "id": 1,
      "node_name": "节点1",
      "region_type": "domestic",
      "region_detail": "北京",
      "current_bandwidth": 50.5,
      "tier_bandwidth": 100,
      "max_bandwidth": 1000,
      "used_traffic": 50.2,
      "max_traffic": 1000,
      "connection_count": 5,
      "max_connections": 100,
      "tags": "高速,稳定",
      "status": "online",
      "allow_relay": 1
    }
  ]
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 成功</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method get">GET</span>
                            <span className="path">/api/stats</span>
                            <span className="description">获取统计信息</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "total_nodes": 100,
  "online_nodes": 80,
  "domestic_nodes": 60,
  "overseas_nodes": 40,
  "total_bandwidth": 10000.5
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 成功</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="api-section">
                    <h3>系统管理 API</h3>
                    <p className="api-note">需要管理员权限</p>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method get">GET</span>
                            <span className="path">/api/system/check-init</span>
                            <span className="description">检查系统初始化状态</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "initialized": true
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>200</code>: 成功</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="api-endpoint">
                        <div className="endpoint-header" onclick="toggleEndpoint(this)">
                            <span className="method post">POST</span>
                            <span className="path">/api/system/initialize</span>
                            <span className="description">初始化系统</span>
                            <span className="toggle-icon">▼</span>
                        </div>
                        <div className="endpoint-details">
                            <div className="request">
                                <h4>请求体</h4>
                                <pre><code>{`{
  "jwt_secret": "your-jwt-secret",
  "email": "admin@example.com",
  "password": "admin123456"
}`}</code></pre>
                            </div>
                            <div className="response">
                                <h4>响应</h4>
                                <pre><code>{`{
  "message": "系统初始化成功",
  "admin_email": "admin@example.com"
}`}</code></pre>
                            </div>
                            <div className="status-codes">
                                <h4>状态码</h4>
                                <ul>
                                    <li><code>201</code>: 初始化成功</li>
                                    <li><code>400</code>: 系统已初始化或参数错误</li>
                                    <li><code>401</code>: JWT 密钥验证失败</li>
                                    <li><code>500</code>: 服务器错误</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="api-section">
                    <h3>错误响应格式</h3>
                    <div className="api-info">
                        <p>所有错误响应都遵循以下格式：</p>
                        <pre><code>{`{
  "error": "错误描述信息"
}`}</code></pre>
                    </div>
                </div>

                <div className="api-section">
                    <h3>使用示例</h3>
                    <div className="api-example">
                        <h4>示例 1: 用户注册和登录</h4>
                        <pre><code>{`# 1. 注册
curl -X POST https://your-domain.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 2. 验证邮箱（使用邮件中的 token）
curl https://your-domain.workers.dev/api/auth/verify?token=verification_token

# 3. 登录
curl -X POST https://your-domain.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'`}</code></pre>
                    </div>

                    <div className="api-example">
                        <h4>示例 2: 创建和管理节点</h4>
                        <pre><code>{`# 1. 创建节点
curl -X POST https://your-domain.workers.dev/api/nodes/ \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "node_name": "测试节点",
    "region_type": "domestic",
    "region_detail": "北京",
    "connections": [{"type":"TCP","ip":"1.2.3.4","port":8080}],
    "tier_bandwidth": 100,
    "max_bandwidth": 1000,
    "max_traffic": 1000,
    "reset_cycle": 30,
    "max_connections": 100,
    "valid_until": "2026-11-04",
    "allow_relay": 1
  }'

# 2. 获取我的节点
curl https://your-domain.workers.dev/api/nodes/my \
  -H "Authorization: Bearer your_jwt_token"

# 3. 更新节点
curl -X PUT https://your-domain.workers.dev/api/nodes/1 \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"tier_bandwidth": 200}'

# 4. 删除节点
curl -X DELETE https://your-domain.workers.dev/api/nodes/1 \
  -H "Authorization: Bearer your_jwt_token"`}</code></pre>
                    </div>

                    <div className="api-example">
                        <h4>示例 3: 节点上报</h4>
                        <pre><code>{`# 使用节点名称、邮箱和Token进行上报
curl -X POST https://your-domain.workers.dev/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "node_name": "my-node",
    "email": "user@example.com",
    "token": "your-report-token-here",
    "current_bandwidth": 50.5,
    "reported_traffic": 0.5,
    "connection_count": 5,
    "status": "online"
  }'`}</code></pre>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .api-docs-container {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .api-section {
                    margin-bottom: 40px;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }

                .api-section h3 {
                    color: #667eea;
                    margin-bottom: 20px;
                    font-size: 24px;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 10px;
                }

                .api-info {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .api-info p {
                    margin: 10px 0;
                    font-size: 16px;
                }

                .api-info code {
                    background: #e9ecef;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                }

                .api-note {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .api-endpoint {
                    margin-bottom: 20px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .endpoint-header {
                    background: #f8f9fa;
                    padding: 15px 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: background 0.3s;
                }

                .endpoint-header:hover {
                    background: #e9ecef;
                }

                .method {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    color: white;
                    min-width: 60px;
                    text-align: center;
                }

                .method.get {
                    background: #28a745;
                }

                .method.post {
                    background: #007bff;
                }

                .method.put {
                    background: #ffc107;
                    color: #333;
                }

                .method.delete {
                    background: #dc3545;
                }

                .path {
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    color: #495057;
                    font-weight: 500;
                }

                .description {
                    color: #6c757d;
                    font-size: 14px;
                }

                .toggle-icon {
                    margin-left: auto;
                    color: #6c757d;
                    transition: transform 0.3s;
                }

                .endpoint-header.expanded .toggle-icon {
                    transform: rotate(180deg);
                }

                .endpoint-details {
                    display: none;
                    padding: 20px;
                    background: white;
                    border-top: 1px solid #e9ecef;
                }

                .endpoint-details.active {
                    display: block;
                }

                .endpoint-details h4 {
                    color: #495057;
                    margin: 20px 0 10px 0;
                    font-size: 16px;
                }

                .endpoint-details h4:first-child {
                    margin-top: 0;
                }

                .endpoint-details pre {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    padding: 15px;
                    overflow-x: auto;
                    margin: 10px 0;
                }

                .endpoint-details code {
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    color: #495057;
                }

                .endpoint-details ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }

                .endpoint-details li {
                    margin: 5px 0;
                    color: #495057;
                }

                .endpoint-details code {
                    background: #e9ecef;
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-size: 12px;
                }

                .api-example {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }

                .api-example h4 {
                    color: #495057;
                    margin-bottom: 15px;
                    font-size: 16px;
                }

                .api-example pre {
                    background: #e9ecef;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    padding: 15px;
                    overflow-x: auto;
                    margin: 10px 0;
                }

                .api-example code {
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    color: #495057;
                }

                @media (max-width: 768px) {
                    .api-section {
                        padding: 20px;
                    }

                    .endpoint-header {
                        flex-wrap: wrap;
                        gap: 10px;
                    }

                    .description {
                        width: 100%;
                        order: 3;
                    }

                    .toggle-icon {
                        order: 2;
                    }
                }
            `
            }}/>

            <script dangerouslySetInnerHTML={{
                __html: `
                function toggleEndpoint(header) {
                    const details = header.nextElementSibling;
                    const icon = header.querySelector('.toggle-icon');
                    
                    if (details.classList.contains('active')) {
                        details.classList.remove('active');
                        header.classList.remove('expanded');
                    } else {
                        details.classList.add('active');
                        header.classList.add('expanded');
                    }
                }

                // 添加一些交互增强
                document.addEventListener('DOMContentLoaded', function() {
                    // 为所有的 endpoint-header 添加键盘支持
                    const headers = document.querySelectorAll('.endpoint-header');
                    headers.forEach(header => {
                        header.setAttribute('tabindex', '0');
                        header.addEventListener('keypress', function(e) {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleEndpoint(header);
                            }
                        });
                    });
                });
            `
            }}/>
        </div>
    )
}

export default ApiDocs
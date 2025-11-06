// 首页组件
import Header from './Header';

function HomePage() {
  return (
    <div class="container">
      <Header title="EasyTier 节点管理系统 - 公共节点" />
      
      <main class="main">
        <section class="hero">
          <h2>欢迎使用 EasyTier 节点管理系统</h2>
          <p>高效管理您的 EasyTier 节点，提供稳定的网络服务</p>
        </section>
        
        <section class="stats" id="stats">
          <div class="stat-card donut-card">
            <div class="donut-container" style="display:flex;flex-direction:column;align-items:center;">
              <canvas id="nodes-chart" width="120" height="120"></canvas>
              <div class="chart-text"><span id="nodes-text">-/-</span><span class="donut-label">在线节点</span></div>
            </div>
          </div>
          <div class="stat-card donut-card">
            <div class="donut-container" style="display:flex;flex-direction:column;align-items:center;">
              <canvas id="connections-chart" width="120" height="120"></canvas>
              <div class="chart-text"><span id="connections-text">-/-</span><span class="donut-label">当前连接</span></div>
            </div>
          </div>
          <div class="stat-card donut-card">
            <div class="donut-container" style="display:flex;flex-direction:column;align-items:center;">
              <canvas id="bandwidth-chart" width="120" height="120"></canvas>
              <div class="chart-text"><span id="bandwidth-text">-/-</span><span class="donut-label">带宽使用</span></div>
            </div>
          </div>
        </section>
        
        <section class="nodes-list">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2>公开节点列表</h2>
            <label class="toggle-switch">
              <input type="checkbox" id="show-offline-toggle" />
              <span>显示离线节点</span>
            </label>
          </div>
          <div class="nodes-table-container">
          <table class="nodes-table" id="nodes-table">
              <thead>
                <tr>
                  <th>节点名称</th>
                  <th>状态</th>
                  <th>地域</th>
                  <th>当前带宽</th>
                  <th>最大带宽</th>
                  <th>连接数</th>
                  <th>备注</th>
                  <th>已用流量</th>
                  <th>最大流量</th>
                  <th>允许中转</th>
                  <th>标签</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="nodes-container">
              <tr><td colspan="12" style="text-align: center;">加载中...</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <div id="public-node-detail-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 900px;">
            <span class="close" id="public-detail-close">&times;</span>
            <h2 id="public-detail-node-name">节点详情</h2>
            <div id="public-node-detail-content"></div>
          </div>
        </div>
        <div id="admin-node-detail-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 900px;">
            <span class="close" id="admin-detail-close">&times;</span>
            <h2 id="admin-detail-node-name">节点详情</h2>
            <div id="admin-node-detail-content"></div>
          </div>
        </div>
        <div id="admin-node-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 800px;">
            <span class="close" id="admin-edit-close">&times;</span>
            <h2 id="admin-modal-title">编辑节点</h2>
            <form id="admin-node-form">
              <input type="hidden" id="admin-node-id" />
              <div class="form-group">
                <label for="admin-node-name">节点名称 *</label>
                <input type="text" id="admin-node-name" required />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="admin-region-type">地域类型 *</label>
                  <select id="admin-region-type" required>
                    <option value="domestic">大陆</option>
                    <option value="overseas">海外</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="admin-region-detail">具体地区</label>
                  <input type="text" id="admin-region-detail" />
                </div>
              </div>
              <div class="form-group">
                <label>连接方式 *</label>
                <div id="admin-connections-container" style="margin-bottom: 10px;"></div>
                <button type="button" id="admin-add-connection-btn" class="btn-small" style="width: auto;">+ 添加连接</button>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="admin-max-bandwidth">最大带宽 (Mbps) *</label>
                  <input type="number" id="admin-max-bandwidth" required min="0" step="0.01" />
                </div>
                <div class="form-group">
                  <label for="admin-max-connections">最大连接数 *</label>
                  <input type="number" id="admin-max-connections" required min="1" />
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="admin-max-traffic">最大流量 (GB) *</label>
                  <input type="number" id="admin-max-traffic" required min="0" step="0.01" />
                </div>
                <div class="form-group">
                  <label for="admin-reset-cycle">每月重置日期 (0-31) *</label>
                  <input type="number" id="admin-reset-cycle" required min="0" max="31" />
                </div>
              </div>
              <div class="form-group">
                <label for="admin-valid-until">有效期至 *</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input type="date" id="admin-valid-until" required />
                  <label style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                    <input type="checkbox" id="admin-valid-long-term" style="width: 24px;" />长期有效
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="admin-allow-relay" style="width: auto; margin-right: 8px;" />允许中转
                </label>
              </div>
              <div class="form-group">
                <label for="admin-tags">标签</label>
                <input type="text" id="admin-tags" />
              </div>
              <div class="form-group">
                <label for="admin-notes">备注信息</label>
                <textarea id="admin-notes"></textarea>
              </div>
              <button type="submit" class="btn-primary">保存节点</button>
            </form>
          </div>
        </div>
      </main>
      
      <footer class="footer">
        <p>&copy; 2025 EasyTier 节点管理系统</p>
      </footer>
      
      <script src="/js/homepage.js"></script>
    </div>
  );
}

export default HomePage;
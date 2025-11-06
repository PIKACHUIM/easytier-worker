// 仪表板页面组件
import Header from './Header';

function DashboardPage() {
  return (
    <div class="container">
      <Header title="EasyTier 节点管理系统 - 我的节点" />
      
      <main class="main">
        <div class="dashboard-actions">
          <button id="add-node-btn" class="btn-primary">添加节点</button>
        </div>
        
        <div class="nodes-table-container">
          <table class="nodes-table" id="my-nodes-table">
            <thead>
              <tr>
                <th>节点名称</th>
                <th>状态</th>
                <th>地域</th>
                <th>当前带宽</th>
                <th>最大带宽</th>
                <th>连接数</th>
                <th>已用流量</th>
                <th>最大流量</th>
                <th>允许中转</th>
                <th>标签</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="nodes-container">
              <tr><td colspan="12" style="text-align: center;">加载中...</td></tr>
            </tbody>
          </table>
        </div>
        
        <div id="node-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 800px;">
            <span class="close" id="modal-close">&times;</span>
            <h2 id="node-modal-title">添加节点</h2>
            <form id="node-form">
              <input type="hidden" id="node-id" />
              
              <div class="form-group">
                <label for="node-name">节点名称 *</label>
                <input type="text" id="node-name" name="node_name" required placeholder="例如：北京节点1" />
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="region-type">地域类型 *</label>
                  <select id="region-type" name="region_type" required>
                    <option value="domestic">大陆</option>
                    <option value="overseas">海外</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="region-detail">具体地区</label>
                  <input type="text" id="region-detail" name="region_detail" placeholder="例如：北京、东京（可不填）" />
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="max-bandwidth">最大带宽 (Mbps) *</label>
                  <input type="number" id="max-bandwidth" name="max_bandwidth" required min="0" step="0.01" placeholder="1" value="1" />
                </div>
                <div class="form-group">
                  <label for="max-connections">最大连接数 *</label>
                  <input type="number" id="max-connections" name="max_connections" required min="1" placeholder="100" value="100" />
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                  <label for="max-traffic">最大流量 (GB) *</label>
                  <input type="number" id="max-traffic" name="max_traffic" required min="0" step="0.01" placeholder="0" value="0" />
                </div>
                <div class="form-group">
                  <label for="reset-cycle">重置周期 (天) *</label>
                  <input type="number" id="reset-cycle" name="reset_cycle" required min="0" placeholder="30" value="30" />
                </div>
              </div>
              
              <div class="form-group">
                <label>
                  <input type="checkbox" id="allow-relay" name="allow_relay" style="width: auto; margin-right: 8px;" />
                  允许中转
                </label>
              </div>
              
              <div class="form-group">
                <label for="tags">标签</label>
                <input type="text" id="tags" name="tags" placeholder="例如：高速、稳定" />
              </div>
              
              <div class="form-group">
                <label for="notes">备注信息</label>
                <textarea id="notes" name="notes" placeholder="节点的其他说明信息"></textarea>
              </div>
              
              <button type="submit" class="btn-primary">保存节点</button>
            </form>
          </div>
        </div>
        
        <div id="node-detail-modal" class="modal" style="display: none;">
          <div class="modal-content" style="max-width: 900px;">
            <span class="close" id="detail-close">&times;</span>
            <h2 id="detail-node-name">节点详情</h2>
            <div id="node-detail-content"></div>
          </div>
        </div>
      </main>
      
      <script src="/js/dashboard.js"></script>
    </div>
  );
}

export default DashboardPage;
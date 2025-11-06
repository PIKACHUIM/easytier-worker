// 管理面板页面组件
import Header from './Header';

function AdminPage() {
  return (
    <div class="container">
      <Header title="EasyTier 节点管理系统 - 管理面板" />
      
      <main class="main">
        <h2>所有节点</h2>
        <div class="nodes-table-container">
          <table class="nodes-table" id="admin-nodes-table">
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
      </main>
      
      <div id="admin-node-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 800px;">
          <span class="close" id="admin-edit-close">&times;</span>
          <h2 id="admin-modal-title">编辑节点</h2>
          <form id="admin-node-form">
            <input type="hidden" id="admin-node-id" />
            
            <div class="form-group">
              <label for="admin-node-name">节点名称 *</label>
              <input type="text" id="admin-node-name" required placeholder="例如：北京节点1" />
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
                <input type="text" id="admin-region-detail" placeholder="例如：北京、东京（可不填）" />
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
                <input type="number" id="admin-max-bandwidth" required min="0" step="0.01" placeholder="1" value="1" />
              </div>
              <div class="form-group">
                <label for="admin-max-connections">最大连接数 *</label>
                <input type="number" id="admin-max-connections" required min="1" placeholder="100" value="100" />
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div class="form-group">
                <label for="admin-max-traffic">最大流量 (GB) *</label>
                <input type="number" id="admin-max-traffic" required min="0" step="0.01" placeholder="0" value="0" />
              </div>
              <div class="form-group">
                <label for="admin-reset-cycle">每月重置日期 (0-31) *</label>
                <input type="number" id="admin-reset-cycle" required min="0" max="31" placeholder="0" value="0" />
              </div>
            </div>
            
            <div class="form-group">
              <label for="admin-valid-until">有效期至 *</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="date" id="admin-valid-until" required />
                <label style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                  <input type="checkbox" id="admin-valid-long-term" style="width: 24px;" />
                  长期有效
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="admin-allow-relay" style="width: auto; margin-right: 8px;" />
                允许中转
              </label>
            </div>
            
            <div class="form-group">
              <label for="admin-tags">标签</label>
              <input type="text" id="admin-tags" placeholder="例如：高速、稳定" />
            </div>
            
            <div class="form-group">
              <label for="admin-notes">备注信息</label>
              <textarea id="admin-notes" placeholder="节点的其他说明信息"></textarea>
            </div>
            
            <button type="submit" class="btn-primary">保存节点</button>
          </form>
        </div>
      </div>
      
      <div id="admin-node-detail-modal" class="modal" style="display: none;">
        <div class="modal-content" style="max-width: 900px;">
          <span class="close" id="admin-detail-close">&times;</span>
          <h2 id="admin-detail-node-name">节点详情</h2>
          <div id="admin-node-detail-content"></div>
        </div>
      </div>
      
      <script src="/js/admin.js"></script>
    </div>
  )
}

export default AdminPage;
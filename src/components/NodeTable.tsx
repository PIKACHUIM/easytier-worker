// 节点表格组件 - 现代设计，支持卡片/表格视图切换

interface NodesTableProps {
    mode: 'admin' | 'dashboard' | 'home';
    showOfflineToggle?: boolean;
    containerId?: string;
    tableId?: string;
}

function NodeTable({
                       mode,
                       showOfflineToggle = false,
                       containerId = 'nodes-container',
                       tableId = 'nodes-table'
                   }: NodesTableProps) {
    const colSpan = mode === 'admin' ? 13 : 12; // home/dashboard: 12列, admin: 13列（多用户邮箱列）
    const viewStorageKey = `nodeViewMode_${mode}`;

    return (
        <>
            {/* 节点列表标题栏 */}
            <div className="section-header">
                <h2 className="section-title">
                    {mode === 'home' ? '公开节点列表' : (mode === 'dashboard' ? '我的节点' : '所有节点')}
                </h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'}}>
                    {showOfflineToggle && (
                        <label className="toggle-switch">
                            <input type="checkbox" id="show-offline-toggle"/>
                            <span>显示离线节点</span>
                        </label>
                    )}
                    {/* 视图切换按钮 */}
                    <div className="view-switcher" id={`view-switcher-${mode}`} title="切换视图">
                        <button
                            className="view-btn"
                            id={`${mode}-table-view-btn`}
                            onclick={`window.switchNodeView('${mode}', 'table')`}
                            title="表格视图"
                        >
                            ☰
                        </button>
                        <button
                            className="view-btn active"
                            id={`${mode}-card-view-btn`}
                            onclick={`window.switchNodeView('${mode}', 'card')`}
                            title="卡片视图"
                        >
                            ⊞
                        </button>
                    </div>
                </div>
            </div>

            {/* 表格视图 - 默认隐藏 */}
            <div id={`${mode}-table-view`} className="nodes-table-container" style={{display: 'none'}}>
                <table className="nodes-table" id={tableId}>
                    <thead>
                    <tr>
                        <th style={{textAlign: 'left', minWidth: '180px'}}>节点名称</th>
                        <th style={{minWidth: '80px'}}>状态</th>
                        <th style={{minWidth: '140px'}}>地域</th>
                        <th style={{minWidth: '140px'}}>带宽</th>
                        <th style={{minWidth: '130px'}}>连接数</th>
                        <th style={{minWidth: '140px'}}>流量</th>
                        <th style={{minWidth: '160px'}}>连接信息</th>
                        <th style={{minWidth: '60px'}}>中转</th>
                        <th style={{minWidth: '90px'}}>节点状态</th>
                        {mode === 'admin' && <th style={{minWidth: '160px'}}>用户邮箱</th>}
                        <th style={{minWidth: '80px'}}>标签</th>
                        <th style={{minWidth: '120px', width: '100%'}}>备注</th>
                        <th style={{minWidth: '200px'}}>操作</th>
                    </tr>
                    </thead>
                    <tbody id={containerId}>
                    <tr>
                        <td colSpan={colSpan} style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                                <div style="width: 32px; height: 32px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                                <span>加载中...</span>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* 卡片视图 - 默认显示 */}
            <div id={`${mode}-card-view`} className="node-cards-grid">
                {/* 卡片由JS动态渲染，直接写入此容器 */}
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="width: 32px; height: 32px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;"></div>
                    <span>加载中...</span>
                </div>
            </div>

            {/* 视图切换脚本 - 仅定义一次switchNodeView，renderNodeCards在renderer.tsx中定义 */}
            <script dangerouslySetInnerHTML={{
                __html: `
(function() {
  if (window.switchNodeView) return; // 防止重复定义

  // 视图切换函数
  window.switchNodeView = function(mode, viewType) {
    var tableView = document.getElementById(mode + '-table-view');
    var cardView = document.getElementById(mode + '-card-view');
    var tableBtn = document.getElementById(mode + '-table-view-btn');
    var cardBtn = document.getElementById(mode + '-card-view-btn');
    if (!tableView || !cardView) return;

    if (viewType === 'table') {
      tableView.style.display = '';
      cardView.style.display = 'none';
      if (tableBtn) tableBtn.classList.add('active');
      if (cardBtn) cardBtn.classList.remove('active');
    } else {
      tableView.style.display = 'none';
      cardView.style.display = 'grid';
      if (tableBtn) tableBtn.classList.remove('active');
      if (cardBtn) cardBtn.classList.add('active');
      // 触发卡片渲染
      if (window._lastNodes && window._lastNodes[mode] && window.renderNodeCards) {
        window.renderNodeCards(mode, window._lastNodes[mode]);
      }
    }
    try { localStorage.setItem('nodeViewMode_' + mode, viewType); } catch(e) {}
  };
})();
                `
            }}/>

            {/* 节点详情模态框 */}
            {mode === 'home' && (
                <div id="home-node-detail-modal" className="modal" style={{display: 'none'}}>
                    <div className="modal-content" style={{maxWidth: '900px', margin: '0 auto'}}>
                        <button className="close" id="home-detail-close">&times;</button>
                        <h2 id="home-detail-node-name">节点详情</h2>
                        <div id="home-node-detail-content"></div>
                    </div>
                </div>
            )}

            {mode === 'dashboard' && (
                <div id="dashboard-node-detail-modal" className="modal" style={{display: 'none'}}>
                    <div className="modal-content" style={{maxWidth: '900px', margin: '0 auto'}}>
                        <button className="close" id="dashboard-detail-close">&times;</button>
                        <h2 id="dashboard-detail-node-name">节点详情</h2>
                        <div id="dashboard-node-detail-content"></div>
                    </div>
                </div>
            )}

            {mode === 'admin' && (
                <div id="admin-node-detail-modal" className="modal" style={{display: 'none'}}>
                    <div className="modal-content" style={{maxWidth: '900px', margin: '0 auto'}}>
                        <button className="close" id="admin-detail-close">&times;</button>
                        <h2 id="admin-detail-node-name">节点详情</h2>
                        <div id="admin-node-detail-content"></div>
                    </div>
                </div>
            )}
        </>
    );
}

export default NodeTable;
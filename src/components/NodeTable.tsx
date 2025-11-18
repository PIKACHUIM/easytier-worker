// 节点表格组件

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
    const colSpan = 11;

    return (
        <>
            {showOfflineToggle && (
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2>公开节点列表</h2>
                    <label className="toggle-switch">
                        <input type="checkbox" id="show-offline-toggle"/>
                        <span>显示离线节点</span>
                    </label>
                </div>
            )}

            <div className="nodes-table-container">
                <table className="nodes-table" id={tableId}>
                    <thead>
<tr>
                        <th style={{textAlign: 'center', 'min-width': '100px'}}>节点名称</th>
                        <th style={{textAlign: 'center', 'min-width': '70px'}}>状态</th>
                        <th style={{textAlign: 'center', 'min-width': '120px'}}>地域</th>
                        <th style={{textAlign: 'center', 'min-width': '150px'}}>带宽</th>
                        <th style={{textAlign: 'center', 'min-width': '150px'}}>连接数</th>
                        <th style={{textAlign: 'center', 'min-width': '150px'}}>流量</th>
                        <th style={{textAlign: 'center', 'min-width': '150px'}}>连接信息</th>
                        <th style={{textAlign: 'center', 'min-width': '70px'}}>中转</th>
                        <th style={{textAlign: 'center', 'min-width': '70px'}}>标签</th>
                        <th style={{textAlign: 'center', width: '100%'}}>备注</th>
                        <th style={{textAlign: 'center', 'min-width': '200px'}}>操作</th>
                    </tr>
                    </thead>
                    <tbody id={containerId}>
                    <tr>
                        <td colSpan={colSpan} style={{textAlign: 'center'}}>加载中...</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* 节点详情模态框 - 根据模式生成不同的ID */}
            {mode === 'home' && (
                <div id={`home-node-detail-modal`} className="modal" style={{display: 'none'}}>
                    <div className="modal-content" style={{maxWidth: '900px'}}>
                        <span className="close" id={`home-detail-close`}>&times;</span>
                        <h2 id={`home-detail-node-name`}>节点详情</h2>
                        <div id={`home-node-detail-content`}></div>
                    </div>
                </div>
            )}

            {mode === 'dashboard' && (
                <div id={`dashboard-node-detail-modal`} className="modal" style={{display: 'none'}}>
                    <div className="modal-content" style={{maxWidth: '900px'}}>
                        <span className="close" id={`dashboard-detail-close`}>&times;</span>
                        <h2 id={`dashboard-detail-node-name`}>节点详情</h2>
                        <div id={`dashboard-node-detail-content`}></div>
                    </div>
                </div>
            )}

            {mode === 'admin' && (
                <div id={`admin-node-detail-modal`} className="modal" style={{display: 'none'}}>
                    <div className="modal-content" style={{maxWidth: '900px'}}>
                        <span className="close" id={`admin-detail-close`}>&times;</span>
                        <h2 id={`admin-detail-node-name`}>节点详情</h2>
                        <div id={`admin-node-detail-content`}></div>
                    </div>
                </div>
            )}
        </>
    );
}

export default NodeTable;
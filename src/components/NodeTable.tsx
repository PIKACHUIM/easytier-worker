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
    const getTableColumns = () => {
        return [
            {key: 'name', label: '节点名称'},
            {key: 'status', label: '状态'},
            {key: 'region', label: '地域'},
            {key: 'current_bandwidth', label: '当前带宽'},
            {key: 'max_bandwidth', label: '最大带宽'},
            {key: 'connections', label: '连接数'},
            {key: 'used_traffic', label: '已用流量'},
            {key: 'max_traffic', label: '最大流量'},
            {key: 'allow_relay', label: '允许中转'},
            {key: 'tags', label: '标签'},
            {key: 'notes', label: '备注'},
            {key: 'actions', label: '操作'}
        ];
    };

    const columns = getTableColumns();
    const colSpan = columns.length;

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
                        {columns.map(column => (
                            <th key={column.key}>{column.label}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody id={containerId}>
                    <tr>
                        <td colSpan={colSpan} style={{textAlign: 'center'}}>加载中...</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* 节点详情模态框 */}
            <div id={`${mode}-node-detail-modal`} className="modal" style={{display: 'none'}}>
                <div className="modal-content" style={{maxWidth: '900px'}}>
                    <span className="close" id={`${mode}-detail-close`}>&times;</span>
                    <h2 id={`${mode}-detail-node-name`}>节点详情</h2>
                    <div id={`${mode}-node-detail-content`}></div>
                </div>
            </div>
        </>
    );
}

export default NodeTable;
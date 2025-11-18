// 管理面板页面组件
import React from 'react';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';
import NodeTable from './NodeTable';
import NodeEdits from './NodeEdits';

function HostNodes() {
    return (
<div className="container">
            <WebHeader title="EasyTier 节点管理系统 - 管理面板"/>

<main className="main">
                <div className="dashboard-actions">
                    <button id="add-node-btn" className="btn-primary">添加节点</button>
                </div>
                <NodeTable
                    mode="admin"
                    containerId="nodes-container"
                    tableId="admin-nodes-table"
                />
            </main>

<NodeEdits mode="admin" modalId="admin-node-modal" formId="admin-node-form" title="添加节点"/>

            <WebFooter title="管理面板页面"/>

            <script src="/js/common.js"></script>
            <script src="/js/admin.js"></script>
        </div>
    )
}

export default HostNodes;
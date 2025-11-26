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
                <div className="dashboard-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <button id="add-node-btn" className="btn-primary">添加节点</button>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <label htmlFor="user-filter" style="margin: 0;">筛选用户：</label>
                        <input 
                            type="text" 
                            id="user-filter" 
                            placeholder="输入用户邮箱筛选" 
                            style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 250px;"
                        />
                        <button id="clear-filter-btn" className="btn-small" style="padding: 8px 16px;">清除筛选</button>
                    </div>
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
// 仪表板页面组件
import React from 'react';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';
import NodeTable from './NodeTable';
import NodeEdits from './NodeEdits';

function UserNodes() {
  return (
<div className="container">
      <WebHeader title="EasyTier 节点管理系统 - 我的节点" />
      
<main className="main">
<div className="dashboard-header">
<div className="dashboard-actions" style="display: flex; justify-content: space-between; align-items: center;">
<button id="add-node-btn" className="btn-primary">添加节点</button>
          </div>
        </div>
        
        <NodeTable
          mode="dashboard"
          containerId="nodes-container"
          tableId="my-nodes-table"
        />
      </main>
      
      <NodeEdits mode="dashboard" modalId="dashboard-node-modal" formId="dashboard-node-form" title="添加节点" />
      
      <WebFooter title="我的节点页面" />
      
      <script src="/js/common.js"></script>
      <script src="/js/dashboard.js"></script>
    </div>
  );
}

export default UserNodes;
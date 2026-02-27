// 仪表板页面组件 - 现代设计
import React from 'react';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';
import NodeTable from './NodeTable';
import NodeEdits from './NodeEdits';

function UserNodes() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统 - 我的节点"/>

            <main className="main-content">
                <div className="container">
                    {/* 页面标题 */}
                    <div className="dashboard-header fade-in-up">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                            <div>
                                <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 4px;">
                                    我的节点
                                </h1>
                                <p style="color: var(--text-secondary); font-size: 14px;">管理您的 EasyTier 节点</p>
                            </div>
                            <button id="add-node-btn" className="btn-primary">
                                <span>+</span>
                                <span>添加节点</span>
                            </button>
                        </div>
                    </div>

                    {/* 节点表格 */}
                    <div className="fade-in-up" style="animation-delay: 0.1s;">
                        <NodeTable
                            mode="dashboard"
                            containerId="nodes-container"
                            tableId="my-nodes-table"
                        />
                    </div>
                </div>
            </main>

            <NodeEdits mode="dashboard" modalId="dashboard-node-modal" formId="dashboard-node-form" title="添加节点"/>

            <WebFooter title="我的节点页面"/>
            <script src="/js/common.js"></script>
            <script src="/js/dashboard.js"></script>
        </div>
    );
}

export default UserNodes;
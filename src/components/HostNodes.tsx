// 管理面板页面组件 - 现代设计
import React from 'react';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';
import NodeTable from './NodeTable';
import NodeEdits from './NodeEdits';

function HostNodes() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统 - 管理面板"/>

            <main className="main-content">
                <div className="container">
                    {/* 页面标题 */}
                    <div className="fade-in-up" style="margin-bottom: 24px;">
                        <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 4px;">
                            管理面板
                        </h1>
                        <p style="color: var(--text-secondary); font-size: 14px;">管理所有用户的 EasyTier 节点</p>
                    </div>

                    {/* 操作栏 */}
                    <div className="dashboard-actions fade-in-up" style="animation-delay: 0.05s; margin-bottom: 20px;">
                        <button id="add-node-btn" className="btn-primary">
                            <span>+</span>
                            <span>添加节点</span>
                        </button>
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <label for="user-filter" style="color: var(--text-secondary); font-size: 13px; font-weight: 500; white-space: nowrap;">
                                筛选用户：
                            </label>
                            <input
                                type="text"
                                id="user-filter"
                                placeholder="输入用户邮箱筛选"
                                style="padding: 8px 14px; border: 1px solid var(--bg-glass-border); border-radius: var(--radius-md); background: var(--bg-glass); color: var(--text-primary); font-size: 13px; width: 240px; outline: none;"
                            />
                            <button id="clear-filter-btn" className="btn-secondary" style="padding: 8px 16px; font-size: 13px;">
                                清除筛选
                            </button>
                        </div>
                    </div>

                    {/* 节点表格 */}
                    <div className="fade-in-up" style="animation-delay: 0.1s;">
                        <NodeTable
                            mode="admin"
                            containerId="nodes-container"
                            tableId="admin-nodes-table"
                        />
                    </div>
                </div>
            </main>

            <NodeEdits mode="admin" modalId="admin-node-modal" formId="admin-node-form" title="添加节点"/>

            <WebFooter title="管理面板页面"/>
            <script src="/js/common.js"></script>
            <script src="/js/admin.js"></script>
        </div>
    )
}

export default HostNodes;
// 首页组件 - 现代设计
import React from 'react';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';
import NodeTable from './NodeTable';
import NodeEdits from './NodeEdits';

function HomeIndex() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统"/>

            <main className="main-content">
                <div className="container">
                    {/* Hero 区域 */}
                    <section className="hero fade-in-up">
                        {/*<div className="hero-badge">*/}
                        {/*    <span>🌐</span>*/}
                        {/*    <span>EasyTier Network</span>*/}
                        {/*</div>*/}
                        <h2>
                             <span className="gradient-text">EasyTier</span>节点管理系统
                        </h2>
                        <p>高效管理您的 EasyTier 节点，提供稳定可靠的网络服务</p>
                    </section>

                    {/* 统计仪表板 - 全新设计 */}
                    <section id="stats" className="fade-in-up" style="animation-delay: 0.1s;">
                        <div className="stats-grid-new">
                            {/* 在线节点卡片 */}
                            <div className="stat-card-new nodes-stat">
                                <div className="stat-card-top">
                                    <div>
                                        <div className="stat-card-label">在线节点</div>
                                        <div className="stat-card-number" id="nodes-text">—</div>
                                        <div className="stat-card-sub">在线 / 总节点数</div>
                                    </div>
                                    {/* 甜甜圈图 */}
                                    <div className="stat-card-donut">
                                        <canvas id="nodes-chart" width="72" height="72" className="stat-donut-canvas"></canvas>
                                        <div className="stat-donut-legend">
                                            <div className="stat-legend-item">
                                                <span className="stat-legend-dot" style="background: #10b981;"></span>
                                                <span>在线节点</span>
                                            </div>
                                            <div className="stat-legend-item">
                                                <span className="stat-legend-dot" style="background: #ef4444;"></span>
                                                <span>离线节点</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="stat-card-icon green">🖥️</div>
                                </div>
                                {/* 趋势折线图 */}
                                <div className="stat-card-chart" style="margin-top: 12px;">
                                    <canvas id="nodes-trend-chart" style="width:100%;height:60px;"></canvas>
                                </div>
                            </div>

                            {/* 连接负载卡片 */}
                            <div className="stat-card-new connections-stat">
                                <div className="stat-card-top">
                                    <div>
                                        <div className="stat-card-label">连接负载</div>
                                        <div className="stat-card-number" id="connections-text">—</div>
                                        <div className="stat-card-sub">当前 / 最大连接数</div>
                                    </div>
                                    {/* 甜甜圈图 */}
                                    <div className="stat-card-donut">
                                        <canvas id="connections-chart" width="72" height="72" className="stat-donut-canvas"></canvas>
                                        <div className="stat-donut-legend">
                                            <div className="stat-legend-item">
                                                <span className="stat-legend-dot" style="background: #3b82f6;"></span>
                                                <span>已用连接</span>
                                            </div>
                                            <div className="stat-legend-item">
                                                <span className="stat-legend-dot" style="background: #e5e7eb;"></span>
                                                <span>剩余容量</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="stat-card-icon blue">🔗</div>
                                </div>
                                {/* 趋势折线图 */}
                                <div className="stat-card-chart" style="margin-top: 12px;">
                                    <canvas id="connections-trend-chart" style="width:100%;height:60px;"></canvas>
                                </div>
                            </div>

                            {/* 带宽负载卡片 */}
                            <div className="stat-card-new bandwidth-stat">
                                <div className="stat-card-top">
                                    <div>
                                        <div className="stat-card-label">带宽负载</div>
                                        <div className="stat-card-number" id="bandwidth-text">—</div>
                                        <div className="stat-card-sub">当前 / 阶梯带宽 (M)</div>
                                    </div>
                                    {/* 甜甜圈图 */}
                                    <div className="stat-card-donut">
                                        <canvas id="bandwidth-chart" width="72" height="72" className="stat-donut-canvas"></canvas>
                                        <div className="stat-donut-legend">
                                            <div className="stat-legend-item">
                                                <span className="stat-legend-dot" style="background: #f59e0b;"></span>
                                                <span>当前带宽</span>
                                            </div>
                                            <div className="stat-legend-item">
                                                <span className="stat-legend-dot" style="background: #e5e7eb;"></span>
                                                <span>剩余容量</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="stat-card-icon amber">📡</div>
                                </div>
                                {/* 趋势折线图（双线：当前带宽 + 阶梯带宽） */}
                                <div className="stat-card-chart" style="margin-top: 12px;">
                                    <canvas id="bandwidth-trend-chart" style="width:100%;height:60px;"></canvas>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 节点列表 */}
                    <section className="nodes-list fade-in-up" style="animation-delay: 0.2s;">
                        <div id="public-stats" style="display: none;"></div>

                        <NodeTable
                            mode="home"
                            showOfflineToggle={true}
                            containerId="nodes-container"
                            tableId="nodes-table"
                        />
                    </section>

                    <NodeEdits mode="admin"/>
                </div>
            </main>

            <WebFooter title="公共节点页面"/>
            <script src="/js/common.js"></script>
            <script src="/js/homepage.js"></script>
        </div>
    );
}

export default HomeIndex;
// 首页组件
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';
import NodeTable from './NodeTable';
import NodeEdits from './NodeEdits';

function HomeIndex() {
    return (
<div className="container" style="text-align: center;">
            <WebHeader title="EasyTier 节点管理系统 - 公共节点"/>

<main className="main">
<section className="hero">
                    <h2>欢迎使用 EasyTier 节点管理系统</h2>
                    <p>高效管理您的 EasyTier 节点，提供稳定的网络服务</p>
                </section>
<section className="stats-dashboard" id="stats">
<div className="stats-grid">
                        {/* 在线节点卡片 */}
<div className="stat-card-item" style="display: flex; align-items: center; justify-content: center;">
<div className="stat-card-content-vertical" style="width: 240px; flex-shrink: 0;">
<div className="stat-chart-top" style="display: flex; justify-content: center;">
                                    <canvas id="nodes-chart" width="120" height="120"></canvas>
                                </div>
<div className="stat-info-bottom">
                                    <h3>在线节点</h3>
<div className="stat-value" id="nodes-text">-/-</div>
                                </div>
                            </div>
<div className="stat-trend-side" style="flex: 1; margin-left: 20px; padding: 10px;">
                                <canvas id="nodes-trend-chart" style="width: 100%; height: 180px;"></canvas>
                            </div>
                        </div>

                        {/* 当前连接卡片 */}
<div className="stat-card-item" style="display: flex; align-items: center; justify-content: center;">
<div className="stat-card-content-vertical" style="width: 240px; flex-shrink: 0;">
<div className="stat-chart-top" style="display: flex; justify-content: center;">
                                    <canvas id="connections-chart" width="120" height="120"></canvas>
                                </div>
<div className="stat-info-bottom">
                                    <h3>连接负载</h3>
<div className="stat-value" id="connections-text">-/-</div>
                                </div>
                            </div>
<div className="stat-trend-side" style="flex: 1; margin-left: 20px; padding: 10px;">
                                <canvas id="connections-trend-chart" style="width: 100%; height: 180px;"></canvas>
                            </div>
                        </div>

                        {/* 当前带宽卡片 */}
<div className="stat-card-item" style="display: flex; align-items: center; justify-content: center;">
<div className="stat-card-content-vertical" style="width: 240px; flex-shrink: 0;">
<div className="stat-chart-top" style="display: flex; justify-content: center;">
                                    <canvas id="bandwidth-chart" width="120" height="120"></canvas>
                                </div>
<div className="stat-info-bottom">
                                    <h3>带宽负载</h3>
<div className="stat-value" id="bandwidth-text">-/-</div>
                                </div>
                            </div>
<div className="stat-trend-side" style="flex: 1; margin-left: 20px; padding: 10px;">
                                <canvas id="bandwidth-trend-chart" style="width: 100%; height: 180px;"></canvas>
                            </div>
                        </div>
                    </div>
                </section>
<section className="nodes-list">
                    <div id="public-stats"
                         style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; display: none;">
                        {/* 统计信息将通过JavaScript动态填充 */}
                    </div>
                    <hr style="border: none; height: 1px; background-color: #e0e0e0; margin: 30px 0;" />
                    <NodeTable
                        mode="home"
                        showOfflineToggle={true}
                        containerId="nodes-container"
                        tableId="nodes-table"
                    />
                </section>
                <NodeEdits mode="admin"/>
            </main>
            <WebFooter title="公共节点页面"/>
            <script src="/js/common.js"></script>
            <script src="/js/homepage.js"></script>
        </div>
    );
}

export default HomeIndex;
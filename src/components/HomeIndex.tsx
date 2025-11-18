// 首页组件
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';
import NodeTable from './NodeTable';
import NodeEdits from './NodeEdits';

function HomeIndex() {
    return (
        <div class="container">
            <WebHeader title="EasyTier 节点管理系统 - 公共节点"/>

            <main class="main">
                <section class="hero">
                    <h2>欢迎使用 EasyTier 节点管理系统</h2>
                    <p>高效管理您的 EasyTier 节点，提供稳定的网络服务</p>
                </section>
                <section class="stats-dashboard" id="stats">
                    <div class="stats-grid">
                        {/* 在线节点卡片 */}
                        <div class="stat-card-item">
                            <div class="stat-card-content-vertical">
                                <div class="stat-chart-top">
                                    <canvas id="nodes-chart" width="120" height="120"></canvas>
                                </div>
                                <div class="stat-info-bottom">
                                    <h3>在线节点</h3>
                                    <div class="stat-value" id="nodes-text">-/-</div>
                                </div>
                            </div>
                            <div class="stat-trend-side">
                                <canvas id="nodes-trend-chart" width="300" height="160"></canvas>
                            </div>
                        </div>

                        {/* 当前连接卡片 */}
                        <div class="stat-card-item">
                            <div class="stat-card-content-vertical">
                                <div class="stat-chart-top">
                                    <canvas id="connections-chart" width="120" height="120"></canvas>
                                </div>
                                <div class="stat-info-bottom">
                                    <h3>当前连接</h3>
                                    <div class="stat-value" id="connections-text">-/-</div>
                                </div>
                            </div>
                            <div class="stat-trend-side">
                                <canvas id="connections-trend-chart" width="300" height="160"></canvas>
                            </div>
                        </div>

                        {/* 当前带宽卡片 */}
                        <div class="stat-card-item">
                            <div class="stat-card-content-vertical">
                                <div class="stat-chart-top">
                                    <canvas id="bandwidth-chart" width="120" height="120"></canvas>
                                </div>
                                <div class="stat-info-bottom">
                                    <h3>当前带宽</h3>
                                    <div class="stat-value" id="bandwidth-text">-/-</div>
                                </div>
                            </div>
                            <div class="stat-trend-side">
                                <canvas id="bandwidth-trend-chart" width="300" height="160"></canvas>
                            </div>
                        </div>
                    </div>
                </section>
                <section class="nodes-list">
                    <div id="public-stats"
                         style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; display: none;">
                        {/* 统计信息将通过JavaScript动态填充 */}
                    </div>
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
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
                <section class="stats" id="stats">
                    <div class="stat-card donut-card">
                        <div class="donut-container"
                             style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <canvas id="nodes-chart" width="120" height="120"></canvas>
                            <div class="chart-text"><span id="nodes-text">-/-</span><span
                                class="donut-label">在线节点</span></div>
                        </div>
                    </div>
                    <div class="stat-card donut-card">
                        <div class="donut-container"
                             style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <canvas id="connections-chart" width="120" height="120"></canvas>
                            <div class="chart-text"><span id="connections-text">-/-</span><span
                                class="donut-label">当前连接</span></div>
                        </div>
                    </div>
                    <div class="stat-card donut-card">
                        <div class="donut-container"
                             style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <canvas id="bandwidth-chart" width="120" height="120"></canvas>
                            <div class="chart-text"><span id="bandwidth-text">-/-</span><span
                                class="donut-label">带宽使用</span></div>
                        </div>
                    </div>
                </section>
                <section class="nodes-list">
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
            <script src="/js/homepage.js"></script>
        </div>
    );
}

export default HomeIndex;
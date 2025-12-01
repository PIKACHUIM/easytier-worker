// 统一标题栏组件
function WebFooter({title}: { title: string }) {
    return (
        <footer className="footer">
            <p>&copy; 2025 EasyTier 节点管理平台 保留一切的权利</p>
            <p>&copy; 2025 EasyTier Nodes Manage Platform, All Rights Reserved</p>
            <p>本站点为第三方自建，与<a href="https://github.com/EasyTier">EasyTier开源项目</a>无关</p>
            <p>项目开源地址：<a href="https://github.com/PIKACHUIM/easytier-worker">EasyTier Worker</a></p>
        </footer>
    )
}

export default WebFooter;
// 现代页脚组件
function WebFooter({title}: { title: string }) {
    return (
        <footer className="footer">
            <div className="container">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #4f46e5, #6366f1); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px;">🌐</div>
                        <span style="font-weight: 600; color: #94a3b8; font-size: 14px;">EasyTier Node Manager</span>
                    </div>
                    <p>© 2025 EasyTier 节点管理平台，保留一切权利 | 本站为自建平台，与<a href="https://github.com/EasyTier" target="_blank">EasyTier项目</a>无关，本项目地址: <a href="https://github.com/PIKACHUIM/easytier-worker" target="_blank">EasyTier Worker</a></p>
                    <p>© 2025 EasyTier Node Management Platform, All Rights Reserved | This is a self-hosted platform, unaffiliated with the <a href="https://github.com/EasyTier" target="_blank">EasyTier Project</a>. Repository: <a href="https://github.com/PIKACHUIM/easytier-worker" target="_blank">EasyTier Worker</a></p>

                </div>
            </div>
        </footer>
    )
}

export default WebFooter;
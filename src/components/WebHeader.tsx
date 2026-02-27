// 现代导航栏组件 - 支持多语言切换
function WebHeader({title}: { title: string }) {
    return (
        <header className="header">
            <div className="header-inner">
                {/* 品牌Logo */}
                <a href="/" className="header-brand">
                    <div className="header-brand-logo">🌐</div>
                    <span className="header-brand-text">
                        Easy<span>Tier</span>
                    </span>
                </a>

                {/* 导航链接 */}
                <nav className="header-nav" id="main-nav">
                    <a href="/" className="nav-link" id="home-link">公共节点</a>
                    <a href="/dashboard" className="nav-link" id="dashboard-link" style="display: none;">我的节点</a>
                    <a href="/usertoken" className="nav-link" id="token-link" style="display: none;">个人设置</a>
                    <a href="/admin" className="nav-link" id="admin-link" style="display: none;">管理面板</a>
                    <a href="/settings" className="nav-link" id="settings-link" style="display: none;">系统设置</a>
                    <a href="/api-docs" className="nav-link" id="api-docs-link">API文档</a>
                    <a href="/login" className="nav-link" id="login-link">登录</a>
                    <a href="#" className="nav-link" id="logout-link" style="display: none;">退出</a>

                    {/* 语言切换 */}
                    <div className="lang-switcher" title="切换语言 / Switch Language">
                        <button className="lang-btn active" data-lang="zh" onclick="window.setLang('zh')">中</button>
                        <button className="lang-btn" data-lang="en" onclick="window.setLang('en')">EN</button>
                    </div>

                    {/* 主题切换 */}
                    <button
                        id="theme-toggle-btn"
                        onclick="window.toggleTheme()"
                        title="切换到白天模式"
                        style="width: 34px; height: 34px; border-radius: var(--radius-full); border: 1px solid var(--bg-glass-border); background: var(--bg-glass); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); flex-shrink: 0;"
                        onmouseover="this.style.background='var(--bg-card-hover)'; this.style.transform='scale(1.1)'"
                        onmouseout="this.style.background='var(--bg-glass)'; this.style.transform='scale(1)'"
                    >🌙</button>
                </nav>
            </div>
        </header>
    )
}

export default WebHeader;
// 统一标题栏组件
function WebHeader({title}: { title: string }) {
    return (
<header className="header">
<div className="header-content">
                <h1>{title}</h1>
                {/*<div class="user-info" id="user-info">*/}
                {/*  <span id="user-info-text">加载中...</span>*/}
                {/*</div>*/}
            </div>
            <nav id="main-nav">
                <a href="/" id="home-link">公共节点</a>
                <a href="/dashboard" id="dashboard-link" style="display: none;">我的节点</a>
                <a href="/usertoken" id="token-link" style="display: none;">个人设置</a>
                <a href="/admin" id="admin-link" style="display: none;">管理面板</a>
                <a href="/settings" id="settings-link" style="display: none;">系统设置</a>
                <a href="#" id="logout-link" style="display: none;">退出</a>
                <a href="/login" id="login-link">登录</a>
            </nav>
        </header>
    )
}

export default WebHeader;
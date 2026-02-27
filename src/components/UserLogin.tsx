// 登录页面组件 - 现代设计
import WebHeader from "./WebHeader";
import WebFooter from './WebFooter';

function UserLogin() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统 - 用户登录"/>

            <main className="main-content">
                <div className="auth-page">
                    <div className="auth-card fade-in-up">
                        {/* Logo区域 */}
                        <div className="auth-logo">
                            <div className="auth-logo-icon">🌐</div>
                            <h1>EasyTier 节点管理系统</h1>
                        </div>

                        {/* 表单标题 */}
                        <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px; text-align: center;">
                            欢迎回来
                        </h2>

                        {/* 消息提示 */}
                        <div id="login-message" style="display: none; margin-bottom: 16px;"></div>

                        {/* 登录表单 */}
                        <form id="login-form" className="auth-form">
                            <div className="form-group">
                                <label for="email">邮箱地址</label>
                                <input type="email" id="email" name="email" required
                                       placeholder="请输入您的邮箱"/>
                            </div>
                            <div className="form-group">
                                <label for="password">密码</label>
                                <input type="password" id="password" name="password" required
                                       placeholder="请输入您的密码"/>
                            </div>
                            <button type="submit" style="width: 100%; margin-top: 8px;">
                                登录
                            </button>
                        </form>

                        {/* 辅助链接 */}
                        <div className="auth-links" style="margin-top: 20px;">
                            <p>还没有账户？<a href="/register">立即注册</a></p>
                            <p style="margin-top: 8px;"><a href="/reset-password">忘记密码？</a></p>
                        </div>
                    </div>
                </div>
            </main>

            <WebFooter title="用户登录页面"/>
            <script src="/js/login.js"></script>
        </div>
    )
}

export default UserLogin;
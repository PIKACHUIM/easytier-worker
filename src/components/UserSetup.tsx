// 注册页面组件 - 现代设计
import WebHeader from "./WebHeader";
import WebFooter from './WebFooter';

function UserSetup() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统 - 用户注册"/>

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
                            创建账户
                        </h2>

                        {/* 消息提示 */}
                        <div id="register-message" style="display: none; margin-bottom: 16px;"></div>

                        {/* 注册表单 */}
                        <form id="register-form" className="auth-form">
                            <div className="form-group">
                                <label for="email">邮箱地址</label>
                                <input type="email" id="email" name="email" required
                                       placeholder="请输入您的邮箱"/>
                            </div>
                            <div className="form-group">
                                <label for="password">密码</label>
                                <input type="password" id="password" name="password" required minLength={6}
                                       placeholder="请设置密码（至少6位）"/>
                            </div>
                            <div className="form-group">
                                <label for="confirm-password">确认密码</label>
                                <input type="password" id="confirm-password" name="confirm-password" required
                                       placeholder="请再次输入密码"/>
                            </div>
                            <button type="submit" style="width: 100%; margin-top: 8px;">
                                注册
                            </button>
                        </form>

                        {/* 辅助链接 */}
                        <div className="auth-links" style="margin-top: 20px;">
                            <p>已有账户？<a href="/login">立即登录</a></p>
                        </div>
                    </div>
                </div>
            </main>

            <WebFooter title="用户注册页面"/>
            <script src="/js/register.js"></script>
        </div>
    )
}

export default UserSetup;
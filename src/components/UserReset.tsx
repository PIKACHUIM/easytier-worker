// 密码重置页面组件 - 现代设计
import WebHeader from "./WebHeader";
import WebFooter from './WebFooter';

function UserReset() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统 - 密码重置"/>

            <main className="main-content">
                <div className="auth-page">
                    <div className="auth-card fade-in-up">
                        {/* Logo区域 */}
                        <div className="auth-logo">
                            <div className="auth-logo-icon">🔑</div>
                            <h1>EasyTier</h1>
                            <p>密码重置</p>
                        </div>

                        {/* 消息提示 */}
                        <div id="reset-message" style="display: none; margin-bottom: 16px;"></div>

                        {/* 请求密码重置表单 */}
                        <div id="request-reset-form-container">
                            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; text-align: center;">
                                请输入您的邮箱地址，我们将发送密码重置链接到您的邮箱。
                            </p>
                            <form id="request-reset-form" className="auth-form">
                                <div className="form-group">
                                    <label for="email">邮箱地址</label>
                                    <input type="email" id="email" name="email" required
                                           placeholder="请输入您的邮箱"/>
                                </div>
                                <button type="submit" style="width: 100%;">发送重置链接</button>
                            </form>
                            <div className="auth-links" style="margin-top: 16px;">
                                <a href="/login">← 返回登录</a>
                            </div>
                        </div>

                        {/* 重置密码表单（通过token） */}
                        <div id="reset-password-form-container" style="display: none;">
                            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; text-align: center;">
                                请输入您的新密码。
                            </p>
                            <form id="reset-password-form" className="auth-form">
                                <input type="hidden" id="reset-token" name="reset-token"/>
                                <div className="form-group">
                                    <label for="new-password">新密码</label>
                                    <input type="password" id="new-password" name="new-password" required minLength={6}
                                           placeholder="请输入新密码（至少6位）"/>
                                </div>
                                <div className="form-group">
                                    <label for="confirm-password">确认新密码</label>
                                    <input type="password" id="confirm-password" name="confirm-password" required
                                           placeholder="请再次输入新密码"/>
                                </div>
                                <button type="submit" style="width: 100%;">重置密码</button>
                            </form>
                            <div className="auth-links" style="margin-top: 16px;">
                                <a href="/login">← 返回登录</a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <WebFooter title="密码重置页面"/>
            <script src="/js/reset-password.js"></script>
        </div>
    )
}

export default UserReset;
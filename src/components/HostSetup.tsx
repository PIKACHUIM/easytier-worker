// 系统初始化页面组件 - 现代设计
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';

function HostSetup() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统 - 系统初始化"/>

            <main className="main-content">
                <div className="auth-page">
                    <div className="auth-card fade-in-up" style="max-width: 520px;">
                        {/* Logo区域 */}
                        <div className="auth-logo">
                            <div className="auth-logo-icon">⚙️</div>
                            <h1>EasyTier</h1>
                            <p>系统初始化</p>
                        </div>

                        {/* 说明信息 */}
                        <div className="info-box" style="margin-bottom: 24px; text-align: left;">
                            <p style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">初始化说明：</p>
                            <p style="margin-bottom: 8px; color: var(--text-secondary); font-size: 13px;">
                                点击"初始化系统"按钮后，系统将自动完成以下操作：
                            </p>
                            <ol style="margin: 0; padding-left: 20px; color: var(--text-secondary); font-size: 13px; line-height: 1.8;">
                                <li>导入数据库表结构（users、nodes、confs）</li>
                                <li>创建超级管理员账户</li>
                                <li>完成系统初始化配置</li>
                            </ol>
                        </div>

                        {/* 消息提示 */}
                        <div id="message" style="margin-bottom: 16px;"></div>

                        {/* 初始化表单 */}
                        <form id="init-form" className="auth-form">
                            <div className="form-group">
                                <label for="jwt-secret">JWT 密钥</label>
                                <input
                                    type="password"
                                    id="jwt-secret"
                                    name="jwt-secret"
                                    required
                                    placeholder="请输入环境变量中的 JWT_SECRET"
                                />
                                <small>请输入 wrangler.jsonc 中配置的 JWT_SECRET</small>
                            </div>

                            <div className="form-group">
                                <label for="email">管理员邮箱</label>
                                <input type="email" id="email" name="email" required
                                       placeholder="admin@example.com"/>
                            </div>
                            <div className="form-group">
                                <label for="password">密码</label>
                                <input type="password" id="password" name="password" required minLength={6}
                                       placeholder="请设置管理员密码（至少6位）"/>
                            </div>
                            <div className="form-group">
                                <label for="confirm-password">确认密码</label>
                                <input type="password" id="confirm-password" name="confirm-password" required
                                       placeholder="请再次输入密码"/>
                            </div>
                            <button type="submit" id="init-submit-btn" style="width: 100%;">
                                初始化系统
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <WebFooter title="系统初始化页面"/>
            <script src="/js/initialize.js"></script>
        </div>
    )
}

export default HostSetup;
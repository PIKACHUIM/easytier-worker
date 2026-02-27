// 用户Token管理页面组件 - 现代设计
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';

function UserToken() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统 - 用户管理"/>

            <main className="main-content">
                <div className="container">
                    {/* 页面标题 */}
                    <div className="fade-in-up" style="margin-bottom: 32px;">
                        <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 4px;">
                            用户管理
                        </h1>
                        <p style="color: var(--text-secondary); font-size: 14px;">管理您的账户信息和通知设置</p>
                    </div>

                    <div style="max-width: 2400px; margin: 0 auto;">
                        {/* Token管理区域 */}
                        <div className="settings-section fade-in-up" style="animation-delay: 0.05s;">
                            <h2>Token管理</h2>

                            <div className="form-group">
                                <label>当前Token</label>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <input
                                        type="text"
                                        id="current-token"
                                        readonly
                                        placeholder="Token将自动显示在此处"
                                        style="font-family: var(--font-mono); font-size: 13px; flex: 1;"
                                    />
                                </div>
                            </div>

                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                <button
                                    onclick="copyTokenToClipboard()"
                                    className="btn-primary"
                                    style="flex: 1; min-width: 140px;"
                                >
                                    📋 复制Token
                                </button>
                                <button
                                    onclick="resetToken()"
                                    className="btn-secondary"
                                    style="flex: 1; min-width: 140px;"
                                >
                                    🔄 重置Token
                                </button>
                            </div>

                            <div className="info-box warning" style="margin-top: 16px;">
                                ⚠️ 重置Token后，旧Token将失效，您需要使用新Token连接API
                            </div>
                        </div>

                        {/* 个人信息区域 */}
                        <div className="settings-section fade-in-up" style="animation-delay: 0.1s;">
                            <h2>个人信息</h2>

                            <form id="profile-form" onsubmit="return false;">
                                <div className="form-group">
                                    <label for="qq-number">QQ号</label>
                                    <input
                                        type="text"
                                        id="qq-number"
                                        placeholder="请输入QQ号（用于接收通知）"
                                    />
                                    <small>暂不支持QQ通知，此字段仅用于记录</small>
                                </div>

                                <div className="form-group">
                                    <label for="wechat-uid">微信UID（WxPusher）</label>
                                    <input
                                        type="text"
                                        id="wechat-uid"
                                        placeholder="请输入WxPusher的UID"
                                    />
                                    <small>
                                        获取方式：关注WxPusher公众号后，发送"我的UID"获取
                                        <a href="https://wxpusher.zjiecode.com" target="_blank" style="margin-left: 6px;">了解更多</a>
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label for="telegram-id">Telegram ID</label>
                                    <input
                                        type="text"
                                        id="telegram-id"
                                        placeholder="请输入Telegram Chat ID"
                                    />
                                    <small>获取方式：向 @userinfobot 发送任意消息，获取您的Chat ID</small>
                                </div>

                                <button
                                    type="submit"
                                    onclick="updateProfile()"
                                    className="btn-primary"
                                >
                                    保存个人信息
                                </button>
                            </form>
                        </div>

                        {/* 修改密码区域 */}
                        <div className="settings-section fade-in-up" style="animation-delay: 0.15s;">
                            <h2>修改密码</h2>

                            <form id="change-password-form" onsubmit="return false;">
                                <div className="form-group">
                                    <label for="new-password">
                                        新密码 <span style="color: var(--danger);">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="new-password"
                                        required
                                        minlength={6}
                                        placeholder="请输入新密码（至少6位）"
                                    />
                                </div>

                                <div className="form-group">
                                    <label for="confirm-password">
                                        确认密码 <span style="color: var(--danger);">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm-password"
                                        required
                                        minlength={6}
                                        placeholder="请再次输入新密码"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    onclick="changePassword()"
                                    className="btn-primary"
                                >
                                    修改密码
                                </button>
                            </form>
                        </div>

                        {/* 返回按钮 */}
                        <div className="fade-in-up" style="margin-top: 8px; animation-delay: 0.2s;">
                            <a href="/dashboard" className="btn-secondary">
                                ← 返回我的节点
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <WebFooter title="用户管理页面"/>
            <script src="/js/usertoken.js"></script>
        </div>
    );
}

export default UserToken;

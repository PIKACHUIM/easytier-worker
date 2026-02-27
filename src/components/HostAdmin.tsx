// 系统设置页面组件 - 现代设计
import React from 'react';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';

function HostAdmin() {
    return (
        <div className="page-wrapper">
            <WebHeader title="EasyTier 节点管理系统 - 系统设置"/>

            <main className="main-content">
                <div className="container">
                    {/* 页面标题 */}
                    <div className="fade-in-up" style="margin-bottom: 32px;">
                        <h1 style="font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 4px;">
                            系统设置
                        </h1>
                        <p style="color: var(--text-secondary); font-size: 14px;">配置系统邮件、通知和网站信息</p>
                    </div>

                    <div id="message"></div>

                    <div style="max-width: 2400px;  margin: 0 auto;">
                        {/* 邮件服务配置 */}
                        <div className="settings-section fade-in-up" style="animation-delay: 0.05s;">
                            <h2>邮件服务配置 (Resend)</h2>
                            <form id="settings-form">
                                <div className="form-group">
                                    <label htmlFor="resend-api-key">Resend 密钥</label>
                                    <input type="password" id="resend-api-key" name="resend-api-key"
                                           placeholder="re_xxxxxxxxxxxx"/>
                                    <small>用于发送验证邮件，可在 <a href="https://resend.com/api-keys" target="_blank">Resend 控制台</a> 获取</small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="resend-from-email">发件邮箱</label>
                                    <input type="email" id="resend-from-email" name="resend-from-email"
                                           placeholder="noreply@yourdomain.com"/>
                                    <small>例如: noreply@yourdomain.com</small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="resend-from-domain">发件域名</label>
                                    <input type="text" id="resend-from-domain" name="resend-from-domain"
                                           placeholder="yourdomain.com"/>
                                    <small>需要在 Resend 中验证的域名，例如: yourdomain.com</small>
                                </div>

                                {/* 邮件测试 */}
                                <div className="form-group">
                                    <label htmlFor="test-email">邮件测试</label>
                                    <input type="email" id="test-email" placeholder="输入测试邮箱地址"/>
                                    <small>输入邮箱地址，点击按钮测试邮件发送功能是否正常</small>
                                    <div id="test-email-result" className="test-result"></div>
                                </div>
                                <button type="button" id="send-test-email" className="btn-secondary"
                                        style="margin-bottom: 32px;">
                                    📧 发送测试邮件
                                </button>

                                {/* 网站配置 */}
                                <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--bg-glass-border); display: flex; align-items: center; gap: 8px;">
                                    <span style="display: inline-block; width: 4px; height: 18px; background: linear-gradient(180deg, var(--primary), var(--primary-light)); border-radius: 9999px;"></span>
                                    网站配置
                                </h2>
                                <div className="form-group">
                                    <label htmlFor="site-name">网站名称</label>
                                    <input type="text" id="site-name" name="site-name"
                                           placeholder="EasyTier 节点管理系统"/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="site-url">网站 URL</label>
                                    <input type="url" id="site-url" name="site-url"
                                           placeholder="https://yourdomain.com"/>
                                    <small>用于生成邮件中的链接，例如: https://yourdomain.com，后面不包含"/"或"?"</small>
                                </div>

                                {/* 通知服务配置 */}
                                <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 32px 0 20px; padding-bottom: 16px; border-bottom: 1px solid var(--bg-glass-border); display: flex; align-items: center; gap: 8px;">
                                    <span style="display: inline-block; width: 4px; height: 18px; background: linear-gradient(180deg, var(--primary), var(--primary-light)); border-radius: 9999px;"></span>
                                    通知服务配置
                                </h2>

                                <h3>Telegram Bot 配置</h3>
                                <div className="form-group">
                                    <label htmlFor="telegram-bot-token">Telegram Bot Token</label>
                                    <input type="password" id="telegram-bot-token" name="telegram-bot-token"
                                           placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"/>
                                    <small>通过 <a href="https://t.me/BotFather" target="_blank">@BotFather</a> 创建Bot并获取Token</small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="telegram-bot-id">Telegram Bot ID</label>
                                    <input type="text" id="telegram-bot-id" name="telegram-bot-id"
                                           placeholder="@YourBot"/>
                                    <small>Bot的用户名，例如: @YourBot</small>
                                </div>

                                <h3>WxPusher 配置</h3>
                                <div className="form-group">
                                    <label htmlFor="wxpusher-app-token">WxPusher 应用 Token</label>
                                    <input type="password" id="wxpusher-app-token" name="wxpusher-app-token"
                                           placeholder="AT_xxxxxxxxxxxx"/>
                                    <small>在 <a href="https://wxpusher.zjiecode.com" target="_blank">WxPusher 管理后台</a> 创建应用并获取Token</small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="wxpusher-app-id">WxPusher 应用 ID</label>
                                    <input type="text" id="wxpusher-app-id" name="wxpusher-app-id"
                                           placeholder="应用唯一标识ID"/>
                                    <small>应用的唯一标识ID</small>
                                </div>

                                <button type="submit" style="width: 100%;">保存设置</button>
                            </form>
                        </div>

                        {/* 用户管理 */}
                        <div className="settings-section fade-in-up" style="animation-delay: 0.1s;">
                            <h2>用户管理</h2>
                            <div id="users-container">
                                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                                    <div style="width: 32px; height: 32px; border: 3px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;"></div>
                                    <span>加载中...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <WebFooter title="系统设置页面"/>
            <script src="/js/common.js"></script>
            <script src="/js/settings.js"></script>
        </div>
    )
}

export default HostAdmin;
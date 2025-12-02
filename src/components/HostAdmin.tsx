import React from 'react';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';

function HostAdmin(): JSX.Element {
    return (
        <div className="container">
            <WebHeader title="EasyTier 节点管理系统 - 系统设置"/>

            <main className="main">
                <div id="message"></div>

                <section className="settings-section">
                    <h2>邮件服务配置 (Resend)</h2>
                    <form id="settings-form">
                        <div className="form-group">
                            <label htmlFor="resend-api-key">Resend 密钥</label>
                            <input type="password" id="resend-api-key" name="resend-api-key"/>
                            <small>用于发送验证邮件，可在 <a href="https://resend.com/api-keys" target="_blank">Resend
                                控制台</a> 获取</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="resend-from-email">发件邮箱</label>
                            <input type="email" id="resend-from-email" name="resend-from-email"/>
                            <small>例如: noreply@yourdomain.com</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="resend-from-domain">发件域名</label>
                            <input type="text" id="resend-from-domain" name="resend-from-domain"/>
                            <small>需要在 Resend 中验证的域名，例如: yourdomain.com</small>
                        </div>

                        {/* 邮件发送测试按钮 */}
                        <div className="form-group">
                            <label htmlFor="test-email">邮件测试</label>
                            <input type="email" id="test-email" placeholder="输入测试邮箱地址"/>
                            <small>输入邮箱地址，点击按钮测试邮件发送功能是否正常</small>
                            <div id="test-email-result" className="test-result"></div>
                        </div>
                        <button type="button" id="send-test-email" className="btn-primary">发送测试邮件</button>
                        <br/><br/><br/>
                        <h2>网站配置</h2>
                        <div className="form-group">
                            <label htmlFor="site-name">网站名称</label>
                            <input type="text" id="site-name" name="site-name"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="site-url">网站 URL</label>
                            <input type="url" id="site-url" name="site-url"/>
                            <small>用于生成邮件中的链接，例如: https://yourdomain.com，后面不包含"/"或"?"</small>
                        </div>
                        
                        <br/><br/><br/>
                        <h2>通知服务配置</h2>
                        
                        <h3 style="margin-top: 20px; color: #667eea;">Telegram Bot 配置</h3>
                        <div className="form-group">
                            <label htmlFor="telegram-bot-token">Telegram Bot Token</label>
                            <input type="password" id="telegram-bot-token" name="telegram-bot-token"/>
                            <small>通过 <a href="https://t.me/BotFather" target="_blank">@BotFather</a> 创建Bot并获取Token</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="telegram-bot-id">Telegram Bot ID</label>
                            <input type="text" id="telegram-bot-id" name="telegram-bot-id"/>
                            <small>Bot的用户名，例如: @YourBot</small>
                        </div>
                        
                        <h3 style="margin-top: 20px; color: #667eea;">WxPusher 配置</h3>
                        <div className="form-group">
                            <label htmlFor="wxpusher-app-token">WxPusher 应用 Token</label>
                            <input type="password" id="wxpusher-app-token" name="wxpusher-app-token"/>
                            <small>在 <a href="https://wxpusher.zjiecode.com" target="_blank">WxPusher 管理后台</a> 创建应用并获取Token</small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="wxpusher-app-id">WxPusher 应用 ID</label>
                            <input type="text" id="wxpusher-app-id" name="wxpusher-app-id"/>
                            <small>应用的唯一标识ID</small>
                        </div>
                        
                        <button type="submit">保存设置</button>
                    </form>
                </section>
                <section className="settings-section">
                    <h2>用户管理</h2>
                    <div id="users-container">
                        <p>加载中...</p>
                    </div>
                </section>
            </main>

            <WebFooter title="系统设置页面"/>

            {/* 添加公共工具库 */}
            <script src="/js/common.js"></script>
            {/* 添加系统设置页面的 JavaScript */}
            <script src="/js/settings.js"></script>
        </div>
    )
}

export default HostAdmin;
import React from 'react';
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';

const HostAdmin: React.FC = () => {
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
    );
};

export default HostAdmin;
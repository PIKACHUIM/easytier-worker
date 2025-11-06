import React from 'react';
import Header from './Header';

const SettingsPage: React.FC = () => {
  return (
    <div class="container">
      <Header title="EasyTier 节点管理系统 - 系统设置" />
      
      <main class="main">
        <div id="message"></div>
        
        <section class="settings-section">
          <h2>邮件服务配置 (Resend)</h2>
          <form id="settings-form">
            <div class="form-group">
              <label for="resend-api-key">Resend API 密钥</label>
              <input type="password" id="resend-api-key" name="resend-api-key" />
              <small>用于发送验证邮件，可在 <a href="https://resend.com/api-keys" target="_blank">Resend 控制台</a> 获取</small>
            </div>
            <div class="form-group">
              <label for="resend-from-email">发件人邮箱</label>
              <input type="email" id="resend-from-email" name="resend-from-email" />
              <small>例如: noreply@yourdomain.com</small>
            </div>
            <div class="form-group">
              <label for="resend-from-domain">发件域名</label>
              <input type="text" id="resend-from-domain" name="resend-from-domain" />
              <small>需要在 Resend 中验证的域名，例如: yourdomain.com</small>
            </div>
            
            <h2>网站配置</h2>
            <div class="form-group">
              <label for="site-name">网站名称</label>
              <input type="text" id="site-name" name="site-name" />
            </div>
            <div class="form-group">
              <label for="site-url">网站 URL</label>
              <input type="url" id="site-url" name="site-url" />
              <small>用于生成邮件中的链接，例如: https://yourdomain.com</small>
            </div>
            
            <button type="submit">保存设置</button>
          </form>
        </section>
        
        <section class="settings-section">
          <h2>用户管理</h2>
          <div id="users-container">
            <p>加载中...</p>
          </div>
        </section>
      </main>
      
      {/* 外部JavaScript引用 */}
      <script src="/js/settings.js"></script>
    </div>
  );
};

export default SettingsPage;
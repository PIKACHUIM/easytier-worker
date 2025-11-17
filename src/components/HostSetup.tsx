import WebHeader from './WebHeader';
import WebFooter from './WebFooter';

function HostSetup() {
    return (
        <div class="container">
            <WebHeader title="EasyTier 节点管理系统 - 系统初始化"/>
            <div class="auth-form">
                <h1>系统初始化</h1>
                <p class="info">首次使用需要初始化系统并创建超级管理员账户</p>

                <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
                    <h3 style={{marginTop: 0}}>初始化说明：</h3>
                    <p style={{margin: '10px 0', lineHeight: '1.6'}}>
                        点击"初始化系统"按钮后，系统将自动完成以下操作：
                    </p>
                    <ol style={{margin: '10px 0', paddingLeft: '20px', lineHeight: '1.8'}}>
                        <li>导入数据库表结构（users、nodes、system_settings）</li>
                        <li>创建超级管理员账户</li>
                        <li>完成系统初始化配置</li>
                    </ol>
                </div>

                <form id="init-form">
                    <div class="form-group">
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

                    <div class="form-group">
                        <label for="email">管理员邮箱</label>
                        <input type="email" id="email" name="email" required/>
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" required minLength={6}/>
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">确认密码</label>
                        <input type="password" id="confirm-password" name="confirm-password" required/>
                    </div>
                    <button type="submit" id="init-submit-btn">初始化系统</button>
                </form>
                <div id="message"></div>
            </div>
            <WebFooter title="系统初始化页面"/>
            <script src="/js/initialize.js"></script>
        </div>
    )
}

export default HostSetup;
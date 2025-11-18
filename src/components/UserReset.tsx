import WebHeader from "./WebHeader";
import WebFooter from './WebFooter';

function UserReset() {
    return (
        <div class="container">
            <WebHeader title="EasyTier 节点管理系统 - 密码重置"/>
            <div class="auth-form">
                <h1>密码重置</h1>
                <div id="reset-message" style="display: none;"></div>
                
                {/* 请求密码重置表单 */}
                <div id="request-reset-form-container">
                    <p>请输入您的邮箱地址，我们将发送密码重置链接到您的邮箱。</p>
                    <form id="request-reset-form">
                        <div class="form-group">
                            <label for="email">邮箱</label>
                            <input type="email" id="email" name="email" required/>
                        </div>
                        <button type="submit">发送重置链接</button>
                    </form>
                    <p><a href="/login">返回登录</a></p>
                </div>
                
                {/* 重置密码表单（通过token） */}
                <div id="reset-password-form-container" style="display: none;">
                    <p>请输入您的新密码。</p>
                    <form id="reset-password-form">
                        <input type="hidden" id="reset-token" name="reset-token"/>
                        <div class="form-group">
                            <label for="new-password">新密码</label>
                            <input type="password" id="new-password" name="new-password" required minLength={6}/>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">确认新密码</label>
                            <input type="password" id="confirm-password" name="confirm-password" required/>
                        </div>
                        <button type="submit">重置密码</button>
                    </form>
                    <p><a href="/login">返回登录</a></p>
                </div>
            </div>
            <WebFooter title="密码重置页面"/>
            <script src="/js/reset-password.js"></script>
        </div>
    )
}

export default UserReset;
import WebHeader from "./WebHeader";
import WebFooter from './WebFooter';

function UserSetup() {
    return (
        <div class="container">
            <WebHeader title="EasyTier 节点管理系统 - 用户注册"/>
            <div class="auth-form">
                <h1>注册</h1>
                <div id="register-message" style="display: none;"></div>
                <form id="register-form">
                    <div class="form-group">
                        <label for="email">邮箱</label>
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
                    <button type="submit">注册</button>
                </form>
                <p>已有账户？<a href="/login">立即登录</a></p>
            </div>
            <WebFooter title="用户注册页面"/>
            <script src="/js/register.js"></script>
        </div>
    )
}


export default UserSetup;
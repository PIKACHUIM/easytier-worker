import WebHeader from "./WebHeader";
import WebFooter from './WebFooter';

function UserLogin() {
    return (
<div className="container">
            <WebHeader title="EasyTier 节点管理系统 - 用户登录"/>
<div className="auth-form">
                <h1>登录</h1>
                <div id="login-message" style="display: none;"></div>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">邮箱</label>
                        <input type="email" id="email" name="email" required/>
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" required/>
                    </div>
                    <button type="submit">登录</button>
                </form>
                <p>还没有账户？<a href="/register">立即注册</a></p>
                <p><a href="/reset-password">忘记密码？</a></p>
            </div>
            <WebFooter title="用户登录页面"/>
            <script src="/js/login.js"></script>
        </div>
    )
}


export default UserLogin;
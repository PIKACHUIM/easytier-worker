function RegisterPage() {
  return (
    <div class="container">
      <Header title="注册" />
      <div class="auth-form">
        <h1>注册</h1>
        <form id="register-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input type="password" id="password" name="password" required minLength={6} />
          </div>
          <div class="form-group">
            <label for="confirm-password">确认密码</label>
            <input type="password" id="confirm-password" name="confirm-password" required />
          </div>
          <button type="submit">注册</button>
        </form>
        <p>已有账户？<a href="/login">立即登录</a></p>
      </div>
      <script src="/js/register.js"></script>
    </div>
  )
}

function Header({ title }: { title: string }) {
  return (
    <header class="header">
      <div class="header-content">
        <h1>{title}</h1>
        <nav class="nav">
          <a href="/" class="nav-link">首页</a>
          <a href="/login" class="nav-link">登录</a>
          <a href="/register" class="nav-link active">注册</a>
        </nav>
      </div>
    </header>
  );
}

export default RegisterPage;
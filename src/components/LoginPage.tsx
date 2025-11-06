function LoginPage() {
  return (
    <div class="container">
      <Header title="登录" />
      <div class="auth-form">
        <h1>登录</h1>
        <form id="login-form">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input type="password" id="password" name="password" required />
          </div>
          <button type="submit">登录</button>
        </form>
        <p>还没有账户？<a href="/register">立即注册</a></p>
      </div>
      <script src="/js/login.js"></script>
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
          <a href="/login" class="nav-link active">登录</a>
          <a href="/register" class="nav-link">注册</a>
        </nav>
      </div>
    </header>
  );
}

export default LoginPage;
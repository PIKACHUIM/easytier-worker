// 初始化页面脚本

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('init-form') as HTMLFormElement;
  const messageDiv = document.getElementById('message') as HTMLDivElement;
  const initBtn = document.getElementById('init-submit-btn') as HTMLButtonElement;
  
  // 检查系统是否已初始化
  try {
    const response = await fetch('/api/system/check-init');
    const data = await response.json();
    
    if (data.initialized) {
      messageDiv.innerHTML = '<p class="success">系统已经初始化，正在跳转到登录页面...</p>';
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
  } catch (error) {
    console.error('检查初始化状态失败:', error);
  }
  
  // 表单提交事件（一步完成数据库导入和管理员创建）
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const jwtSecret = (document.getElementById('jwt-secret') as HTMLInputElement).value;
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
    
    // 验证输入
    if (!jwtSecret) {
      messageDiv.innerHTML = '<p class="error">请输入 JWT 密钥</p>';
      return;
    }
    
    if (!email || !password) {
      messageDiv.innerHTML = '<p class="error">请填写所有必填字段</p>';
      return;
    }
    
    // 验证密码
    if (password !== confirmPassword) {
      messageDiv.innerHTML = '<p class="error">两次输入的密码不一致</p>';
      return;
    }
    
    if (password.length < 6) {
      messageDiv.innerHTML = '<p class="error">密码长度至少为 6 位</p>';
      return;
    }
    
    // 禁用按钮防止重复提交
    initBtn.disabled = true;
    initBtn.textContent = '初始化中...';
    messageDiv.innerHTML = '<p class="info">正在导入数据库并创建管理员账户...</p>';
    
    try {
      const response = await fetch('/api/system/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jwt_secret: jwtSecret,
          email,
          password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        messageDiv.innerHTML = `<p class="success">${data.message}，正在跳转到登录页面...</p>`;
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        messageDiv.innerHTML = `<p class="error">${data.error || '初始化失败'}</p>`;
        initBtn.disabled = false;
        initBtn.textContent = '初始化系统';
      }
    } catch (error) {
      console.error('初始化失败:', error);
      messageDiv.innerHTML = '<p class="error">初始化失败，请检查网络连接</p>';
      initBtn.disabled = false;
      initBtn.textContent = '初始化系统';
    }
  });
});
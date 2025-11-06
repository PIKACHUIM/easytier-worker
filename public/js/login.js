// 登录页面JavaScript代码

// 检查系统是否已初始化
async function checkSystemInit() {
  try {
    const response = await fetch('/api/system/check-init');
    const data = await response.json();
    if (!data.initialized) {
      window.location.href = '/initialize';
      return false;
    }
    return true;
  } catch (error) {
    console.error('检查初始化状态失败:', error);
    return true;
  }
}

// 检查用户状态
async function checkUserStatus() {
  const token = localStorage.getItem('token');
  if (token) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.is_admin || user.is_super_admin) {
          const adminLink = document.getElementById('admin-link');
          const settingsLink = document.getElementById('settings-link');
          if (adminLink) adminLink.style.display = 'inline';
          if (settingsLink) settingsLink.style.display = 'inline';
        }
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
  }
}

// 登录表单提交处理
document.addEventListener('DOMContentLoaded', async () => {
  document.title = 'EasyTier 节点管理系统 - 登录';
  const initialized = await checkSystemInit();
  if (initialized) {
    checkUserStatus();
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '登录中...';
      
      const formData = new FormData(loginForm);
      const data = {
        email: formData.get('username'),
        password: formData.get('password')
      };
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // 保存token和用户信息
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.user));
          
          // 显示成功消息
          const messageEl = document.getElementById('login-message');
          if (messageEl) {
            messageEl.textContent = '登录成功，正在跳转...';
            messageEl.className = 'message success';
            messageEl.style.display = 'block';
          }
          
          // 跳转到仪表板
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          const messageEl = document.getElementById('login-message');
          if (messageEl) {
            messageEl.textContent = result.message || '登录失败';
            messageEl.className = 'message error';
            messageEl.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('登录请求失败:', error);
        const messageEl = document.getElementById('login-message');
        if (messageEl) {
          messageEl.textContent = '网络错误，请稍后重试';
          messageEl.className = 'message error';
          messageEl.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // 回车键提交表单
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const loginForm = document.getElementById('login-form');
      if (loginForm && loginForm.contains(document.activeElement)) {
        loginForm.dispatchEvent(new Event('submit'));
      }
    }
  });
});
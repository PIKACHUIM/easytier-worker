// 登录页面脚本

const loginForm = document.getElementById('login-form') as HTMLFormElement;
const loginMessage = document.getElementById('login-message') as HTMLDivElement;

// 显示消息的函数
function showMessage(message: string, isError: boolean = true) {
  if (loginMessage) {
    loginMessage.textContent = message;
    loginMessage.style.display = 'block';
    loginMessage.className = isError ? 'error' : 'success';
    
    // 5秒后自动隐藏消息
    setTimeout(() => {
      loginMessage.style.display = 'none';
    }, 5000);
  } else {
    // 如果没有找到消息元素，则使用alert作为备用
    alert(message);
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  
  // 清除之前的消息
  if (loginMessage) {
    loginMessage.style.display = 'none';
  }
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 保存 token 和用户信息
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 显示成功消息
      showMessage('登录成功，正在跳转...', false);
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        // 跳转到仪表板或管理员页面
        if (data.user.is_admin || data.user.is_super_admin) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }, 1000);
    } else {
      if (data.error === '请先验证您的邮箱') {
        // 显示消息并延迟跳转
        showMessage('请先验证您的邮箱，即将跳转到验证页面...', true);
        setTimeout(() => {
          window.location.href = '/verify-required';
        }, 2000);
      } else {
        showMessage(data.error || '登录失败，请检查您的邮箱和密码');
      }
    }
  } catch (error) {
    console.error('登录错误:', error);
    showMessage('网络错误，请检查网络连接后重试');
  }
});

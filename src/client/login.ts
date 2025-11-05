// 登录页面脚本

const loginForm = document.getElementById('login-form') as HTMLFormElement;

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  
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
      
      // 跳转到仪表板或管理员页面
      if (data.user.is_admin || data.user.is_super_admin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      alert(data.error || '登录失败');
    }
  } catch (error) {
    console.error('登录错误:', error);
    alert('登录失败，请稍后重试');
  }
});

// 注册页面脚本

// 检查系统是否已初始化
async function checkSystemInit() {
  try {
    const response = await fetch('/api/system/check-init');
    const data = await response.json();
    
    if (!data.initialized) {
      // 系统未初始化，跳转到初始化页面
      window.location.href = '/initialize';
      return false;
    }
    return true;
  } catch (error) {
    console.error('检查初始化状态失败:', error);
    return true; // 出错时假定已初始化，避免阻塞
  }
}

// 页面加载时检查初始化状态
checkSystemInit();

const registerForm = document.getElementById('register-form') as HTMLFormElement;

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
  
  // 验证密码
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  if (password.length < 6) {
    alert('密码长度至少为 6 位');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('注册成功！请查收验证邮件。');
      // 跳转到登录页面
      window.location.href = '/login';
    } else {
      alert(data.error || '注册失败');
    }
  } catch (error) {
    console.error('注册错误:', error);
    alert('注册失败，请稍后重试');
  }
});

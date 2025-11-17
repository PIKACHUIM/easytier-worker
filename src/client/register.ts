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
const registerMessage = document.getElementById('register-message') as HTMLDivElement;

// 显示消息的函数
function showMessage(message: string, isError: boolean = true) {
  if (registerMessage) {
    registerMessage.textContent = message;
    registerMessage.style.display = 'block';
    registerMessage.className = isError ? 'error' : 'success';
    
    // 8秒后自动隐藏消息（成功消息可以显示久一点）
    setTimeout(() => {
      registerMessage.style.display = 'none';
    }, isError ? 5000 : 8000);
  } else {
    // 如果没有找到消息元素，则使用alert作为备用
    alert(message);
  }
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
  
  // 清除之前的消息
  if (registerMessage) {
    registerMessage.style.display = 'none';
  }
  
  // 验证密码
  if (password !== confirmPassword) {
    showMessage('两次输入的密码不一致');
    return;
  }
  
  if (password.length < 6) {
    showMessage('密码长度至少为 6 位');
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
      let successMessage = '注册成功！';
      
      if (data.verification_enabled) {
        successMessage += '请查收验证邮件。如果没有收到，可以重新注册或联系管理员。';
      } else {
        successMessage += '账户已自动激活。';
      }
      
      showMessage(successMessage, false);
      
      // 延迟跳转到登录页面，让用户看到成功消息
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } else {
      showMessage(data.error || '注册失败，请稍后重试');
    }
  } catch (error) {
    console.error('注册错误:', error);
    showMessage('网络错误，请检查网络连接后重试');
  }
});

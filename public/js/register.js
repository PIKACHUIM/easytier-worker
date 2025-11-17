// 注册页面JavaScript代码

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

// 注册表单提交处理
document.addEventListener('DOMContentLoaded', async () => {
  document.title = 'EasyTier 节点管理系统 - 注册';
  const initialized = await checkSystemInit();
  if (initialized) {
    checkUserStatus();
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '注册中...';
      
      const formData = new FormData(registerForm);
const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirm-password')
      };
      
      // 客户端验证
      if (data.password !== data.confirmPassword) {
        const messageEl = document.getElementById('register-message');
        if (messageEl) {
          messageEl.textContent = '两次输入的密码不一致';
          messageEl.className = 'message error';
          messageEl.style.display = 'block';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      
      if (data.password.length < 6) {
        const messageEl = document.getElementById('register-message');
        if (messageEl) {
          messageEl.textContent = '密码长度至少6位';
          messageEl.className = 'message error';
          messageEl.style.display = 'block';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
if (response.ok) {
          // 显示成功消息
          const messageEl = document.getElementById('register-message');
          if (messageEl) {
            let successText = result.message || '注册成功';
            
            // 如果是重新注册的情况，添加特殊说明
            if (result.note) {
              successText += '\nℹ️ ' + result.note;
            }
            
            // 如果启用了邮件验证，添加提示
            if (result.verification_enabled) {
              successText += '\n\n📧 请查收邮箱中的验证邮件（包括垃圾邮件文件夹）。';
            }
            
            messageEl.textContent = successText;
            messageEl.className = 'message success';
            messageEl.style.display = 'block';
          }
          
          // 根据是否启用邮件验证决定跳转时间
          const redirectDelay = result.verification_enabled ? 5000 : 2000;
          
          // 跳转到登录页面
          setTimeout(() => {
            window.location.href = '/login';
          }, redirectDelay);
} else {
          const messageEl = document.getElementById('register-message');
          if (messageEl) {
            let messageText = result.error || '注册失败';
            
            // 如果有警告信息，添加到消息中
            if (result.warning) {
              messageText += '\n⚠️ ' + result.warning;
            }
            
            // 如果有备注信息，添加到消息中
            if (result.note) {
              messageText += '\nℹ️ ' + result.note;
            }
            
            messageEl.textContent = messageText;
            messageEl.className = 'message error';
            messageEl.style.display = 'block';
          }
        }
      } catch (error) {
        console.error('注册请求失败:', error);
        const messageEl = document.getElementById('register-message');
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
      const registerForm = document.getElementById('register-form');
      if (registerForm && registerForm.contains(document.activeElement)) {
        registerForm.dispatchEvent(new Event('submit'));
      }
    }
  });
});
// 用户Token和个人信息管理页面脚本

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    alert('请先登录');
    window.location.href = '/login';
    return;
  }
  
  const currentTokenInput = document.getElementById('current-token') as HTMLInputElement;
  const profileForm = document.getElementById('profile-form') as HTMLFormElement;
  const passwordForm = document.getElementById('change-password-form') as HTMLFormElement;
  
  // 显示当前Token
  if (currentTokenInput) {
    currentTokenInput.value = token;
  }
  
  // 加载用户个人信息
  async function loadProfile() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error('加载个人信息失败');
      }
      
      const userData = await response.json();
      
      // 填充表单
      (document.getElementById('qq-number') as HTMLInputElement).value = userData.qq_number || '';
      (document.getElementById('wechat-uid') as HTMLInputElement).value = userData.wechat_uid || '';
      (document.getElementById('telegram-id') as HTMLInputElement).value = userData.telegram_id || '';
    } catch (error) {
      console.error('加载个人信息失败:', error);
      alert('加载个人信息失败');
    }
  }
  
  // 初始加载
  await loadProfile();
});

// 复制Token到剪贴板
(window as any).copyTokenToClipboard = async () => {
  const tokenInput = document.getElementById('current-token') as HTMLInputElement;
  const token = tokenInput.value;
  
  try {
    await navigator.clipboard.writeText(token);
    alert('Token已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    // 降级方案
    tokenInput.select();
    try {
      document.execCommand('copy');
      alert('Token已复制到剪贴板');
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  }
};

// 重置Token
(window as any).resetToken = async () => {
  if (!confirm('确定要重置Token吗？旧Token将失效！')) {
    return;
  }
  
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/auth/reset-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 更新本地存储的token和用户信息
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 更新页面显示
      (document.getElementById('current-token') as HTMLInputElement).value = data.token;
      
      alert('Token重置成功！');
    } else {
      alert(data.error || 'Token重置失败');
    }
  } catch (error) {
    console.error('重置Token失败:', error);
    alert('重置Token失败，请稍后重试');
  }
};

// 更新个人信息
(window as any).updateProfile = async () => {
  const token = localStorage.getItem('token');
  
  const profileData = {
    qq_number: (document.getElementById('qq-number') as HTMLInputElement).value.trim(),
    wechat_uid: (document.getElementById('wechat-uid') as HTMLInputElement).value.trim(),
    telegram_id: (document.getElementById('telegram-id') as HTMLInputElement).value.trim()
  };
  
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('个人信息更新成功！');
    } else {
      alert(data.error || '更新失败');
    }
  } catch (error) {
    console.error('更新个人信息失败:', error);
    alert('更新失败，请稍后重试');
  }
};

// 修改密码
(window as any).changePassword = async () => {
  const token = localStorage.getItem('token');
  
  const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;
  const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
  
  if (!newPassword || !confirmPassword) {
    alert('请填写完整的密码信息');
    return;
  }
  
  if (newPassword.length < 6) {
    alert('密码长度至少为6位');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ new_password: newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('密码修改成功！');
      // 清空密码输入框
      (document.getElementById('new-password') as HTMLInputElement).value = '';
      (document.getElementById('confirm-password') as HTMLInputElement).value = '';
    } else {
      alert(data.error || '修改密码失败');
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    alert('修改密码失败，请稍后重试');
  }
};

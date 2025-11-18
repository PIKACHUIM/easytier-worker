// 用户Token管理页面JavaScript代码

const token = localStorage.getItem('token');
if (!token) window.location.href = '/login';
document.title = 'EasyTier 节点管理系统 - 用户管理';

// 显示Token
function displayToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('未找到token，请重新登录');
    window.location.href = '/login';
    return;
  }
  
  const tokenInput = document.getElementById('current-token');
  if (tokenInput) {
    tokenInput.value = token;
  }
}

// 复制Token到剪贴板
window.copyTokenToClipboard = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('未找到Token');
    return;
  }
  
  navigator.clipboard.writeText(token).then(() => {
    alert('Token已复制到剪贴板');
  }).catch(() => {
    // 备用方案
    const tokenInput = document.getElementById('current-token');
    if (tokenInput) {
      tokenInput.select();
      document.execCommand('copy');
      alert('Token已复制到剪贴板');
    }
  });
};

// 重置Token
window.resetToken = async () => {
  if (!confirm('确定要重置Token吗？重置后将生成新的登录Token，旧Token将失效。')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/auth/reset-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 更新本地存储的token和用户信息
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 更新页面显示的token
      const tokenInput = document.getElementById('current-token');
      if (tokenInput) {
        tokenInput.value = data.token;
      }
      
      alert('Token重置成功！新Token已生效');
    } else {
      alert(data.error || 'Token重置失败');
    }
  } catch (error) {
    console.error('重置Token失败:', error);
    alert('网络错误，请稍后重试');
  }
};

// 修改密码
window.changePassword = async () => {
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // 验证输入
  if (!newPassword || newPassword.length < 6) {
    alert('新密码长度至少为6位');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_password: newPassword
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('密码修改成功！');
      // 清空表单
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
    } else {
      alert(data.error || '密码修改失败');
    }
  } catch (error) {
    console.error('修改密码失败:', error);
    alert('网络错误，请稍后重试');
  }
};

// 检查管理员权限并显示导航链接
function checkAdminAccess() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const tokenLink = document.getElementById('token-link');
      if (tokenLink) tokenLink.style.display = 'inline';
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

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
  // 检查登录状态
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  // 显示导航链接
  checkAdminAccess();
  
  // 退出登录功能
  document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  });
  
  // 自动显示token
  displayToken();
});

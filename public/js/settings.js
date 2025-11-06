// 设置页面JavaScript代码

// 检查用户登录状态和权限
function checkSettingsAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (!user.is_admin && !user.is_super_admin) {
        alert('无权限访问系统设置');
        window.location.href = '/dashboard';
        return false;
      }
      return user;
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }
  
  alert('用户信息异常，请重新登录');
  window.location.href = '/login';
  return false;
}

// 加载设置
async function loadSettings() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/system/settings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const settings = await response.json();
      
      // 填充邮件设置
      document.getElementById('resend-api-key').value = settings.resend_api_key || '';
      document.getElementById('resend-from-email').value = settings.resend_from_email || '';
      document.getElementById('resend-from-domain').value = settings.resend_from_domain || '';
      
      // 填充网站设置
      document.getElementById('site-name').value = settings.site_name || '';
      document.getElementById('site-url').value = settings.site_url || '';
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

// 加载用户列表
async function loadUsers() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/system/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const users = await response.json();
      const container = document.getElementById('users-container');
      
      if (users.length === 0) {
        container.innerHTML = '<p>暂无用户</p>';
        return;
      }
      
      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>注册时间</th>
              <th>最后登录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${escapeHtml(user.email)}</td>
                <td>${user.is_super_admin ? '超级管理员' : user.is_admin ? '管理员' : '普通用户'}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>${user.last_login ? formatDate(user.last_login) : '从未登录'}</td>
                <td>
                  ${!user.is_super_admin ? `
                    <button class="btn-small ${user.is_admin ? 'btn-warning' : 'btn-primary'}" onclick="toggleAdmin(${user.id}, ${user.is_admin})">
                      ${user.is_admin ? '取消管理员' : '设为管理员'}
                    </button>
                    <button class="btn-small btn-danger" onclick="deleteUser(${user.id})" style="margin-left: 5px;">删除</button>
                  ` : '<span style="color: #999;">不可操作</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
    document.getElementById('users-container').innerHTML = '<p>加载失败</p>';
  }
}

// 切换管理员权限
window.toggleAdmin = async (userId, isAdmin) => {
  const action = isAdmin ? '取消管理员权限' : '设为管理员';
  if (!confirm(`确定要${action}吗？`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/${userId}/toggle-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert(`${action}成功`);
      loadUsers();
    } else {
      const result = await response.json();
      alert(result.message || `${action}失败`);
    }
  } catch (error) {
    console.error(`${action}失败:`, error);
    alert('网络错误，请稍后重试');
  }
};

// 删除用户
window.deleteUser = async (userId) => {
  if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      alert('用户删除成功');
      loadUsers();
    } else {
      const result = await response.json();
      alert(result.message || '删除失败');
    }
  } catch (error) {
    console.error('删除用户失败:', error);
    alert('网络错误，请稍后重试');
  }
};

// 保存设置
window.saveSettings = async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '保存中...';
  
  const formData = new FormData(form);
  const data = {
    resend_api_key: formData.get('resend-api-key'),
    resend_from_email: formData.get('resend-from-email'),
    resend_from_domain: formData.get('resend-from-domain'),
    site_name: formData.get('site-name'),
    site_url: formData.get('site-url')
  };
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/system/settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert('设置保存成功');
    } else {
      const result = await response.json();
      alert(result.message || '保存失败');
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    alert('网络错误，请稍后重试');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
  document.title = 'EasyTier 节点管理系统 - 系统设置';
  
  const user = checkSettingsAuth();
  if (!user) return;
  
  const userInfoElement = document.getElementById('user-info-text');
  if (userInfoElement) {
    userInfoElement.textContent = `欢迎，${user.username}（管理员）`;
  }
  
  loadSettings();
  loadUsers();
  
  // 表单提交事件
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', window.saveSettings);
  }
});
// 系统设置页面脚本

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    alert('请先登录');
    window.location.href = '/login';
    return;
  }
  
  // 检查管理员权限
  try {
    const user = JSON.parse(userStr);
    if (!user.is_admin && !user.is_super_admin) {
      alert('需要管理员权限才能访问此页面');
      window.location.href = '/dashboard';
      return;
    }
  } catch (error) {
    console.error('解析用户信息失败:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  
  const settingsForm = document.getElementById('settings-form') as HTMLFormElement;
  const usersContainer = document.getElementById('users-container') as HTMLDivElement;
  const messageDiv = document.getElementById('message') as HTMLDivElement;
  const logoutBtn = document.getElementById('logout');
  
  // 退出登录
  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/login';
  });
  
  // 加载系统设置
  async function loadSettings() {
    try {
      const response = await fetch('/api/system/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error('加载设置失败');
      }
      
      const settings = await response.json();
      
      // 填充表单
      (document.getElementById('resend-api-key') as HTMLInputElement).value = settings.resend_api_key || '';
      (document.getElementById('resend-from-email') as HTMLInputElement).value = settings.resend_from_email || '';
      (document.getElementById('resend-from-domain') as HTMLInputElement).value = settings.resend_from_domain || '';
      (document.getElementById('site-name') as HTMLInputElement).value = settings.site_name || '';
      (document.getElementById('site-url') as HTMLInputElement).value = settings.site_url || '';
    } catch (error) {
      console.error('加载设置失败:', error);
      messageDiv.innerHTML = '<p class="error">加载设置失败</p>';
    }
  }
  
  // 保存系统设置
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const settings = {
      resend_api_key: (document.getElementById('resend-api-key') as HTMLInputElement).value,
      resend_from_email: (document.getElementById('resend-from-email') as HTMLInputElement).value,
      resend_from_domain: (document.getElementById('resend-from-domain') as HTMLInputElement).value,
      site_name: (document.getElementById('site-name') as HTMLInputElement).value,
      site_url: (document.getElementById('site-url') as HTMLInputElement).value
    };
    
    try {
      const response = await fetch('/api/system/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        messageDiv.innerHTML = `<p class="success">${data.message}</p>`;
        setTimeout(() => {
          messageDiv.innerHTML = '';
        }, 3000);
      } else {
        messageDiv.innerHTML = `<p class="error">${data.error || '保存失败'}</p>`;
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      messageDiv.innerHTML = '<p class="error">保存设置失败</p>';
    }
  });
  
  // 加载用户列表
  async function loadUsers() {
    try {
      const response = await fetch('/api/system/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('加载用户列表失败');
      }
      
      const users = await response.json();
      
      if (users.length === 0) {
        usersContainer.innerHTML = '<p>暂无用户</p>';
        return;
      }
      
      // 渲染用户列表
      usersContainer.innerHTML = `
        <table class="users-table">
          <thead>
            <tr>
              <th>邮箱</th>
              <th>管理员</th>
              <th>超级管理员</th>
              <th>已验证</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((user: any) => `
              <tr>
                <td>${user.email}</td>
                <td>${user.is_admin ? '是' : '否'}</td>
                <td>${user.is_super_admin ? '是' : '否'}</td>
                <td>${user.is_verified ? '是' : '否'}</td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
                <td>
                  ${!user.is_super_admin ? `
                    <button class="btn-small" onclick="toggleAdmin('${user.email}', ${!user.is_admin})">
                      ${user.is_admin ? '撤销管理员' : '设为管理员'}
                    </button>
                    <button class="btn-small btn-danger" onclick="deleteUser('${user.email}')">删除</button>
                  ` : '<span>-</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (error) {
      console.error('加载用户列表失败:', error);
      usersContainer.innerHTML = '<p class="error">加载用户列表失败</p>';
    }
  }
  
  // 切换管理员权限
  (window as any).toggleAdmin = async (email: string, isAdmin: boolean) => {
    if (!confirm(`确定要${isAdmin ? '授予' : '撤销'}用户 ${email} 的管理员权限吗？`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/system/users/${email}/admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_admin: isAdmin })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        messageDiv.innerHTML = `<p class="success">${data.message}</p>`;
        setTimeout(() => {
          messageDiv.innerHTML = '';
        }, 3000);
        loadUsers();
      } else {
        messageDiv.innerHTML = `<p class="error">${data.error || '操作失败'}</p>`;
      }
    } catch (error) {
      console.error('设置权限失败:', error);
      messageDiv.innerHTML = '<p class="error">设置权限失败</p>';
    }
  };
  
  // 删除用户
  (window as any).deleteUser = async (email: string) => {
    if (!confirm(`确定要删除用户 ${email} 吗？此操作将同时删除该用户的所有节点，且不可恢复！`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/system/users/${email}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        messageDiv.innerHTML = `<p class="success">${data.message}</p>`;
        setTimeout(() => {
          messageDiv.innerHTML = '';
        }, 3000);
        loadUsers();
      } else {
        messageDiv.innerHTML = `<p class="error">${data.error || '删除失败'}</p>`;
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      messageDiv.innerHTML = '<p class="error">删除用户失败</p>';
    }
  };
  
  // 初始加载
  await loadSettings();
  await loadUsers();
});
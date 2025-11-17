// 设置页面JavaScript代码

// 检查用户登录状态和权限
function checkSettingsAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        alert('请先登录');
        window.location.href = '/login';
        return false;
    }

    try {
        const user = JSON.parse(userStr);
        if (!user.is_admin && !user.is_super_admin) {
            alert('需要管理员权限才能访问此页面');
            window.location.href = '/dashboard';
            return false;
        }
        return user;
    } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
    }
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
            ${users.map(user => `
              <tr>
                <td>${escapeHtml(user.email)}</td>
                <td>${user.is_admin ? '是' : '否'}</td>
                <td>${user.is_super_admin ? '是' : '否'}</td>
                <td>${user.is_verified ? '是' : '否'}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                  ${!user.is_super_admin ? `
                    <button class="btn-small" onclick="toggleAdmin('${escapeHtml(user.email)}', ${user.is_admin})">
                      ${user.is_admin ? '撤销管理员' : '设为管理员'}
                    </button>
                    <button class="btn-small btn-danger" onclick="deleteUser('${escapeHtml(user.email)}')">删除</button>
                  ` : '<span>-</span>'}
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
window.toggleAdmin = async (email, isAdmin) => {
    const action = isAdmin ? '撤销管理员权限' : '设为管理员';
    if (!confirm(`确定要${action}用户 ${email} 吗？`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/system/users/${encodeURIComponent(email)}/admin`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({is_admin: !isAdmin})
        });

        if (response.ok) {
            alert(`${action}成功`);
            loadUsers();
        } else {
            const result = await response.json();
            alert(result.error || `${action}失败`);
        }
    } catch (error) {
        console.error(`${action}失败:`, error);
        alert('网络错误，请稍后重试');
    }
};

// 删除用户
window.deleteUser = async (email) => {
    if (!confirm(`确定要删除用户 ${email} 吗？此操作将同时删除该用户的所有节点，且不可恢复！`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/system/users/${encodeURIComponent(email)}`, {
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
            alert(result.error || '删除失败');
        }
    } catch (error) {
        console.error('删除用户失败:', error);
        alert('网络错误，请稍后重试');
    }
};

// 发送测试邮件
window.sendTestEmail = async () => {
    const testEmailInput = document.getElementById('test-email');
    const sendButton = document.getElementById('send-test-email');
    const resultDiv = document.getElementById('test-email-result');
    const messageDiv = document.getElementById('message');

    const email = testEmailInput.value.trim();

    if (!email) {
        messageDiv.innerHTML = '<p class="error">请输入测试邮箱地址</p>';
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
        return;
    }

    if (!validateEmail(email)) {
        messageDiv.innerHTML = '<p class="error">请输入有效的邮箱地址</p>';
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
        return;
    }

    const originalText = sendButton.textContent;
    sendButton.disabled = true;
    sendButton.textContent = '发送中...';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/system/test-email', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email: email})
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.innerHTML = `<p class="success">测试邮件发送成功！请检查邮箱收件箱（包括垃圾邮件文件夹）</p>`;
            if (resultDiv) {
                resultDiv.innerHTML = `
          <div class="test-result-success">
            ✅ 邮件主题：邮件发送测试 - ${result.site_name || 'EasyTier 节点管理系统'}
            <br><small>发送时间：${new Date().toLocaleString('zh-CN')}</small>
          </div>
        `;
            }
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 5000);
        } else {
            messageDiv.innerHTML = `<p class="error">邮件发送失败：${result.error || result.message || '未知错误'}</p>`;
            if (resultDiv) {
                resultDiv.innerHTML = `
          <div class="test-result-error">
            ❌ ${result.details ? `详细信息：${result.details}` : '请检查邮件服务配置'}
          </div>
        `;
            }
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 3000);
        }
    } catch (error) {
        console.error('发送测试邮件失败:', error);
        messageDiv.innerHTML = `<p class="error">网络错误：${error instanceof Error ? error.message : '请检查网络连接后重试'}</p>`;
        const resultDiv = document.getElementById('test-email-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
        <div class="test-result-error">
          ❌ 请检查网络连接或邮件服务配置
        </div>
      `;
        }
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = originalText;
    }
};

// 保存设置
window.saveSettings = async (e) => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('message');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '保存中...';

    const data = {
resend_api_key: document.getElementById('resend-api-key').value,
resend_from_email: document.getElementById('resend-from-email').value,
resend_from_domain: document.getElementById('resend-from-domain').value,
site_name: document.getElementById('site-name').value,
site_url: document.getElementById('site-url').value
}
    ;

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

        const result = await response.json();

        if (response.ok) {
            messageDiv.innerHTML = `<p class="success">${result.message}</p>`;
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 3000);
        } else {
            messageDiv.innerHTML = `<p class="error">${result.error || '保存失败'}</p>`;
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 3000);
        }
    } catch (error) {
        console.error('保存设置失败:', error);
        messageDiv.innerHTML = '<p class="error">保存设置失败</p>';
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
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

    loadSettings();
    loadUsers();

    // 表单提交事件
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', window.saveSettings);
    }

    // 测试邮件按钮事件
    const sendTestEmailBtn = document.getElementById('send-test-email');
    if (sendTestEmailBtn) {
        sendTestEmailBtn.addEventListener('click', window.sendTestEmail);
    }

    // 测试邮箱输入框回车事件
    const testEmailInput = document.getElementById('test-email');
    if (testEmailInput) {
        testEmailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.sendTestEmail();
            }
        });
    }
});
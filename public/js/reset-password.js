// 密码重置页面JavaScript代码

document.addEventListener('DOMContentLoaded', async () => {
    document.title = 'EasyTier 节点管理系统 - 密码重置';
    
    // 检查URL中是否有token参数
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    const requestResetContainer = document.getElementById('request-reset-form-container');
    const resetPasswordContainer = document.getElementById('reset-password-form-container');
    const resetTokenInput = document.getElementById('reset-token');
    
    if (token) {
        // 如果有token，显示重置密码表单
        requestResetContainer.style.display = 'none';
        resetPasswordContainer.style.display = 'block';
        resetTokenInput.value = token;
    } else {
        // 否则显示请求重置表单
        requestResetContainer.style.display = 'block';
        resetPasswordContainer.style.display = 'none';
    }
    
    // 请求密码重置表单提交
    const requestResetForm = document.getElementById('request-reset-form');
    if (requestResetForm) {
        requestResetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = requestResetForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '发送中...';
            
            const formData = new FormData(requestResetForm);
            const data = {
                email: formData.get('email')
            };
            
            try {
                const response = await fetch('/api/auth/request-password-reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                const messageEl = document.getElementById('reset-message');
                
                if (response.ok) {
                    if (messageEl) {
                        messageEl.textContent = result.message + '\n' + (result.details || '');
                        messageEl.className = 'message success';
                        messageEl.style.display = 'block';
                    }
                    
                    // 清空表单
                    requestResetForm.reset();
                } else {
                    if (messageEl) {
                        let errorText = result.error || '请求失败';
                        if (result.details) {
                            errorText += '\n' + result.details;
                        }
                        messageEl.textContent = errorText;
                        messageEl.className = 'message error';
                        messageEl.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('请求密码重置失败:', error);
                const messageEl = document.getElementById('reset-message');
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
    
    // 重置密码表单提交
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = '重置中...';
            
            const formData = new FormData(resetPasswordForm);
            const newPassword = formData.get('new-password');
            const confirmPassword = formData.get('confirm-password');
            const token = formData.get('reset-token');
            
            // 验证密码
            if (newPassword !== confirmPassword) {
                const messageEl = document.getElementById('reset-message');
                if (messageEl) {
                    messageEl.textContent = '两次输入的密码不一致';
                    messageEl.className = 'message error';
                    messageEl.style.display = 'block';
                }
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            if (newPassword.length < 6) {
                const messageEl = document.getElementById('reset-message');
                if (messageEl) {
                    messageEl.textContent = '密码长度至少为 6 位';
                    messageEl.className = 'message error';
                    messageEl.style.display = 'block';
                }
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            const data = {
                token: token,
                new_password: newPassword
            };
            
            try {
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                const messageEl = document.getElementById('reset-message');
                
                if (response.ok) {
                    if (messageEl) {
                        messageEl.textContent = result.message + '\n' + (result.details || '');
                        messageEl.className = 'message success';
                        messageEl.style.display = 'block';
                    }
                    
                    // 清空表单
                    resetPasswordForm.reset();
                    
                    // 3秒后跳转到登录页面
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 3000);
                } else {
                    if (messageEl) {
                        let errorText = result.error || '重置失败';
                        if (result.details) {
                            errorText += '\n' + result.details;
                        }
                        messageEl.textContent = errorText;
                        messageEl.className = 'message error';
                        messageEl.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('重置密码失败:', error);
                const messageEl = document.getElementById('reset-message');
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
});
export default function UserEmail() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo/标题 */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{
            color: '#667eea',
            fontSize: '28px',
            marginBottom: '10px',
            fontWeight: '600'
          }}>
            EasyTier
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            节点管理系统
          </p>
        </div>

        {/* 状态容器 */}
        <div id="status-container" style={{ marginBottom: '20px' }}>
          {/* 加载图标 */}
          <div id="loading-icon" style={{
            width: '60px',
            height: '60px',
            margin: '0 auto',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          
          {/* 成功图标 - 默认隐藏 */}
          <div id="success-icon" style={{
            width: '60px',
            height: '60px',
            margin: '0 auto',
            background: '#28a745',
            borderRadius: '50%',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            ✓
          </div>
          
          {/* 错误图标 - 默认隐藏 */}
          <div id="error-icon" style={{
            width: '60px',
            height: '60px',
            margin: '0 auto',
            background: '#dc3545',
            borderRadius: '50%',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            ✗
          </div>
        </div>

        {/* 消息内容 */}
        <div id="message-container" style={{ marginBottom: '30px' }}>
          <p id="status-message" style={{
            color: '#333',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            正在验证您的邮箱地址，请稍候...
          </p>
        </div>

        {/* 操作按钮 */}
        <div id="actions-container" style={{ display: 'none', flexDirection: 'column', gap: '10px' }}>
          <button
            id="login-btn"
            onClick={() => window.location.href = '/login'}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background 0.3s',
              display: 'none'
            }}
          >
            前往登录
          </button>
          
          <button
            id="resend-btn"
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background 0.3s',
              display: 'none'
            }}
          >
            重新发送验证邮件
          </button>
          
          <button
            id="register-btn"
            onClick={() => window.location.href = '/register'}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background 0.3s',
              display: 'none'
            }}
          >
            重新注册
          </button>
        </div>

        {/* 提示信息 */}
        <div id="hint-container" style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '5px',
          borderLeft: '4px solid #667eea'
        }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            正在验证您的邮箱地址，请稍候...
          </p>
        </div>

        {/* 样式和脚本 */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 立即执行的脚本
              (function() {
                let currentEmail = '';
                let currentStatus = 'loading';

                // DOM元素引用
                const loadingIcon = document.getElementById('loading-icon');
                const successIcon = document.getElementById('success-icon');
                const errorIcon = document.getElementById('error-icon');
                const statusMessage = document.getElementById('status-message');
                const actionsContainer = document.getElementById('actions-container');
                const loginBtn = document.getElementById('login-btn');
                const resendBtn = document.getElementById('resend-btn');
                const registerBtn = document.getElementById('register-btn');
                const hintContainer = document.getElementById('hint-container');

                // 更新UI状态
                function updateUI(status, message, email = '') {
                  currentStatus = status;
                  currentEmail = email;
                  
                  // 隐藏所有图标
                  loadingIcon.style.display = 'none';
                  successIcon.style.display = 'none';
                  errorIcon.style.display = 'none';
                  
                  // 隐藏所有按钮
                  loginBtn.style.display = 'none';
                  resendBtn.style.display = 'none';
                  registerBtn.style.display = 'none';
                  actionsContainer.style.display = 'none';
                  
                  // 更新消息样式
                  statusMessage.style.color = status === 'error' ? '#dc3545' : '#333';
                  
                  // 根据状态更新UI
                  switch (status) {
                    case 'loading':
                      loadingIcon.style.display = 'block';
                      hintContainer.style.display = 'block';
                      hintContainer.style.background = '#f8f9fa';
                      hintContainer.style.borderLeft = '4px solid #667eea';
                      hintContainer.querySelector('p').textContent = '正在验证您的邮箱地址，请稍候...';
                      hintContainer.querySelector('p').style.color = '#666';
                      break;
                      
                    case 'success':
                      successIcon.style.display = 'flex';
                      loginBtn.style.display = 'block';
                      actionsContainer.style.display = 'flex';
                      hintContainer.style.display = 'none';
                      break;
                      
                    case 'error':
                      errorIcon.style.display = 'flex';
                      registerBtn.style.display = 'block';
                      actionsContainer.style.display = 'flex';
                      hintContainer.style.display = 'block';
                      hintContainer.style.background = '#f8d7da';
                      hintContainer.style.borderLeft = '4px solid #dc3545';
                      hintContainer.querySelector('p').textContent = '如果您没有收到验证邮件，请重新注册或联系管理员。';
                      hintContainer.querySelector('p').style.color = '#721c24';
                      
                      // 如果有邮箱，显示重新发送按钮
                      if (email) {
                        resendBtn.style.display = 'block';
                      }
                      break;
                      
                    case 'resending':
                      errorIcon.style.display = 'flex';
                      resendBtn.style.display = 'block';
                      resendBtn.textContent = '发送中...';
                      resendBtn.style.background = '#ffc107';
                      actionsContainer.style.display = 'flex';
                      hintContainer.style.display = 'none';
                      break;
                  }
                  
                  // 更新消息
                  statusMessage.textContent = message;
                }

                // 验证邮箱
                async function verifyEmail(token) {
                  try {
                    const response = await fetch('/api/auth/verify-email', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ token }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      updateUI('success', '邮箱验证成功！', data.email || '');
                    } else {
                      updateUI('error', data.error || '验证失败', data.email || '');
                    }
                  } catch (error) {
                    console.error('验证邮箱错误:', error);
                    updateUI('error', '验证过程中出现错误，请稍后重试');
                  }
                }

                // 重新发送验证邮件
                async function resendVerification() {
                  if (!currentEmail) return;
                  
                  updateUI('resending', '正在重新发送验证邮件...', currentEmail);
                  
                  try {
                    const response = await fetch('/api/auth/resend-verification', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email: currentEmail }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      updateUI('loading', '验证邮件已重新发送，请查收邮箱（包括垃圾邮件文件夹）', currentEmail);
                      // 重置重新发送按钮
                      resendBtn.textContent = '重新发送验证邮件';
                      resendBtn.style.background = '#28a745';
                    } else {
                      updateUI('error', data.error || '重新发送失败', currentEmail);
                    }
                  } catch (error) {
                    console.error('重新发送验证邮件错误:', error);
                    updateUI('error', '重新发送过程中出现错误，请稍后重试', currentEmail);
                  }
                }

                // 重新发送按钮事件
                resendBtn.addEventListener('click', resendVerification);

                // 从URL获取token并验证
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                
                if (!token) {
                  updateUI('error', '验证链接无效或已过期');
                } else {
                  verifyEmail(token);
                }
              })();
            `
          }}
        />
      </div>
    </div>
  )
}
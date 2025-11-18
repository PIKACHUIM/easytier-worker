export default function WaitEmail() {
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

        {/* 状态图标 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto',
            background: '#ffc107',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            ⚠️
          </div>
        </div>

        {/* 标题 */}
        <h2 style={{
          color: '#333',
          fontSize: '20px',
          marginBottom: '15px',
          fontWeight: '600'
        }}>
          需要验证邮箱
        </h2>

        {/* 说明文字 */}
        <div style={{ marginBottom: '25px' }}>
          <p style={{
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.5',
            marginBottom: '10px'
          }}>
            您的账户尚未验证邮箱地址。请先验证邮箱后再登录。
          </p>
          <p style={{
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            如果您没有收到验证邮件，可以重新发送。
          </p>
        </div>

        {/* 邮箱输入 */}
        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <label style={{
            display: 'block',
            color: '#333',
            fontSize: '14px',
            marginBottom: '5px',
            fontWeight: '500'
          }}>
            邮箱地址
          </label>
          <input
            id="email-input"
            type="email"
            placeholder="请输入您的邮箱地址"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px',
              transition: 'border-color 0.3s'
            }}
          />
        </div>

        {/* 消息显示 */}
        <div 
          id="message-container"
          style={{
            marginBottom: '20px',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '14px',
            display: 'none'
          }}
        >
          <p id="message-text" style={{ margin: 0 }}></p>
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            id="resend-btn"
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            重新发送验证邮件
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.location.href = '/register'}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.3s',
                flex: 1
              }}
            >
              重新注册
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              style={{
                background: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                padding: '10px 20px',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                flex: 1
              }}
            >
              返回登录
            </button>
          </div>
        </div>

        {/* 帮助信息 */}
        <div style={{
          marginTop: '25px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '5px',
          borderLeft: '4px solid #667eea'
        }}>
          <h3 style={{
            color: '#333',
            fontSize: '14px',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            💡 小提示
          </h3>
          <ul style={{
            color: '#666',
            fontSize: '13px',
            textAlign: 'left',
            paddingLeft: '20px',
            margin: 0
          }}>
            <li style={{ marginBottom: '5px' }}>验证邮件可能被误判为垃圾邮件</li>
            <li style={{ marginBottom: '5px' }}>验证链接在24小时内有效</li>
            <li>如有问题请联系管理员</li>
          </ul>
        </div>

        {/* 脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                let currentStatus = 'idle';
                
                // DOM元素引用
                const emailInput = document.getElementById('email-input');
                const resendBtn = document.getElementById('resend-btn');
                const messageContainer = document.getElementById('message-container');
                const messageText = document.getElementById('message-text');

                // 更新UI状态
                function updateMessage(status, message) {
                  currentStatus = status;
                  messageContainer.style.display = 'block';
                  messageText.textContent = message;
                  
                  // 根据状态设置样式
                  if (status === 'success') {
                    messageContainer.style.backgroundColor = '#d4edda';
                    messageContainer.style.color = '#155724';
                    messageContainer.style.border = '1px solid #c3e6cb';
                  } else if (status === 'error') {
                    messageContainer.style.backgroundColor = '#f8d7da';
                    messageContainer.style.color = '#721c24';
                    messageContainer.style.border = '1px solid #f5c6cb';
                  } else {
                    messageContainer.style.backgroundColor = '#fff3cd';
                    messageContainer.style.color = '#856404';
                    messageContainer.style.border = '1px solid #ffeeba';
                  }
                }

                // 更新按钮状态
                function updateButtonState(sending) {
                  if (sending) {
                    resendBtn.textContent = '发送中...';
                    resendBtn.style.background = '#6c757d';
                    resendBtn.style.cursor = 'not-allowed';
                    resendBtn.disabled = true;
                  } else {
                    resendBtn.textContent = '重新发送验证邮件';
                    resendBtn.style.background = '#667eea';
                    resendBtn.style.cursor = 'pointer';
                    resendBtn.disabled = false;
                  }
                }

                // 邮箱输入框焦点效果
                emailInput.addEventListener('focus', function() {
                  this.style.borderColor = '#667eea';
                });

                emailInput.addEventListener('blur', function() {
                  this.style.borderColor = '#ddd';
                });

                // 重新发送验证邮件
                async function resendVerification() {
                  const email = emailInput.value.trim();
                  
                  if (!email) {
                    updateMessage('error', '请输入您的邮箱地址');
                    return;
                  }

                  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                  if (!emailRegex.test(email)) {
                    updateMessage('error', '请输入有效的邮箱地址');
                    return;
                  }

                  updateButtonState(true);
                  updateMessage('sending', '正在重新发送验证邮件...');

                  try {
                    const response = await fetch('/api/auth/resend-verification', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                      updateMessage('success', data.details || data.message);
                    } else {
                      updateMessage('error', data.error || '发送失败');
                    }
                  } catch (error) {
                    console.error('重新发送验证邮件错误:', error);
                    updateMessage('error', '网络错误，请稍后重试');
                  } finally {
                    updateButtonState(false);
                  }
                }

                // 绑定重新发送按钮事件
                resendBtn.addEventListener('click', resendVerification);

                // 支持回车键发送
                emailInput.addEventListener('keypress', function(e) {
                  if (e.key === 'Enter') {
                    resendVerification();
                  }
                });
              })();
            `
          }}
        />
      </div>
    </div>
  )
}
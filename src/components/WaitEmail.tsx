// 等待邮件验证页面组件 - 现代设计
export default function WaitEmail() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '20px',
            position: 'relative'
        }}>
            {/* 背景装饰 */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(ellipse 80% 50% at 20% -20%, rgba(79, 70, 229, 0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)',
                pointerEvents: 'none', zIndex: 0
            }}></div>

            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                padding: '48px 40px',
                maxWidth: '480px',
                width: '100%',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 25px rgba(0,0,0,0.4)',
                position: 'relative',
                zIndex: 1,
                overflow: 'hidden'
            }}>
                {/* 顶部渐变线 */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fcd34d)'
                }}></div>

                {/* Logo */}
                <div style={{textAlign: 'center', marginBottom: '28px'}}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', margin: '0 auto 16px'
                    }}>⚠️</div>
                    <h1 style={{
                        color: '#f1f5f9', fontSize: '22px', fontWeight: '800',
                        letterSpacing: '-0.02em', marginBottom: '8px',
                        fontFamily: "'Inter', sans-serif"
                    }}>需要验证邮箱</h1>
                    <p style={{color: '#94a3b8', fontSize: '13px', lineHeight: '1.6'}}>
                        您的账户尚未验证邮箱地址。请先验证邮箱后再登录。
                    </p>
                    <p style={{color: '#94a3b8', fontSize: '13px', marginTop: '6px'}}>
                        如果您没有收到验证邮件，可以重新发送。
                    </p>
                </div>

                {/* 邮箱输入 */}
                <div style={{marginBottom: '16px'}}>
                    <label style={{
                        display: 'block', color: '#94a3b8', fontSize: '13px',
                        marginBottom: '8px', fontWeight: '500', fontFamily: "'Inter', sans-serif"
                    }}>邮箱地址</label>
                    <input
                        id="email-input"
                        type="email"
                        placeholder="请输入您的邮箱地址"
                        style={{
                            width: '100%', padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px', fontSize: '14px',
                            color: '#f1f5f9', outline: 'none',
                            fontFamily: "'Inter', sans-serif",
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* 消息显示 */}
                <div id="message-container" style={{
                    marginBottom: '16px', padding: '10px 14px',
                    borderRadius: '8px', fontSize: '13px', display: 'none'
                }}>
                    <p id="message-text" style={{margin: 0, fontFamily: "'Inter', sans-serif"}}></p>
                </div>

                {/* 操作按钮 */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <button id="resend-btn" style={{
                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        color: 'white', border: 'none', padding: '12px 24px',
                        borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                    }}>重新发送验证邮件</button>

                    <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={() => window.location.href = '/register'} style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)',
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                            fontWeight: '500', cursor: 'pointer', flex: 1,
                            fontFamily: "'Inter', sans-serif"
                        }}>重新注册</button>
                        <button onClick={() => window.location.href = '/login'} style={{
                            background: 'transparent',
                            color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.4)',
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                            fontWeight: '500', cursor: 'pointer', flex: 1,
                            fontFamily: "'Inter', sans-serif"
                        }}>返回登录</button>
                    </div>
                </div>

                {/* 帮助信息 */}
                <div style={{
                    marginTop: '24px', padding: '14px 16px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: '10px', borderLeft: '3px solid #6366f1'
                }}>
                    <h3 style={{
                        color: '#f1f5f9', fontSize: '13px', marginBottom: '8px',
                        fontWeight: '600', fontFamily: "'Inter', sans-serif"
                    }}>💡 小提示</h3>
                    <ul style={{
                        color: '#94a3b8', fontSize: '12px', textAlign: 'left',
                        paddingLeft: '18px', margin: 0, lineHeight: '1.8',
                        fontFamily: "'Inter', sans-serif"
                    }}>
                        <li>验证邮件可能被误判为垃圾邮件</li>
                        <li>验证链接在24小时内有效</li>
                        <li>如有问题请联系管理员</li>
                    </ul>
                </div>

                <script dangerouslySetInnerHTML={{
                    __html: `
(function() {
  var currentStatus = 'idle';
  var emailInput = document.getElementById('email-input');
  var resendBtn = document.getElementById('resend-btn');
  var messageContainer = document.getElementById('message-container');
  var messageText = document.getElementById('message-text');

  function updateMessage(status, message) {
    currentStatus = status;
    messageContainer.style.display = 'block';
    messageText.textContent = message;
    if (status === 'success') {
      messageContainer.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      messageContainer.style.color = '#10b981';
      messageContainer.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    } else if (status === 'error') {
      messageContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      messageContainer.style.color = '#ef4444';
      messageContainer.style.border = '1px solid rgba(239, 68, 68, 0.2)';
    } else {
      messageContainer.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
      messageContainer.style.color = '#f59e0b';
      messageContainer.style.border = '1px solid rgba(245, 158, 11, 0.2)';
    }
  }

  function updateButtonState(sending) {
    if (sending) {
      resendBtn.textContent = '发送中...';
      resendBtn.style.background = 'rgba(107, 114, 128, 0.3)';
      resendBtn.style.cursor = 'not-allowed';
      resendBtn.disabled = true;
    } else {
      resendBtn.textContent = '重新发送验证邮件';
      resendBtn.style.background = 'linear-gradient(135deg, #4f46e5, #6366f1)';
      resendBtn.style.cursor = 'pointer';
      resendBtn.disabled = false;
    }
  }

  emailInput.addEventListener('focus', function() { this.style.borderColor = '#6366f1'; this.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)'; });
  emailInput.addEventListener('blur', function() { this.style.borderColor = 'rgba(255,255,255,0.12)'; this.style.boxShadow = 'none'; });

  async function resendVerification() {
    var email = emailInput.value.trim();
    if (!email) { updateMessage('error', '请输入您的邮箱地址'); return; }
    var emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) { updateMessage('error', '请输入有效的邮箱地址'); return; }
    updateButtonState(true);
    updateMessage('sending', '正在重新发送验证邮件...');
    try {
      var response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      var data = await response.json();
      if (response.ok) { updateMessage('success', data.details || data.message); }
      else { updateMessage('error', data.error || '发送失败'); }
    } catch(error) {
      updateMessage('error', '网络错误，请稍后重试');
    } finally {
      updateButtonState(false);
    }
  }

  resendBtn.addEventListener('click', resendVerification);
  emailInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') resendVerification(); });
})();
                    `
                }}/>
            </div>
        </div>
    )
}
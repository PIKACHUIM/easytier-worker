// 邮箱验证页面组件 - 现代设计
export default function UserEmail() {
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
                maxWidth: '460px',
                width: '100%',
                textAlign: 'center',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 25px rgba(0,0,0,0.4)',
                position: 'relative',
                zIndex: 1,
                overflow: 'hidden'
            }}>
                {/* 顶部渐变线 */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, #4f46e5, #6366f1, #a78bfa)'
                }}></div>

                {/* Logo */}
                <div style={{marginBottom: '32px'}}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', margin: '0 auto 16px',
                        boxShadow: '0 0 20px rgba(79, 70, 229, 0.4)'
                    }}>🌐</div>
                    <h1 style={{
                        color: '#f1f5f9', fontSize: '24px', fontWeight: '800',
                        letterSpacing: '-0.02em', marginBottom: '4px',
                        fontFamily: "'Inter', sans-serif"
                    }}>EasyTier</h1>
                    <p style={{color: '#94a3b8', fontSize: '14px'}}>节点管理系统</p>
                </div>

                {/* 状态容器 */}
                <div id="status-container" style={{marginBottom: '20px'}}>
                    <div id="loading-icon" style={{
                        width: '52px', height: '52px', margin: '0 auto',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTop: '3px solid #6366f1',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                    }}></div>

                    <div id="success-icon" style={{
                        width: '52px', height: '52px', margin: '0 auto',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '50%', display: 'none',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#10b981', fontSize: '24px'
                    }}>✓</div>

                    <div id="error-icon" style={{
                        width: '52px', height: '52px', margin: '0 auto',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '50%', display: 'none',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#ef4444', fontSize: '24px'
                    }}>✗</div>
                </div>

                {/* 消息内容 */}
                <div id="message-container" style={{marginBottom: '28px'}}>
                    <p id="status-message" style={{
                        color: '#f1f5f9', fontSize: '15px', lineHeight: '1.6',
                        fontFamily: "'Inter', sans-serif"
                    }}>
                        正在验证您的邮箱地址，请稍候...
                    </p>
                </div>

                {/* 操作按钮 */}
                <div id="actions-container" style={{display: 'none', flexDirection: 'column', gap: '10px'}}>
                    <button id="login-btn" onClick={() => window.location.href = '/login'} style={{
                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        color: 'white', border: 'none', padding: '12px 24px',
                        borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                        cursor: 'pointer', display: 'none', fontFamily: "'Inter', sans-serif",
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                    }}>前往登录</button>

                    <button id="resend-btn" style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '12px 24px', borderRadius: '10px', fontSize: '14px',
                        fontWeight: '600', cursor: 'pointer', display: 'none',
                        fontFamily: "'Inter', sans-serif"
                    }}>重新发送验证邮件</button>

                    <button id="register-btn" onClick={() => window.location.href = '/register'} style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)',
                        padding: '12px 24px', borderRadius: '10px', fontSize: '14px',
                        fontWeight: '500', cursor: 'pointer', display: 'none',
                        fontFamily: "'Inter', sans-serif"
                    }}>重新注册</button>
                </div>

                {/* 提示信息 */}
                <div id="hint-container" style={{
                    marginTop: '20px', padding: '14px 16px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: '10px', borderLeft: '3px solid #6366f1'
                }}>
                    <p style={{margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: '1.5'}}>
                        正在验证您的邮箱地址，请稍候...
                    </p>
                </div>

                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>

                <script dangerouslySetInnerHTML={{
                    __html: `
(function() {
  var currentEmail = '';
  var currentStatus = 'loading';
  var loadingIcon = document.getElementById('loading-icon');
  var successIcon = document.getElementById('success-icon');
  var errorIcon = document.getElementById('error-icon');
  var statusMessage = document.getElementById('status-message');
  var actionsContainer = document.getElementById('actions-container');
  var loginBtn = document.getElementById('login-btn');
  var resendBtn = document.getElementById('resend-btn');
  var registerBtn = document.getElementById('register-btn');
  var hintContainer = document.getElementById('hint-container');

  function updateUI(status, message, email) {
    currentStatus = status;
    currentEmail = email || '';
    loadingIcon.style.display = 'none';
    successIcon.style.display = 'none';
    errorIcon.style.display = 'none';
    loginBtn.style.display = 'none';
    resendBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    actionsContainer.style.display = 'none';
    statusMessage.style.color = status === 'error' ? '#ef4444' : '#f1f5f9';
    switch (status) {
      case 'loading':
        loadingIcon.style.display = 'block';
        hintContainer.style.display = 'block';
        hintContainer.style.background = 'rgba(99, 102, 241, 0.08)';
        hintContainer.style.borderLeft = '3px solid #6366f1';
        hintContainer.querySelector('p').textContent = '正在验证您的邮箱地址，请稍候...';
        hintContainer.querySelector('p').style.color = '#94a3b8';
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
        hintContainer.style.background = 'rgba(239, 68, 68, 0.08)';
        hintContainer.style.borderLeft = '3px solid #ef4444';
        hintContainer.querySelector('p').textContent = '如果您没有收到验证邮件，请重新注册或联系管理员。';
        hintContainer.querySelector('p').style.color = '#f87171';
        if (email) { resendBtn.style.display = 'block'; }
        break;
      case 'resending':
        errorIcon.style.display = 'flex';
        resendBtn.style.display = 'block';
        resendBtn.textContent = '发送中...';
        resendBtn.style.background = 'rgba(245, 158, 11, 0.15)';
        resendBtn.style.color = '#f59e0b';
        actionsContainer.style.display = 'flex';
        hintContainer.style.display = 'none';
        break;
    }
    statusMessage.textContent = message;
  }

  async function verifyEmail(token) {
    try {
      var response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      var data = await response.json();
      if (response.ok) { updateUI('success', '邮箱验证成功！', data.email || ''); }
      else { updateUI('error', data.error || '验证失败', data.email || ''); }
    } catch(error) {
      updateUI('error', '验证过程中出现错误，请稍后重试');
    }
  }

  async function resendVerification() {
    if (!currentEmail) return;
    updateUI('resending', '正在重新发送验证邮件...', currentEmail);
    try {
      var response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail })
      });
      var data = await response.json();
      if (response.ok) {
        updateUI('loading', '验证邮件已重新发送，请查收邮箱（包括垃圾邮件文件夹）', currentEmail);
        resendBtn.textContent = '重新发送验证邮件';
        resendBtn.style.background = 'rgba(16, 185, 129, 0.15)';
        resendBtn.style.color = '#10b981';
      } else {
        updateUI('error', data.error || '重新发送失败', currentEmail);
      }
    } catch(error) {
      updateUI('error', '重新发送过程中出现错误，请稍后重试', currentEmail);
    }
  }

  resendBtn.addEventListener('click', resendVerification);
  var urlParams = new URLSearchParams(window.location.search);
  var token = urlParams.get('token');
  if (!token) { updateUI('error', '验证链接无效或已过期'); }
  else { verifyEmail(token); }
})();
                    `
                }}/>
            </div>
        </div>
    )
}
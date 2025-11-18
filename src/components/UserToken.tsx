// 用户Token管理页面组件
import WebHeader from './WebHeader';
import WebFooter from './WebFooter';

function UserToken() {
  return (
<div className="container">
      <WebHeader title="EasyTier 节点管理系统 - 用户管理" />
      
<main className="main">
<div className="user-token-container" style="max-width: 800px; margin: 0 auto;">
          <h2 style="margin-bottom: 30px; color: #333;">用户管理</h2>
          
          {/* Token管理区域 */}
<div className="token-section" style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 30px;">
            <h3 style="margin-bottom: 20px; color: #667eea;">Token管理</h3>
            
<div className="form-group" style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #555; font-weight: 500;">当前Token</label>
              <input 
                type="text" 
                id="current-token" 
                readonly 
                placeholder="Token将自动显示在此处"
                style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; background: #f8f9fa; font-family: monospace; font-size: 14px; box-sizing: border-box;"
              />
            </div>
            
<div className="form-group" style="display: flex; gap: 10%; flex-wrap: wrap; justify-content: space-between;">
              <button 
                onclick="copyTokenToClipboard()" 
className="btn-primary"
                style="flex: 0 0 45%; padding: 10px 20px; box-sizing: border-box;"
              >
                复制Token
              </button>
              <button 
                onclick="resetToken()" 
className="btn-primary"
                style="flex: 0 0 45%; padding: 10px 20px; box-sizing: border-box;"
              >
                重置Token
              </button>
            </div>
            
            <p style="margin-top: 15px; color: #666; font-size: 14px;">
              ⚠️ 重置Token后，旧Token将失效，您需要使用新Token连接API
            </p>
          </div>
          
          {/* 修改密码区域 */}
<div className="password-section" style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="margin-bottom: 20px; color: #667eea;">修改密码</h3>
            
            <form id="change-password-form" onsubmit="return false;">
<div className="form-group" style="margin-bottom: 20px;">
                <label for="new-password" style="display: block; margin-bottom: 8px; color: #555; font-weight: 500;">
                  新密码 <span style="color: red;">*</span>
                </label>
                <input 
                  type="password" 
                  id="new-password" 
                  required 
                  minlength={6}
                  placeholder="请输入新密码（至少6位）"
                  style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
                />
              </div>
              
<div className="form-group" style="margin-bottom: 20px;">
                <label for="confirm-password" style="display: block; margin-bottom: 8px; color: #555; font-weight: 500;">
                  确认密码 <span style="color: red;">*</span>
                </label>
                <input 
                  type="password" 
                  id="confirm-password" 
                  required 
                  minlength={6}
                  placeholder="请再次输入新密码"
                  style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
                />
              </div>
              
<div className="form-group">
                <button 
                  type="submit" 
                  onclick="changePassword()"
className="btn-primary"
                  style="padding: 10px 30px;"
                >
                  修改密码
                </button>
              </div>
            </form>
          </div>
          
          {/* 返回按钮 */}
          <div style="margin-top: 30px; text-align: center;">
<a href="/dashboard" className="btn-secondary" style="display: inline-block; padding: 10px 30px; text-decoration: none;">
              返回我的节点
            </a>
          </div>
        </div>
      </main>
      
      <WebFooter title="用户管理页面" />
      
      <script src="/js/usertoken.js"></script>
    </div>
  );
}

export default UserToken;

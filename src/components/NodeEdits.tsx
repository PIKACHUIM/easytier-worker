// 节点表单组件 - 现代设计
interface NodeFormProps {
    mode: 'admin' | 'dashboard';
    modalId?: string;
    formId?: string;
    title?: string;
}

function NodeEdits({
                       mode,
                       modalId = `${mode}-node-modal`,
                       formId = `${mode}-node-form`,
                       title = mode === 'admin' ? '编辑节点' : '添加节点'
                   }: NodeFormProps) {

    const prefix = mode === 'admin' ? 'admin-' : 'dashboard-';

    return (
        <div id={modalId} className="modal" style={{display: 'none'}}>
            <div className="modal-content" style={{maxWidth: '900px', margin: '0 auto'}}>
                <button className="close" id={`${prefix}modal-close`}>&times;</button>
                <h2 id={`${prefix}modal-title`}>{title}</h2>

                <form id={formId}>
                    <input type="hidden" id={`${prefix}node-id`}/>

                    {/* 节点名称 */}
                    <div className="form-group">
                        <label htmlFor={`${prefix}node-name`}>节点名称 *</label>
                        <input
                            type="text"
                            id={`${prefix}node-name`}
                            required
                            placeholder="例如：北京节点1"
                        />
                    </div>

                    {/* 地域信息 */}
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                        <div className="form-group">
                            <label htmlFor={`${prefix}region-type`}>地域类型 *</label>
                            <select id={`${prefix}region-type`} required>
                                <option value="domestic">大陆</option>
                                <option value="overseas">海外</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor={`${prefix}region-detail`}>具体地区</label>
                            <input
                                type="text"
                                id={`${prefix}region-detail`}
                                placeholder="例如：北京、东京（可不填）"
                            />
                        </div>
                    </div>

                    {/* 测试网络 */}
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                        <div className="form-group">
                            <label htmlFor={`${prefix}network-name`}>测试网络名称</label>
                            <input
                                type="text"
                                id={`${prefix}network-name`}
                                placeholder="例如：test-network"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`${prefix}network-token`}>测试网络密码</label>
                            <input
                                type="text"
                                id={`${prefix}network-token`}
                                placeholder="网络访问密码"
                            />
                        </div>
                    </div>

                    {/* 连接方式 */}
                    <div className="form-group">
                        <label>连接方式 *</label>
                        <div id={`${prefix}connections-container`} style={{marginBottom: '10px'}}></div>
                        <button
                            type="button"
                            id={`${prefix}add-connection-btn`}
                            className="btn-small"
                            style={{width: 'auto'}}
                        >
                            + 添加连接
                        </button>
                    </div>

                    {/* 带宽和连接数 */}
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                        <div className="form-group">
                            <label htmlFor={`${prefix}max-bandwidth`}>最大带宽 (Mbps) *</label>
                            <input
                                type="number"
                                id={`${prefix}max-bandwidth`}
                                required
                                min="0"
                                step="0.01"
                                placeholder="1"
                                defaultValue="1"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`${prefix}max-connections`}>最大连接数 *</label>
                            <input
                                type="number"
                                id={`${prefix}max-connections`}
                                required
                                min="1"
                                placeholder="100"
                                defaultValue="100"
                            />
                        </div>
                    </div>

                    {/* 流量和重置 */}
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                        <div className="form-group">
                            <label htmlFor={`${prefix}max-traffic`}>最大流量 (GB) *</label>
                            <input
                                type="number"
                                id={`${prefix}max-traffic`}
                                required
                                min="0"
                                step="0.01"
                                placeholder="0"
                                defaultValue="0"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`${prefix}reset-cycle`}>
                                {mode === 'admin' ? '每月重置日期 (0-31) *' : '重置周期 (天) *'}
                            </label>
                            <input
                                type="number"
                                id={`${prefix}reset-cycle`}
                                required
                                min="0"
                                max={mode === 'admin' ? 31 : undefined}
                                placeholder={mode === 'admin' ? '0' : '30'}
                                defaultValue={mode === 'admin' ? '0' : '30'}
                            />
                        </div>
                    </div>

                    {/* ========== 流量控制设置 ========== */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '10px',
                        padding: '16px', 
                        border: '1px solid var(--bg-glass-border)',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{marginTop: 0, marginBottom: '16px', fontSize: '14px', color: 'var(--text-primary)'}}>
                            流量控制设置
                        </h3>
                        
                        {/* 带宽限制 */}
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label htmlFor={`${prefix}current-network-limit`}>当前网络限速 (Mbps)</label>
                                <input
                                    type="number"
                                    id={`${prefix}current-network-limit`}
                                    min="0"
                                    step="0.1"
                                    placeholder="0（不限速）"
                                    defaultValue="0"
                                />
                                <small>限制当前网络的带宽，0表示不限速</small>
                            </div>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label htmlFor={`${prefix}other-network-limit`}>其他网络限速 (Mbps)</label>
                                <input
                                    type="number"
                                    id={`${prefix}other-network-limit`}
                                    min="0"
                                    step="0.1"
                                    placeholder="0（不限速）"
                                    defaultValue="0"
                                />
                                <small>限制其他网络的带宽，0表示不限速</small>
                            </div>
                        </div>

                        {/* 流量重置方式 */}
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label htmlFor={`${prefix}traffic-reset-type`}>流量重置方式</label>
                                <select id={`${prefix}traffic-reset-type`}>
                                    <option value="monthly">按月重置</option>
                                    <option value="days">按天数重置</option>
                                    <option value="none">不自动重置</option>
                                </select>
                            </div>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label htmlFor={`${prefix}traffic-reset-value`}>重置值</label>
                                <input
                                    type="number"
                                    id={`${prefix}traffic-reset-value`}
                                    min="0"
                                    placeholder="按月时填1-31，按天时填天数"
                                />
                            </div>
                        </div>

                        {/* 启用流量统计 */}
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px'
                        }}>
                            <input
                                type="checkbox"
                                id={`${prefix}enable-traffic-stats`}
                                defaultChecked={true}
                                style={{width: '16px', height: '16px', accentColor: 'var(--primary)'}}
                            />
                            启用流量统计
                        </label>
                    </div>

                    {/* ========== 流量策略设置 ========== */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '10px',
                        padding: '16px', 
                        border: '1px solid var(--bg-glass-border)',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{marginTop: 0, marginBottom: '16px', fontSize: '14px', color: 'var(--text-primary)'}}>
                            流量策略（达到阈值执行动作）
                        </h3>
                        
                        {/* 策略容器 */}
                        <div id={`${prefix}policies-container`}>
                            {/* 动态添加的策略规则 */}
                        </div>
                        
                        <button
                            type="button"
                            id={`${prefix}add-policy-btn`}
                            className="btn-small"
                            style={{width: 'auto', marginTop: '8px'}}
                        >
                            + 添加策略规则
                        </button>

                        <small style={{display: 'block', marginTop: '8px', color: 'var(--text-secondary)'}}>
                            当节点流量达到阈值时，自动执行对应动作。可设置多个策略，按阈值从低到高依次触发。
                        </small>
                    </div>

                    {/* ========== 上报设置 ========== */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '10px',
                        padding: '16px', 
                        border: '1px solid var(--bg-glass-border)',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{marginTop: 0, marginBottom: '16px', fontSize: '14px', color: 'var(--text-primary)'}}>
                            节点上报设置
                        </h3>
                        
                        {/* 上报地址 */}
                        <div className="form-group">
                            <label htmlFor={`${prefix}report-urls`}>上报地址</label>
                            <input
                                type="text"
                                id={`${prefix}report-urls`}
                                placeholder="例如：https://api.example.com（多个地址用逗号分隔）"
                            />
                            <small>节点将定时向上述地址上报状态信息</small>
                        </div>

                        {/* 上报密钥 */}
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label htmlFor={`${prefix}report-secret`}>上报密钥</label>
                                <input
                                    type="password"
                                    id={`${prefix}report-secret`}
                                    placeholder="用于验证上报请求的密钥"
                                />
                            </div>
                            <div className="form-group" style={{marginBottom: 0}}>
                                <label htmlFor={`${prefix}report-interval`}>上报间隔（分钟）</label>
                                <input
                                    type="number"
                                    id={`${prefix}report-interval`}
                                    min="1"
                                    max="1440"
                                    placeholder="5"
                                    defaultValue="5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 有效期 */}
                    <div className="form-group">
                        <label htmlFor={`${prefix}valid-until`}>有效期至 *</label>
                        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                            <input type="date" id={`${prefix}valid-until`} required style={{flex: 1}}/>
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                whiteSpace: 'nowrap', cursor: 'pointer',
                                color: 'var(--text-secondary)', fontSize: '13px'
                            }}>
                                <input type="checkbox" id={`${prefix}valid-long-term`}
                                       style={{width: '16px', height: '16px', accentColor: 'var(--primary)'}}/>
                                长期有效
                            </label>
                        </div>
                    </div>

                    {/* 状态选项 */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px',
                        background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                        padding: '16px', border: '1px solid var(--bg-glass-border)',
                        marginBottom: '20px'
                    }}>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500'
                        }}>
                            <input
                                type="checkbox"
                                id={`${prefix}allow-relay`}
                                style={{width: '16px', height: '16px', accentColor: 'var(--primary)'}}
                            />
                            允许中转
                        </label>

                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500'
                        }}>
                            <input
                                type="checkbox"
                                id={`${prefix}is-enabled`}
                                style={{width: '16px', height: '16px', accentColor: 'var(--primary)'}}
                                defaultChecked={mode === 'dashboard'}
                            />
                            节点启用
                        </label>

                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: mode === 'admin' ? 'pointer' : 'not-allowed',
                            color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500',
                            opacity: mode === 'admin' ? 1 : 0.5
                        }}>
                            <input
                                type="checkbox"
                                id={`${prefix}is-approved`}
                                style={{
                                    width: '16px', height: '16px', accentColor: 'var(--primary)',
                                    cursor: mode === 'admin' ? 'pointer' : 'not-allowed'
                                }}
                                disabled={mode !== 'admin'}
                            />
                            通过审核
                        </label>

                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500'
                        }} title="勾选后节点将始终显示为在线状态，不会被定时任务标记为离线">
                            <input
                                type="checkbox"
                                id={`${prefix}always-online`}
                                style={{width: '16px', height: '16px', accentColor: '#10b981'}}
                            />
                            总是在线
                        </label>
                    </div>

                    {/* 管理员模式的状态联动脚本 */}
                    {mode === 'admin' && (
                        <script dangerouslySetInnerHTML={{
                            __html: `
                                document.addEventListener('DOMContentLoaded', function() {
                                    var enabledCheckbox = document.getElementById('admin-is-enabled');
                                    var approvedCheckbox = document.getElementById('admin-is-approved');
                                    if (enabledCheckbox && approvedCheckbox) {
                                        enabledCheckbox.addEventListener('change', function() {
                                            if (this.checked) { approvedCheckbox.checked = true; approvedCheckbox.disabled = false; }
                                        });
                                        approvedCheckbox.addEventListener('change', function() {
                                            if (!this.checked) { enabledCheckbox.checked = false; }
                                            else { enabledCheckbox.disabled = false; }
                                        });
                                    }
                                });
                            `
                        }}/>
                    )}

                    {/* 标签 */}
                    <div className="form-group">
                        <label htmlFor={`${prefix}tags`}>标签</label>
                        <input
                            type="text"
                            id={`${prefix}tags`}
                            placeholder="例如：高速、稳定"
                        />
                    </div>

                    {/* 下线通知 */}
                    <div className="form-group">
                        <label htmlFor={`${prefix}offline-notify`}>节点首次下线通知</label>
                        <select id={`${prefix}offline-notify`}>
                            <option value="0">不通知</option>
                            <option value="1">通知微信（WxPusher）</option>
                            <option value="2">通知邮箱</option>
                            <option value="3">Telegram通知</option>
                        </select>
                        <small>节点超过10分钟未上报时，系统将根据此设置发送通知（1小时内最多通知一次）</small>
                    </div>

                    {/* 备注 */}
                    <div className="form-group">
                        <label htmlFor={`${prefix}notes`}>备注信息</label>
                        <textarea
                            id={`${prefix}notes`}
                            placeholder="节点的其他说明信息"
                        />
                    </div>

                    <button type="submit" style={{width: '100%'}}>保存节点</button>
                </form>
            </div>
        </div>
    );
}

export default NodeEdits;
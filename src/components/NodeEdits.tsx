// 节点表单组件
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
            <div className="modal-content" style={{maxWidth: '800px'}}>
                <span className="close" id={`${prefix}modal-close`}>&times;</span>
                <h2 id={`${prefix}modal-title`}>{title}</h2>
                <form id={formId}>
                    <input type="hidden" id={`${prefix}node-id`}/>

                    <div className="form-group">
                        <label htmlFor={`${prefix}node-name`}>节点名称 *</label>
                        <input
                            type="text"
                            id={`${prefix}node-name`}
                            required
                            placeholder="例如：北京节点1"
                        />
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
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

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
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

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
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

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
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

                    {/* 为个人节点模式也添加有效期设置 */}
                    <div className="form-group">
                        <label htmlFor={`${prefix}valid-until`}>有效期至 *</label>
                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                            <input type="date" id={`${prefix}valid-until`} required/>
                            <label
                                style={{display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap'}}>
                                <input type="checkbox" id={`${prefix}valid-long-term`} style={{width: '24px'}}/>
                                长期有效
                            </label>
                        </div>
                    </div>

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px'}}>
                        <div className="form-group">
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input
                                    type="checkbox"
                                    id={`${prefix}allow-relay`}
                                    style={{width: 'auto'}}
                                />
                                允许中转
                            </label>
                        </div>

                        <div className="form-group">
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input
                                    type="checkbox"
                                    id={`${prefix}is-enabled`}
                                    style={{width: 'auto'}}
                                    defaultChecked={mode === 'dashboard'} // 管理员模式下默认不选中
                                />
                                节点启用
                            </label>
                        </div>

                        <div className="form-group">
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input
                                    type="checkbox"
                                    id={`${prefix}is-approved`}
                                    style={{width: 'auto', cursor: mode === 'admin' ? 'pointer' : 'not-allowed'}}
                                    disabled={mode !== 'admin'}
                                />
                                通过审核
                            </label>
                        </div>
                    </div>

                    {/* 添加状态联动逻辑的脚本 */}
                    {mode === 'admin' && (
                        <script dangerouslySetInnerHTML={{
                            __html: `
                                // 节点启用和审核状态联动逻辑
                                document.addEventListener('DOMContentLoaded', function() {
                                    const enabledCheckbox = document.getElementById('admin-is-enabled');
                                    const approvedCheckbox = document.getElementById('admin-is-approved');
                                    
                                    if (enabledCheckbox && approvedCheckbox) {
                                        // 当节点启用状态改变时
                                        enabledCheckbox.addEventListener('change', function() {
                                            if (this.checked) {
                                                // 如果启用节点，自动勾选通过审核
                                                approvedCheckbox.checked = true;
                                                approvedCheckbox.disabled = false;
                                            } else {
                                                // 如果禁用节点，保持审核状态不变（允许管理员手动控制）
                                                // approvedCheckbox 状态保持不变
                                            }
                                        });
                                        
                                        // 当审核状态改变时
                                        approvedCheckbox.addEventListener('change', function() {
                                            if (!this.checked) {
                                                // 如果取消审核，自动禁用节点
                                                enabledCheckbox.checked = false;
                                            } else {
                                                // 如果通过审核，可以选择是否启用节点
                                                enabledCheckbox.disabled = false;
                                            }
                                        });
                                    }
                                });
                            `
                        }} />
                    )}

                    <div className="form-group">
                        <label htmlFor={`${prefix}tags`}>标签</label>
                        <input
                            type="text"
                            id={`${prefix}tags`}
                            placeholder="例如：高速、稳定"
                        />
                    </div>

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

                    <div className="form-group">
                        <label htmlFor={`${prefix}notes`}>备注信息</label>
                        <textarea
                            id={`${prefix}notes`}
                            placeholder="节点的其他说明信息"
                        />
                    </div>

                    <button type="submit" className="btn-primary">保存节点</button>
                </form>
            </div>
        </div>
    );
}

export default NodeEdits;
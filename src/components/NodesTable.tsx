import { escapeHtml, formatDate, formatDateShort } from '../utils';

interface Node {
  id: number;
  node_name: string;
  status: 'online' | 'offline';
  region_type: 'domestic' | 'overseas';
  region_detail?: string;
  current_bandwidth: number;
  max_bandwidth: number;
  connection_count: number;
  max_connections: number;
  used_traffic: number;
  max_traffic: number;
  allow_relay: boolean;
  tags?: string;
  notes?: string;
  user_email?: string;
  created_at?: string;
  valid_until?: string;
  last_report_at?: string;
  connections?: Array<{
    type: string;
    ip: string;
    port: number;
  }>;
  report_token?: string;
  tier_bandwidth?: number;
  correction_traffic?: number;
  reset_cycle?: number;
  reset_date?: string;
}

interface NodesTableProps {
  nodes: Node[];
  mode: 'public' | 'my' | 'admin';
  onViewDetail?: (nodeId: number) => void;
  onEdit?: (nodeId: number) => void;
  onDelete?: (nodeId: number) => void;
  onCopyToken?: (token: string) => void;
  onRegenerateToken?: (nodeId: number) => void;
}

export function NodesTable({ 
  nodes, 
  mode, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  onCopyToken, 
  onRegenerateToken 
}: NodesTableProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const renderNodeRows = () => {
    if (nodes.length === 0) {
      const colSpan = mode === 'my' ? 11 : (mode === 'admin' ? 12 : 10);
      return (
        <tr>
          <td colSpan={colSpan} style={{ textAlign: 'center' }}>
            {mode === 'my' ? '您还没有添加任何节点，点击上方"添加节点"按钮开始添加' : 
             mode === 'admin' ? '暂无节点' : '暂无公开节点'}
          </td>
        </tr>
      );
    }

    return nodes.map(node => (
      <tr key={node.id}>
        <td>{escapeHtml(node.node_name)}</td>
        <td>
          <span class={`node-status ${node.status}`}>
            {node.status === 'online' ? '在线' : '离线'}
          </span>
        </td>
        <td>
          {node.region_type === 'domestic' ? '大陆' : '海外'} - {escapeHtml(node.region_detail || '-')}
        </td>
        <td>{(node.current_bandwidth || 0).toFixed(2)} Mbps</td>
        <td>{(node.max_bandwidth || 0).toFixed(2)} Mbps</td>
        <td>{node.connection_count} / {node.max_connections}</td>
        <td>{(node.used_traffic || 0).toFixed(2)} GB</td>
        <td>{node.max_traffic === 0 ? '无限制' : node.max_traffic.toFixed(2) + ' GB'}</td>
        <td>{node.allow_relay ? '是' : '否'}</td>
        <td>{escapeHtml(node.tags || '-')}</td>
        {mode === 'admin' && <td>{escapeHtml(node.notes || '-')}</td>}
        <td>
          {mode === 'public' ? (
            <button class="btn-small" onclick={() => onViewDetail?.(node.id)}>
              详情
            </button>
          ) : (
            <>
              <button class="btn-small" onclick={() => onViewDetail?.(node.id)}>
                详情
              </button>
              <button class="btn-small" onclick={() => onEdit?.(node.id)}>
                编辑
              </button>
              <button class="btn-small btn-danger" onclick={() => onDelete?.(node.id)}>
                删除
              </button>
            </>
          )}
        </td>
      </tr>
    ));
  };

  return (
    <table class="nodes-table">
      <thead>
        <tr>
          <th>节点名称</th>
          <th>状态</th>
          <th>地域</th>
          <th>当前带宽</th>
          <th>最大带宽</th>
          <th>连接数</th>
          <th>已用流量</th>
          <th>最大流量</th>
          <th>允许中转</th>
          <th>标签</th>
          {mode === 'admin' && <th>备注</th>}
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {renderNodeRows()}
      </tbody>
    </table>
  );
}

export function NodeDetailModal({ node, onClose }: { node?: Node; onClose: () => void }) {
  if (!node) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div class="modal" style={{ display: 'block' }}>
      <div class="modal-content" style={{ maxWidth: '900px' }}>
        <span class="close" onclick={onClose}>&times;</span>
        <h2>{node.node_name}</h2>
        <div style={{ display: 'grid', gap: '15px' }}>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '10px', color: '#667eea' }}>基本信息</h3>
            <div class="node-info"><strong>节点名称:</strong> {escapeHtml(node.node_name)}</div>
            <div class="node-info"><strong>地域:</strong> {node.region_type === 'domestic' ? '大陆' : '海外'} - {escapeHtml(node.region_detail || '')}</div>
            {node.user_email && <div class="node-info"><strong>用户邮箱:</strong> {escapeHtml(node.user_email)}</div>}
            {node.created_at && <div class="node-info"><strong>创建时间:</strong> {formatDate(node.created_at)}</div>}
            {node.valid_until && <div class="node-info"><strong>有效期至:</strong> {formatDate(node.valid_until)}</div>}
            <div class="node-info"><strong>当前状态:</strong> <span class={`node-status ${node.status}`}>{node.status === 'online' ? '在线' : '离线'}</span></div>
            {node.last_report_at && <div class="node-info"><strong>最后上报:</strong> {formatDate(node.last_report_at)}</div>}
            <div class="node-info"><strong>允许中转:</strong> {node.allow_relay ? '是' : '否'}</div>
            {node.tags && <div class="node-info"><strong>标签:</strong> {escapeHtml(node.tags)}</div>}
            {node.notes && <div class="node-info"><strong>备注:</strong> {escapeHtml(node.notes)}</div>}
          </div>

          {node.connections && node.connections.length > 0 && (
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '10px', color: '#667eea' }}>连接方式</h3>
              {node.connections.map((conn, idx) => (
                <div class="node-info" style={{ background: 'white', padding: '8px', margin: '5px 0', borderRadius: '4px' }}>
                  <strong>连接 {idx + 1}:</strong> {conn.type} - {conn.ip}:{conn.port}
                </div>
              ))}
            </div>
          )}

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '10px', color: '#667eea' }}>带宽与流量</h3>
            <div class="node-info"><strong>当前带宽:</strong> {(node.current_bandwidth || 0).toFixed(2)} Mbps</div>
            <div class="node-info"><strong>阶梯带宽:</strong> {(node.tier_bandwidth || 0).toFixed(2)} Mbps</div>
            <div class="node-info"><strong>最大带宽:</strong> {(node.max_bandwidth || 0).toFixed(2)} Mbps</div>
            <div class="node-info"><strong>已用流量:</strong> {(node.used_traffic || 0).toFixed(2)} GB</div>
            <div class="node-info"><strong>修正流量:</strong> {(node.correction_traffic || 0).toFixed(2)} GB</div>
            <div class="node-info"><strong>上报流量:</strong> {((node.used_traffic || 0) - (node.correction_traffic || 0)).toFixed(2)} GB</div>
            <div class="node-info"><strong>最大流量:</strong> {(node.max_traffic || 0).toFixed(2)} GB</div>
            <div class="node-info"><strong>重置周期:</strong> {node.reset_cycle || 0} 天</div>
            {node.reset_date && <div class="node-info"><strong>下次重置:</strong> {formatDate(node.reset_date)}</div>}
          </div>

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '10px', color: '#667eea' }}>连接信息</h3>
            <div class="node-info"><strong>当前连接数:</strong> {node.connection_count}</div>
            <div class="node-info"><strong>最大连接数:</strong> {node.max_connections}</div>
          </div>

          {node.report_token && (
            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffc107' }}>
              <h3 style={{ marginBottom: '10px', color: '#856404' }}>上报Token</h3>
              <div style={{ background: 'white', padding: '12px', borderRadius: '4px', margin: '10px 0' }}>
                <code style={{ fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', color: '#333' }}>
                  {node.report_token}
                </code>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button class="btn-small" onclick={() => {
                  navigator.clipboard.writeText(node.report_token || '');
                  alert('Token已复制到剪贴板');
                }}>复制Token</button>
                <button class="btn-small" onclick={() => {
                  if (confirm('确定要重新生成Token吗？旧Token将失效！')) {
                    // 这里需要调用API重新生成Token
                  }
                }}>重新生成Token</button>
              </div>
              <small style={{ color: '#856404', display: 'block', marginTop: '10px' }}>
                ⚠️ Token用于节点上报数据，请妥善保管。重新生成后旧Token将失效。
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
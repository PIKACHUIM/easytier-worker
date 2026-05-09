import {jsxRenderer} from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({children}) => {
    return (
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>EasyTier 节点管理系统</title>
            <link rel="preconnect" href="https://fonts.googleapis.com"/>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Mono+CJK+SC:wght@300;400;500;700&family=Noto+Sans+SC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
            <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
            <style dangerouslySetInnerHTML={{
                __html: `
/* ===== CSS 变量 / Design Tokens ===== */
:root {
  /* 主色调 - 深邃蓝紫 */
  --primary: #4f46e5;
  --primary-light: #6366f1;
  --primary-dark: #3730a3;
  --primary-50: #eef2ff;
  --primary-100: #e0e7ff;
  --primary-200: #c7d2fe;
  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  --primary-700: #4338ca;

  /* 辅助色 */
  --success: #10b981;
  --success-light: #d1fae5;
  --success-dark: #059669;
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --danger: #ef4444;
  --danger-light: #fee2e2;
  --info: #3b82f6;
  --info-light: #dbeafe;

  /* 中性色 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* 背景 */
  --bg-primary: #0f0f23;
  --bg-secondary: #1a1a3e;
  --bg-card: rgba(255, 255, 255, 0.05);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --bg-glass: rgba(255, 255, 255, 0.07);
  --bg-glass-border: rgba(255, 255, 255, 0.12);

  /* 文字 */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-inverse: #0f172a;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.4), 0 10px 10px rgba(0,0,0,0.2);
  --shadow-glow: 0 0 20px rgba(79, 70, 229, 0.4);
  --shadow-glow-success: 0 0 20px rgba(16, 185, 129, 0.4);

  /* 圆角 */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* 过渡 */
  --transition-fast: 0.15s ease;
  --transition-base: 0.25s ease;
  --transition-slow: 0.4s ease;

  /* 字体 */
  --font-sans: 'Noto Sans SC', 'Noto Sans Mono CJK SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Noto Sans Mono CJK SC', 'JetBrains Mono', 'Fira Code', monospace;

  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}

/* ===== 亮色主题 ===== */
[data-theme="light"] {
  --bg-primary: #f0f4ff;
  --bg-secondary: #e8eeff;
  --bg-card: rgba(255, 255, 255, 0.85);
  --bg-card-hover: rgba(255, 255, 255, 0.95);
  --bg-glass: rgba(255, 255, 255, 0.75);
  --bg-glass-border: rgba(79, 70, 229, 0.15);
  --text-primary: #1e1b4b;
  --text-secondary: #4338ca;
  --text-muted: #6366f1;
  --text-inverse: #f1f5f9;
  --shadow-sm: 0 1px 3px rgba(79,70,229,0.1), 0 1px 2px rgba(79,70,229,0.08);
  --shadow-md: 0 4px 6px rgba(79,70,229,0.12), 0 2px 4px rgba(79,70,229,0.08);
  --shadow-lg: 0 10px 15px rgba(79,70,229,0.12), 0 4px 6px rgba(79,70,229,0.08);
  --shadow-xl: 0 20px 25px rgba(79,70,229,0.15), 0 10px 10px rgba(79,70,229,0.08);
  --shadow-glow: 0 0 20px rgba(79, 70, 229, 0.2);
}

[data-theme="light"] body {
  color: var(--text-primary);
  background: var(--bg-primary);
}

[data-theme="light"] body::before {
  background:
    radial-gradient(ellipse 80% 50% at 20% -20%, rgba(99, 102, 241, 0.12) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 110%, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
    linear-gradient(180deg, #f0f4ff 0%, #e8eeff 100%);
}

[data-theme="light"] .header {
  background: rgba(240, 244, 255, 0.9);
  border-bottom-color: rgba(79, 70, 229, 0.15);
}

[data-theme="light"] .modal-content {
  background: #f5f7ff;
}

[data-theme="light"] .form-group input,
[data-theme="light"] .form-group select,
[data-theme="light"] .form-group textarea {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(79, 70, 229, 0.2);
  color: var(--text-primary);
}

[data-theme="light"] .form-group input::placeholder,
[data-theme="light"] .form-group textarea::placeholder {
  color: #a5b4fc;
}

[data-theme="light"] .form-group select option {
  background: #f0f4ff;
  color: #1e1b4b;
}

[data-theme="light"] .nodes-table th {
  background: rgba(79, 70, 229, 0.06);
  color: #4338ca;
}

[data-theme="light"] .nodes-table td {
  color: #1e1b4b;
  border-bottom-color: rgba(79, 70, 229, 0.06);
}

[data-theme="light"] .nodes-table tbody tr:hover {
  background: rgba(99, 102, 241, 0.05);
}

[data-theme="light"] .progress-container {
  background: rgba(79, 70, 229, 0.1);
}

[data-theme="light"] .progress-text {
  color: #6366f1;
}

[data-theme="light"] .auth-card {
  background: rgba(255, 255, 255, 0.9);
}

[data-theme="light"] .settings-section {
  background: rgba(255, 255, 255, 0.8);
}

[data-theme="light"] .node-card-view {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(79, 70, 229, 0.15);
}

[data-theme="light"] .stat-card-new {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(79, 70, 229, 0.15);
}

[data-theme="light"] .hero h2 {
  color: #1e1b4b;
}

[data-theme="light"] .hero p {
  color: #4338ca;
}

[data-theme="light"] .section-title {
  color: #1e1b4b;
}

[data-theme="light"] .footer {
  border-top-color: rgba(79, 70, 229, 0.15);
  color: #6366f1;
}

[data-theme="light"] .node-metric {
  background: rgba(79, 70, 229, 0.05);
  border-color: rgba(79, 70, 229, 0.1);
}

[data-theme="light"] .stat-bar {
  opacity: 0.8;
}

/* ===== 全局重置 ===== */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans);
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* 背景装饰 */
body::before {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(ellipse 80% 50% at 20% -20%, rgba(79, 70, 229, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99, 102, 241, 0.1) 0%, transparent 60%),
    linear-gradient(180deg, #0f0f23 0%, #0d0d1f 100%);
  pointer-events: none;
  z-index: 0;
}

body > * {
  position: relative;
  z-index: 1;
}

/* ===== 布局容器 ===== */
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 2400px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  width: 100%;
}

/* ===== 导航栏 ===== */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 15, 35, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--bg-glass-border);
  padding: var(--space-4) 0;
  transition: all var(--transition-base);
}

.header-inner {
  max-width: 2400px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  flex-shrink: 0;
}

.header-brand-logo {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: var(--shadow-glow);
}

.header-brand-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.header-brand-text span {
  color: var(--primary-light);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
  border: 1px solid transparent;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-glass);
  border-color: var(--bg-glass-border);
}

.nav-link.active {
  color: var(--primary-light);
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

#home-link { color: var(--primary-light); }
#home-link:hover { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.3); }

#dashboard-link { color: var(--success); }
#dashboard-link:hover { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }

#token-link { color: var(--success); }
#token-link:hover { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }

#admin-link { color: var(--warning); }
#admin-link:hover { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }

#settings-link { color: var(--warning); }
#settings-link:hover { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }

#login-link, #api-docs-link { color: var(--info); }
#login-link:hover, #api-docs-link:hover { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }

#logout-link { color: var(--danger); }
#logout-link:hover { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }

/* 语言切换按钮 */
.lang-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-full);
  cursor: pointer;
}

.lang-btn {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.lang-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

/* ===== 主内容区 ===== */
.main-content {
  flex: 1;
  padding: var(--space-8) 0;
}

/* ===== 卡片 ===== */
.card {
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all var(--transition-base);
  backdrop-filter: blur(10px);
}

.card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--bg-glass-border);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}

.stat-card-item {
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  align-items: stretch;
  gap: var(--space-4);
  transition: all var(--transition-base);
  backdrop-filter: blur(10px);
  overflow: hidden;
  position: relative;
}

.stat-card-item::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  opacity: 0;
  transition: opacity var(--transition-base);
}

.stat-card-item:hover::before {
  opacity: 1;
}

.stat-card-item:hover {
  background: var(--bg-card-hover);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: var(--shadow-glow);
  transform: translateY(-3px);
}

.stat-card-content-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.stat-chart-top {
  display: flex;
  justify-content: center;
}

.stat-info-bottom {
  text-align: center;
}

.stat-info-bottom h3 {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-1);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.stat-trend-side {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

/* ===== Hero 区域 ===== */
.hero {
  text-align: center;
  padding: var(--space-12) 0 var(--space-10);
  position: relative;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 16px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  color: var(--primary-light);
  margin-bottom: var(--space-5);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.hero h2 {
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.hero h2 .gradient-text {
  background: linear-gradient(135deg, var(--primary-light), #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero p {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ===== 节点列表 ===== */
.nodes-list {
  margin-top: var(--space-8);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
  gap: var(--space-3);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, var(--primary), var(--primary-light));
  border-radius: var(--radius-full);
}

/* ===== 表格 ===== */
.nodes-table-container {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--bg-glass-border);
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
}

.nodes-table, .users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.nodes-table th, .users-table th {
  padding: 14px 16px;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--bg-glass-border);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.nodes-table td, .users-table td {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  vertical-align: middle;
}

.nodes-table tbody tr:hover, .users-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.04);
}

.nodes-table tbody tr:last-child td,
.users-table tbody tr:last-child td {
  border-bottom: none;
}

/* 节点状态标签 */
.node-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.node-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.node-status.online {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.node-status.online::before {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
  animation: pulse-dot 2s infinite;
}

.node-status.offline {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.node-status.offline::before {
  background: var(--danger);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ===== 进度条 ===== */
.progress-container {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s ease, background-color 0.3s ease;
  min-width: 2px;
}

.progress-text {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
  font-family: var(--font-mono);
}

/* ===== 按钮 ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
  font-family: var(--font-sans);
}

.btn-primary, button[type="submit"], .btn-primary-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.btn-primary:hover, button[type="submit"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
  filter: brightness(1.05);
}

.btn-primary:active, button[type="submit"]:active {
  transform: translateY(0);
}

.btn-secondary {
  background: var(--bg-glass);
  color: var(--text-primary);
  border: 1px solid var(--bg-glass-border);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  text-decoration: none;
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-small {
  padding: 5px 12px;
  font-size: 12px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: rgba(99, 102, 241, 0.2);
  color: var(--primary-light);
  border: 1px solid rgba(99, 102, 241, 0.3);
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
  font-weight: 500;
}

.btn-small:hover {
  background: rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.5);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15) !important;
  color: var(--danger) !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.25) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
}

/* ===== 表单 ===== */
.form-group {
  margin-bottom: var(--space-5);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
  outline: none;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-muted);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary);
  background: rgba(79, 70, 229, 0.08);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.form-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.form-group select option {
  background: #1a1a3e;
  color: var(--text-primary);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group small {
  display: block;
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.form-group small a {
  color: var(--primary-light);
  text-decoration: none;
}

.form-group small a:hover {
  text-decoration: underline;
}

/* ===== 认证表单 ===== */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  position: relative;
}

.auth-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  width: 100%;
  max-width: 440px;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-xl);
  position: relative;
  overflow: hidden;
}

.auth-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light), #a78bfa);
}

.auth-logo {
  text-align: center;
  margin-bottom: var(--space-8);
}

.auth-logo-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto var(--space-4);
  box-shadow: var(--shadow-glow);
}

.auth-logo h1 {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin-bottom: var(--space-1);
}

.auth-logo p {
  font-size: 14px;
  color: var(--text-secondary);
}

.auth-form {
  max-width: 440px;
  margin: 0 auto;
}

.auth-form h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  text-align: center;
}

.auth-links {
  text-align: center;
  margin-top: var(--space-5);
  font-size: 14px;
  color: var(--text-secondary);
}

.auth-links a {
  color: var(--primary-light);
  text-decoration: none;
  font-weight: 500;
}

.auth-links a:hover {
  text-decoration: underline;
}

/* ===== 模态框 ===== */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0; top: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  overflow-y: auto;
}

.modal-content {
  background: #1a1a3e;
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  width: 100%;
  max-width: 700px;
  position: relative;
  box-shadow: var(--shadow-xl);
  animation: modal-in 0.25s ease;
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(-20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-content h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--bg-glass-border);
}

.close {
  position: absolute;
  right: var(--space-5);
  top: var(--space-5);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: transparent;
  border: none;
  line-height: 1;
}

.close:hover {
  color: var(--text-primary);
  background: var(--bg-glass);
}

/* ===== 消息提示 ===== */
#message, #login-message, #register-message, #reset-message {
  margin-bottom: var(--space-4);
}

.success, .alert-success {
  padding: 12px 16px;
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-md);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.error, .alert-error {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* ===== 设置页面 ===== */
.settings-section {
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  margin-bottom: var(--space-6);
  backdrop-filter: blur(10px);
}

.settings-section h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--bg-glass-border);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.settings-section h2::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, var(--primary), var(--primary-light));
  border-radius: var(--radius-full);
}

.settings-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary-light);
  margin: var(--space-6) 0 var(--space-4);
}

/* ===== 仪表板 ===== */
.dashboard-header {
  margin-bottom: var(--space-6);
}

.dashboard-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

/* ===== 开关 ===== */
.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.toggle-switch input[type="checkbox"] {
  width: 36px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary);
}

/* ===== 统计行 ===== */
.stats-row {
  background: rgba(99, 102, 241, 0.08) !important;
  font-weight: 600;
}

/* ===== 页脚 ===== */
.footer {
  padding: var(--space-8) 0;
  border-top: 1px solid var(--bg-glass-border);
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 2;
}

.footer a {
  color: var(--primary-light);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer a:hover {
  color: var(--text-primary);
}

/* ===== 主内容卡片 ===== */
.main {
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  backdrop-filter: blur(10px);
  margin-bottom: var(--space-6);
}

/* ===== 信息提示框 ===== */
.info-box {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-5);
  font-size: 14px;
  color: var(--text-secondary);
}

.info-box.warning {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.2);
}

/* ===== 徽章 ===== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
}

.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

/* ===== 分隔线 ===== */
hr {
  border: none;
  height: 1px;
  background: var(--bg-glass-border);
  margin: var(--space-8) 0;
}

/* ===== 节点卡片网格 ===== */
.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-5);
}

.node-card {
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: all var(--transition-base);
}

.node-card:hover {
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

/* ===== 节点卡片视图 ===== */
.node-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-5);
}

.node-card-view {
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: all var(--transition-base);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  cursor: default;
}

.node-card-view::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  opacity: 0;
  transition: opacity var(--transition-base);
}

.node-card-view.online-card::before {
  background: linear-gradient(90deg, var(--success), #34d399);
  opacity: 1;
}

.node-card-view.offline-card::before {
  background: linear-gradient(90deg, var(--danger), #f87171);
  opacity: 1;
}

.node-card-view:hover {
  background: var(--bg-card-hover);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}

.node-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.node-card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
  line-height: 1.3;
}

.node-card-region {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.node-card-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.node-metric {
  text-align: center;
  padding: var(--space-3);
  background: rgba(255,255,255,0.04);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.06);
}

.node-metric-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
  font-weight: 600;
}

.node-metric-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.node-card-progress {
  margin-bottom: var(--space-3);
}

.node-card-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.node-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--bg-glass-border);
  gap: var(--space-2);
  flex-wrap: wrap;
}

.node-card-conn {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* ===== 视图切换按钮 ===== */
.view-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-md);
}

.view-btn {
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--text-muted);
  transition: all var(--transition-fast);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.view-btn:hover:not(.active) {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

/* ===== 新统计卡片 ===== */
.stats-grid-new {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}

.stat-card-new {
  background: var(--bg-glass);
  border: 1px solid var(--bg-glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all var(--transition-base);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.stat-card-new::after {
  content: '';
  position: absolute;
  bottom: -30px;
  right: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.06;
  transition: all var(--transition-slow);
}

.stat-card-new:hover::after {
  opacity: 0.12;
  transform: scale(1.2);
}

.stat-card-new:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.stat-card-new.nodes-stat::after { background: var(--success); }
.stat-card-new.connections-stat::after { background: var(--info); }
.stat-card-new.bandwidth-stat::after { background: var(--warning); }

.stat-card-new.nodes-stat { border-top: 3px solid var(--success); }
.stat-card-new.connections-stat { border-top: 3px solid var(--info); }
.stat-card-new.bandwidth-stat { border-top: 3px solid var(--warning); }

.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.stat-card-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-card-icon.green { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.25); }
.stat-card-icon.blue { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.25); }
.stat-card-icon.amber { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.25); }

.stat-card-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-2);
}

.stat-card-number {
  font-size: 36px;
  font-weight: 800;
  color: var(--text-primary);
  font-family: var(--font-mono);
  line-height: 1;
  margin-bottom: var(--space-1);
  letter-spacing: -0.02em;
}

.stat-card-sub {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-card-chart {
  margin-top: var(--space-4);
  height: 200px;
  position: relative;
}

.stat-card-bar-row {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 100%;
}

.stat-bar {
  flex: 1;
  border-radius: 3px 3px 0 0;
  transition: height 0.5s ease, opacity 0.3s ease;
  min-height: 4px;
  opacity: 0.7;
}

.stat-bar:hover {
  opacity: 1;
}

.stat-card-donut {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.stat-donut-canvas {
  flex-shrink: 0;
}

.stat-donut-legend {
  flex: 1;
  min-width: 0;
}

.stat-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-legend-val {
  margin-left: auto;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 12px;
}

@media (max-width: 900px) {
  .stats-grid-new {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .node-cards-grid {
    grid-template-columns: 1fr;
  }
  .node-card-metrics {
    grid-template-columns: 1fr 1fr;
  }
}

/* ===== 加载动画 ===== */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.4s ease forwards;
}

.fade-in-up {
  animation: fadeInUp 0.5s ease forwards;
}

/* ===== 图表文字 ===== */
.chart-text {
  text-align: center;
  margin-top: var(--space-2);
  font-size: 12px;
  color: var(--text-secondary);
}

.donut-container {
  max-width: 300px;
  width: 100%;
  margin: 0 auto;
}

/* ===== 测试结果 ===== */
.test-result {
  margin-top: var(--space-2);
  font-size: 13px;
}

/* ===== 公共统计 ===== */
#public-stats {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: 14px;
  color: var(--text-secondary);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .header-inner {
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .header-nav {
    width: 100%;
    justify-content: flex-start;
    gap: var(--space-1);
  }

  .nav-link {
    padding: 5px 10px;
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card-item {
    flex-direction: column;
  }

  .stat-trend-side {
    width: 100%;
  }

  .main {
    padding: var(--space-5);
  }

  .auth-card {
    padding: var(--space-6);
  }

  .modal-content {
    padding: var(--space-5);
  }

  .dashboard-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .nodes-table th,
  .nodes-table td {
    padding: 8px 10px;
    font-size: 12px;
  }

  .btn-small {
    display: block;
    margin: 3px 0;
    width: 100%;
    text-align: center;
  }

  .settings-section {
    padding: var(--space-5);
  }

  .hero h2 {
    font-size: 28px;
  }

  .hero p {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 var(--space-4);
  }

  .header-inner {
    padding: 0 var(--space-4);
  }
}
                `
            }}/>
            <script dangerouslySetInnerHTML={{
                __html: `
/* ===== 主题切换系统 ===== */
(function() {
  function getTheme() {
    var saved = localStorage.getItem('theme');
    if (saved) return saved;
    // 跟随浏览器设置，无法检测时默认 light
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? '切换到白天模式' : '切换到夜晚模式';
    }
  }

  window.toggleTheme = function() {
    var current = getTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  // 立即应用（避免闪烁）
  var theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);

  document.addEventListener('DOMContentLoaded', function() {
    applyTheme(getTheme());
  });
})();

/* ===== 多语言系统 ===== */
(function() {
  // 语言包
  var LANGS = {
    zh: {
      nav: { publicNodes: '公共节点', myNodes: '我的节点', profile: '个人设置', adminPanel: '管理面板', systemSettings: '系统设置', login: '登录', logout: '退出', apiDocs: 'API文档' },
      table: { nodeName: '节点名称', status: '状态', region: '地域', bandwidth: '带宽', connections: '连接数', traffic: '流量', connectionInfo: '连接信息', relay: '中转', nodeStatus: '节点状态', userEmail: '用户邮箱', tags: '标签', notes: '备注', actions: '操作', online: '在线', offline: '离线', domestic: '大陆', overseas: '海外', unlimited: '无限制' },
    },
    en: {
      nav: { publicNodes: 'Public Nodes', myNodes: 'My Nodes', profile: 'Profile', adminPanel: 'Admin Panel', systemSettings: 'System Settings', login: 'Login', logout: 'Logout', apiDocs: 'API Docs' },
      table: { nodeName: 'Node Name', status: 'Status', region: 'Region', bandwidth: 'Bandwidth', connections: 'Connections', traffic: 'Traffic', connectionInfo: 'Connection Info', relay: 'Relay', nodeStatus: 'Node Status', userEmail: 'User Email', tags: 'Tags', notes: 'Notes', actions: 'Actions', online: 'Online', offline: 'Offline', domestic: 'Domestic', overseas: 'Overseas', unlimited: 'Unlimited' },
    }
  };

  // 获取当前语言
  function getLang() {
    return localStorage.getItem('lang') || 'zh';
  }

  // 设置语言
  window.setLang = function(lang) {
    localStorage.setItem('lang', lang);
    applyLang(lang);
    // 更新按钮状态
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  };

  // 应用语言
  function applyLang(lang) {
    var t = LANGS[lang] || LANGS.zh;
    // 更新导航
    var navMap = {
      'home-link': t.nav.publicNodes,
      'dashboard-link': t.nav.myNodes,
      'token-link': t.nav.profile,
      'admin-link': t.nav.adminPanel,
      'settings-link': t.nav.systemSettings,
      'login-link': t.nav.login,
      'logout-link': t.nav.logout,
      'api-docs-link': t.nav.apiDocs,
    };
    Object.keys(navMap).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = navMap[id];
    });
    // 存储翻译供JS使用
    window._t = t;
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', function() {
    var lang = getLang();
    applyLang(lang);
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  });

  // 暴露翻译函数
  window.getLang = getLang;
  window._t = LANGS[getLang()];
})();

/* ===== 全局工具函数 ===== */
window.escapeHtml = function(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 渲染节点卡片视图
window.renderNodeCards = function(mode, nodes) {
  var cardView = document.getElementById(mode + '-card-view');
  if (!cardView) return;

  var t = (window._t && window._t.table) || {};
  var onlineText = t.online || '在线';
  var offlineText = t.offline || '离线';
  var domesticText = t.domestic || '大陆';
  var overseasText = t.overseas || '海外';

  if (!nodes || nodes.length === 0) {
    cardView.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">暂无节点数据</div>';
    return;
  }

  var html = nodes.map(function(node) {
    var isAlwaysOnline = node.always_online === 1;
    var isOnline = node.status === 'online' || isAlwaysOnline;
    var statusClass = isOnline ? 'online-card' : 'offline-card';
    var statusText = isOnline ? onlineText : offlineText;
    var regionText = node.region_type === 'domestic' ? domesticText : overseasText;

    var currentBandwidth = Number(node.current_bandwidth || 0);
    var maxBandwidth = Number(node.max_bandwidth || 0);
    var bandwidthPct = maxBandwidth > 0 ? Math.min(currentBandwidth / maxBandwidth * 100, 100) : 0;
    var bandwidthColor = bandwidthPct < 40 ? '#10b981' : (bandwidthPct < 70 ? '#3b82f6' : (bandwidthPct < 90 ? '#f59e0b' : '#ef4444'));

    var connectionCount = Number(node.connection_count || 0);
    var maxConnections = Number(node.max_connections || 0);
    var connPct = maxConnections > 0 ? Math.min(connectionCount / maxConnections * 100, 100) : 0;
    var connColor = connPct < 40 ? '#10b981' : (connPct < 70 ? '#3b82f6' : (connPct < 90 ? '#f59e0b' : '#ef4444'));

    var usedTraffic = Number(node.used_traffic || 0);
    var maxTraffic = Number(node.max_traffic || 0);
    var trafficPct = maxTraffic > 0 ? Math.min(usedTraffic / maxTraffic * 100, 100) : 0;
    var trafficColor = trafficPct < 40 ? '#10b981' : (trafficPct < 70 ? '#3b82f6' : (trafficPct < 90 ? '#f59e0b' : '#ef4444'));

    var connectionInfo = '';
    if (node.connections && node.connections.length > 0) {
      connectionInfo = node.connections.map(function(c) {
        var connText = c.type + '://' + c.ip + ':' + c.port;
        var icon = c.type === 'TCP' ? '🔗' : (c.type === 'UDP' ? '⚡' : (c.type === 'WS' ? '🌐' : (c.type === 'WSS' ? '🔒' : (c.type === 'WG' ? '🛡️' : '🔌'))));
        var color = c.type === 'TCP' ? '#1976d2' : (c.type === 'UDP' ? '#7b1fa2' : (c.type === 'WS' ? '#f57c00' : (c.type === 'WSS' ? '#388e3c' : (c.type === 'WG' ? '#c2185b' : '#616161'))));
        var bg = c.type === 'TCP' ? '#e3f2fd' : (c.type === 'UDP' ? '#f3e5f5' : (c.type === 'WS' ? '#fff3e0' : (c.type === 'WSS' ? '#e8f5e8' : (c.type === 'WG' ? '#fce4ec' : '#f5f5f5'))));
        var border = c.type === 'TCP' ? '#2196f3' : (c.type === 'UDP' ? '#9c27b0' : (c.type === 'WS' ? '#ff9800' : (c.type === 'WSS' ? '#4caf50' : (c.type === 'WG' ? '#e91e63' : '#9e9e9e'))));
        return '<span style="display:block;padding:4px 8px;margin:2px 0;background:' + bg + ';border:1px solid ' + border + ';border-radius:5px;color:' + color + ';font-size:11px;font-family:monospace;font-weight:600;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity 0.2s;" ' +
          'data-conn="' + connText.replace(/"/g, '&quot;') + '" ' +
          'onclick="window.copyToClipboard && window.copyToClipboard(this.dataset.conn, this)" ' +
          'title="点击复制: ' + connText + '">' +
          '<span style="margin-right:3px;">' + icon + '</span>' + connText +
          '</span>';
      }).join('');
    } else {
      connectionInfo = '<span style="color:#999;font-style:italic;font-size:11px;">暂无连接地址</span>';
    }

    var actionsHtml = '';
    if (mode === 'dashboard') {
      actionsHtml = '<div class="node-card-actions">' +
        '<button class="btn-small" onclick="viewNodeDetail(' + node.id + ')" style="padding:4px 8px;font-size:11px;">详情</button>' +
        '<button class="btn-small" onclick="editNode(' + node.id + ')" style="padding:4px 8px;font-size:11px;">编辑</button>' +
        '<button class="btn-small btn-danger" onclick="deleteNode(' + node.id + ')" style="padding:4px 8px;font-size:11px;">删除</button>' +
      '</div>';
    } else if (mode === 'admin') {
      actionsHtml = '<div class="node-card-actions">' +
        '<button class="btn-small" onclick="viewAdminNodeDetail(' + node.id + ')" style="padding:4px 8px;font-size:11px;">详情</button>' +
        '<button class="btn-small" onclick="editAdminNode(' + node.id + ')" style="padding:4px 8px;font-size:11px;">编辑</button>' +
        '<button class="btn-small btn-danger" onclick="deleteAdminNode(' + node.id + ')" style="padding:4px 8px;font-size:11px;">删除</button>' +
      '</div>';
    }

    // 中转标签
    var relayBadge = node.allow_relay
      ? '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);border:1px solid #6ee7b7;border-radius:20px;color:#065f46;font-size:10px;font-weight:600;">🔀 支持中转</span>'
      : '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.1);border-radius:20px;color:var(--text-muted);font-size:10px;">🚫 不中转</span>';

    // 总是在线标签
    var alwaysOnlineBadge = isAlwaysOnline
      ? '<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;background:linear-gradient(135deg,#dbeafe,#bfdbfe);border:1px solid #93c5fd;border-radius:20px;color:#1e40af;font-size:10px;font-weight:600;">📌 总是在线</span>'
      : '';

    // 标签
    var tagsHtml = '';
    if (node.tags && node.tags.trim()) {
      var tagList = node.tags.split(',').map(function(tag) { return tag.trim(); }).filter(function(t) { return t; });
      tagsHtml = tagList.map(function(tag) {
        return '<span style="display:inline-block;padding:1px 7px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:20px;color:#6366f1;font-size:10px;font-weight:500;">' + window.escapeHtml(tag) + '</span>';
      }).join(' ');
    }

    // 备注
    var notesHtml = (node.notes && node.notes.trim())
      ? '<div style="padding:6px 0;border-top:1px solid var(--bg-glass-border);display:flex;align-items:flex-start;gap:6px;">' +
          '<span style="font-size:11px;color:var(--text-muted);flex-shrink:0;margin-top:1px;">💬</span>' +
          '<span style="font-size:11px;color:var(--text-secondary);line-height:1.5;word-break:break-all;">' + window.escapeHtml(node.notes) + '</span>' +
        '</div>'
      : '';

    return '<div class="node-card-view ' + statusClass + ' fade-in">' +
      '<div class="node-card-header">' +
        '<div style="flex:1;min-width:0;">' +
          '<div class="node-card-name">' + window.escapeHtml(node.node_name) + '</div>' +
          '<div class="node-card-region" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px;">📍 ' + regionText + (node.region_detail ? ' · ' + window.escapeHtml(node.region_detail) : '') + (tagsHtml ? '<span style="display:inline-flex;gap:4px;flex-wrap:wrap;margin-left:2px;">' + tagsHtml + '</span>' : '') + '<span style="margin-left:2px;">' + relayBadge + '</span>' + (alwaysOnlineBadge ? '<span style="margin-left:2px;">' + alwaysOnlineBadge + '</span>' : '') + '</div>' +
        '</div>' +
        '<span class="node-status ' + (isOnline ? 'online' : 'offline') + '">' + statusText + '</span>' +
      '</div>' +
      '<div class="node-card-metrics">' +
        '<div class="node-metric">' +
          '<div class="node-metric-label">带宽</div>' +
          '<div class="node-metric-value" style="color:' + bandwidthColor + ';">' + currentBandwidth.toFixed(1) + '</div>' +
          '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">/ ' + maxBandwidth + ' Mbps</div>' +
        '</div>' +
        '<div class="node-metric">' +
          '<div class="node-metric-label">连接</div>' +
          '<div class="node-metric-value" style="color:' + connColor + ';">' + connectionCount + '</div>' +
          '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">/ ' + maxConnections + '</div>' +
        '</div>' +
        '<div class="node-metric">' +
          '<div class="node-metric-label">流量</div>' +
          '<div class="node-metric-value" style="color:' + trafficColor + ';">' + usedTraffic.toFixed(1) + '</div>' +
          '<div style="font-size:9px;color:var(--text-muted);margin-top:2px;">/ ' + (maxTraffic === 0 ? '∞' : maxTraffic) + ' GB</div>' +
        '</div>' +
      '</div>' +
      '<div class="node-card-progress">' +
        '<div class="node-card-progress-label"><span>带宽使用</span><span style="color:' + bandwidthColor + ';">' + bandwidthPct.toFixed(0) + '%</span></div>' +
        '<div class="progress-container"><div class="progress-bar" style="width:' + bandwidthPct + '%;background:' + bandwidthColor + ';"></div></div>' +
      '</div>' +
      '<div class="node-card-progress">' +
        '<div class="node-card-progress-label"><span>连接使用</span><span style="color:' + connColor + ';">' + connPct.toFixed(0) + '%</span></div>' +
        '<div class="progress-container"><div class="progress-bar" style="width:' + connPct + '%;background:' + connColor + ';"></div></div>' +
      '</div>' +
      '<div class="node-card-progress">' +
        '<div class="node-card-progress-label"><span>流量使用</span><span style="color:' + trafficColor + ';">' + trafficPct.toFixed(0) + '%</span></div>' +
        '<div class="progress-container"><div class="progress-bar" style="width:' + trafficPct + '%;background:' + trafficColor + ';"></div></div>' +
      '</div>' +
      '<div class="node-card-conn" style="padding:6px 0 4px;">' + connectionInfo + '</div>' +
      notesHtml +
      '<div class="node-card-footer">' +
        actionsHtml +
      '</div>' +
    '</div>';
  }).join('');

  cardView.innerHTML = html;
};

window.renderNodeRows = function(mode, nodes) {
  // 缓存节点数据供卡片视图使用
  if (!window._lastNodes) window._lastNodes = {};
  window._lastNodes[mode] = nodes;
  // 如果当前是卡片视图，同步渲染卡片
  var cardView = document.getElementById(mode + '-card-view');
  if (cardView && cardView.style.display !== 'none' && window.renderNodeCards) {
    window.renderNodeCards(mode, nodes);
  }

  var lang = window.getLang ? window.getLang() : 'zh';
  var t = (window._t && window._t.table) || {};
  var onlineText = t.online || '在线';
  var offlineText = t.offline || '离线';
  var domesticText = t.domestic || '大陆';
  var overseasText = t.overseas || '海外';
  var unlimitedText = t.unlimited || '无限制';

  return nodes.map(function(node) {
    var currentBandwidth = Number(node.current_bandwidth || 0);
    var maxBandwidth = Number(node.max_bandwidth || 0);
    var bandwidthUsage = maxBandwidth > 0 ? (currentBandwidth / maxBandwidth * 100) : 0;
    var bandwidthColor = bandwidthUsage < 40 ? '#10b981' : (bandwidthUsage < 60 ? '#3b82f6' : (bandwidthUsage < 80 ? '#f59e0b' : '#ef4444'));

    var usedTraffic = Number(node.used_traffic || 0);
    var maxTraffic = Number(node.max_traffic || 0);
    var trafficUsage = maxTraffic > 0 ? (usedTraffic / maxTraffic * 100) : 0;
    var trafficColor = trafficUsage < 40 ? '#10b981' : (trafficUsage < 60 ? '#3b82f6' : (trafficUsage < 80 ? '#f59e0b' : '#ef4444'));

    var connectionCount = Number(node.connection_count || 0);
    var maxConnections = Number(node.max_connections || 0);
    var connectionUsage = maxConnections > 0 ? (connectionCount / maxConnections * 100) : 0;
    var connectionColor = connectionUsage < 40 ? '#10b981' : (connectionUsage < 60 ? '#3b82f6' : (connectionUsage < 80 ? '#f59e0b' : '#ef4444'));

    var connectionInfo = '';
    if (node.connections && node.connections.length > 0) {
      connectionInfo = node.connections.map(function(conn) {
        var connText = conn.type + '://' + conn.ip + ':' + conn.port;
        var icon = conn.type === 'TCP' ? '🔗' : (conn.type === 'UDP' ? '📡' : (conn.type === 'WS' ? '🌐' : (conn.type === 'WSS' ? '🔒' : (conn.type === 'WG' ? '🛡️' : '🔌'))));
        var color = conn.type === 'TCP' ? '#1976d2' : (conn.type === 'UDP' ? '#7b1fa2' : (conn.type === 'WS' ? '#f57c00' : (conn.type === 'WSS' ? '#388e3c' : (conn.type === 'WG' ? '#c2185b' : '#616161'))));
        var bg = conn.type === 'TCP' ? '#e3f2fd' : (conn.type === 'UDP' ? '#f3e5f5' : (conn.type === 'WS' ? '#fff3e0' : (conn.type === 'WSS' ? '#e8f5e8' : (conn.type === 'WG' ? '#fce4ec' : '#f5f5f5'))));
        var border = conn.type === 'TCP' ? '#2196f3' : (conn.type === 'UDP' ? '#9c27b0' : (conn.type === 'WS' ? '#ff9800' : (conn.type === 'WSS' ? '#4caf50' : (conn.type === 'WG' ? '#e91e63' : '#9e9e9e'))));
        return '<span style="display:block;padding:4px 8px;margin:2px 0;background:' + bg + ';border:1px solid ' + border + ';border-radius:5px;color:' + color + ';font-size:11px;font-family:monospace;font-weight:600;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity 0.2s;" ' +
          'data-conn="' + connText.replace(/"/g, '&quot;') + '" ' +
          'onclick="window.copyToClipboard && window.copyToClipboard(this.dataset.conn, this)" ' +
          'title="点击复制: ' + connText + '">' +
          '<span style="margin-right:3px;">' + icon + '</span>' + connText +
          '</span>';
      }).join('');
    } else {
      connectionInfo = '<span style="color:#999;font-style:italic;font-size:11px;">暂无连接</span>';
    }

    var statusClass = (node.status === 'online' || node.always_online === 1) ? 'online' : 'offline';
    var statusText = (node.status === 'online' || node.always_online === 1) ? onlineText : offlineText;
    var regionText = node.region_type === 'domestic' ? domesticText : overseasText;

    var baseCols = '' +
      '<td style="text-align:left;font-weight:500;">' + window.escapeHtml(node.node_name) + '</td>' +
      '<td><span class="node-status ' + statusClass + '">' + statusText + '</span></td>' +
      '<td>' + regionText + ' - ' + window.escapeHtml(node.region_detail || '-') + '</td>' +
      '<td>' +
        '<div class="progress-container"><div class="progress-bar" style="width:' + Math.min(bandwidthUsage, 100) + '%;background:' + bandwidthColor + ';"></div></div>' +
        '<div class="progress-text">' + currentBandwidth.toFixed(2) + ' / ' + maxBandwidth.toFixed(2) + ' Mbps</div>' +
      '</td>' +
      '<td>' +
        '<div class="progress-container"><div class="progress-bar" style="width:' + Math.min(connectionUsage, 100) + '%;background:' + connectionColor + ';"></div></div>' +
        '<div class="progress-text">' + connectionCount + ' / ' + maxConnections + '</div>' +
      '</td>' +
      '<td>' +
        '<div class="progress-container"><div class="progress-bar" style="width:' + Math.min(trafficUsage, 100) + '%;background:' + trafficColor + ';"></div></div>' +
        '<div class="progress-text">' + usedTraffic.toFixed(2) + ' / ' + (maxTraffic === 0 ? unlimitedText : maxTraffic.toFixed(2) + ' GB') + '</div>' +
      '</td>' +
      '<td style="min-width:160px;">' + connectionInfo + '</td>' +
      '<td>' + (node.allow_relay ? '✓' : '—') + '</td>' +
      '<td>' + window.escapeHtml(node.tags || '-') + '</td>';

    var actionCol = '';
    if (mode === 'my') {
      actionCol = '<td>' +
        '<button class="btn-small" onclick="viewNodeDetail(' + node.id + ')" style="margin:2px;">详情</button>' +
        '<button class="btn-small" onclick="editNode(' + node.id + ')" style="margin:2px;">编辑</button>' +
        '<button class="btn-small btn-danger" onclick="deleteNode(' + node.id + ')" style="margin:2px;">删除</button>' +
      '</td>';
    }
    return '<tr class="fade-in">' + baseCols + (actionCol || '') + '</tr>';
  }).join('');
};
                `
            }}/>
        </head>
        <body>
        {children}
        <script dangerouslySetInnerHTML={{
            __html: `
(function() {
  function updateNav() {
    try {
      var token = localStorage.getItem('token');
      var userStr = localStorage.getItem('user');
      var user = null;
      if (userStr) { try { user = JSON.parse(userStr); } catch(e) { user = null; } }

      var loginLink = document.getElementById('login-link');
      var logoutLink = document.getElementById('logout-link');
      var dashboardLink = document.getElementById('dashboard-link');
      var tokenLink = document.getElementById('token-link');
      var adminLink = document.getElementById('admin-link');
      var settingsLink = document.getElementById('settings-link');

      if (loginLink) loginLink.style.display = token ? 'none' : 'inline-flex';
      if (logoutLink) logoutLink.style.display = token ? 'inline-flex' : 'none';
      if (dashboardLink) dashboardLink.style.display = token ? 'inline-flex' : 'none';
      if (tokenLink) tokenLink.style.display = token ? 'inline-flex' : 'none';

      var isAdmin = !!(user && (user.is_admin || user.is_super_admin));
      if (adminLink) adminLink.style.display = (token && isAdmin) ? 'inline-flex' : 'none';
      if (settingsLink) settingsLink.style.display = (token && isAdmin) ? 'inline-flex' : 'none';

      if (logoutLink && !logoutLink._bound) {
        logoutLink.addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          location.href = '/';
        });
        logoutLink._bound = true;
      }
    } catch(err) {
      console.error('导航初始化失败:', err);
    }
  }
  document.addEventListener('DOMContentLoaded', updateNav);
})();
            `
        }}/>
        </body>
        </html>
    )
})

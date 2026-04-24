/* =============================================================
   皖美信用 · 通用组件渲染库（V2）
   ============================================================= */
(function () {
    'use strict';

    const C = {};

    // ===== 工具函数 =====
    C.fmtTime = function (ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        const now = Date.now();
        const diff = now - ts;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
        if (diff < 7 * 86400000) return Math.floor(diff / 86400000) + ' 天前';
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    C.fmtDate = function (ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    C.fmtMoney = function (v, unit) {
        if (v === null || v === undefined) return '—';
        return Number(v).toLocaleString('zh-CN') + (unit || ' 万元');
    };
    C.escapeHtml = function (s) {
        if (!s) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    };

    // ===== 状态徽章 =====
    C.statusBadge = function (status) {
        const meta = window.WM_TICKET_STATUS[status];
        if (!meta) return `<span class="wm-status wm-status-draft">${status}</span>`;
        return `<span class="wm-status wm-status-${status}">${meta.label}</span>`;
    };

    // ===== 优先级标签 =====
    C.priorityTag = function (p) {
        if (!p || p === 'normal') return '';
        const labels = { urgent: '紧急', high: '高', low: '低' };
        return `<span class="wm-priority wm-priority-${p}">${labels[p] || p}</span>`;
    };

    // ===== 单据卡片 =====
    C.ticketCard = function (t, options) {
        options = options || {};
        const meta = window.WM_TICKET_TYPES[t.type];
        const color = meta ? meta.color : '#B8141A';
        const status = window.WM_TICKET_STATUS[t.status];
        const creator = window.WM_STORE.getUser(t.creator);
        const statusLabel = status ? status.label : t.status;
        return `
        <a href="ticket-detail.html?id=${t.id}" class="wm-ticket-card" style="--ticket-color:${color};--ticket-color-bg:${color}15;text-decoration:none;color:inherit;display:block;">
            <div class="flex items-start gap-3">
                <span class="tc-type-icon">${meta ? meta.icon : '📄'}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="tc-id">${t.id}</span>
                        <span class="wm-status wm-status-${t.status}">${statusLabel}</span>
                        ${C.priorityTag(t.priority)}
                    </div>
                    <div class="tc-title">${C.escapeHtml(t.title)}</div>
                    <div class="tc-meta">
                        <span>👤 ${creator ? creator.shortName : t.creatorName || '—'}</span>
                        ${t.amount ? `<span>💰 ${C.fmtMoney(t.amount)}</span>` : ''}
                        <span>🕐 ${C.fmtTime(t.updatedAt)}</span>
                        ${t.deadline && (t.deadline > Date.now()) ? `<span>⏰ ${C.fmtDate(t.deadline)} 前</span>` : ''}
                    </div>
                </div>
            </div>
        </a>`;
    };

    // ===== 待办项 =====
    C.todoItem = function (todo) {
        const color = todo.meta ? todo.meta.color : '#B8141A';
        const icon = todo.meta ? todo.meta.icon : '📋';
        const url = todo.url || (todo.ticketId ? `ticket-detail.html?id=${todo.ticketId}` : '#');
        const cls = 'wm-todo ' + (todo.priority === 'urgent' ? 'urgent' : todo.priority === 'high' ? 'high' : '');
        return `
        <a href="${url}" class="${cls}" style="text-decoration:none;color:inherit;--todo-color:${color};--todo-bg:${color}15;display:flex;">
            <div class="todo-icon">${icon}</div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-wm-secondary">${C.escapeHtml(todo.title)}</div>
                <div class="text-xs text-wm-gray3 mt-1 flex items-center gap-3">
                    ${C.priorityTag(todo.priority)}
                    ${todo.deadline ? `<span>⏰ ${C.fmtDate(todo.deadline)} 到期</span>` : ''}
                    ${todo.ticketId ? `<span class="font-mono">${todo.ticketId}</span>` : ''}
                </div>
            </div>
            <div class="text-wm-gray3 text-lg">›</div>
        </a>`;
    };

    // ===== 消息卡片 =====
    C.messageCard = function (m) {
        return `
        <div class="wm-msg ${m.read ? '' : 'unread'}" data-msg-id="${m.id}" ${m.relatedTicketId ? `data-ticket-id="${m.relatedTicketId}"` : ''}>
            <div class="msg-icon ${m.type}">${({
                approval: '📋', approval_request: '📋', alert: '🚨',
                progress: '⏳', supervise: '📣', daily_report: '📄',
            }[m.type] || 'ℹ')}</div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <span class="msg-title text-sm text-wm-secondary">${C.escapeHtml(m.title)}</span>
                    <span class="text-xs text-wm-gray3 font-mono">${C.fmtTime(m.ts)}</span>
                </div>
                <div class="text-xs text-wm-gray leading-relaxed">${C.escapeHtml(m.body)}</div>
                ${m.relatedTicketId ? `<a href="ticket-detail.html?id=${m.relatedTicketId}" class="text-xs text-wm-primary hover:underline mt-1 inline-block">查看单据 →</a>` : ''}
            </div>
        </div>`;
    };

    // ===== 时间线 =====
    C.timeline = function (items) {
        if (!items || !items.length) return `<div class="wm-empty"><div class="empty-icon">📜</div><div class="empty-desc">暂无记录</div></div>`;
        return `<div class="wm-timeline">${
            items.map(it => {
                const user = it.user === 'SYSTEM' ? { shortName: 'AI系统', avatarBg: '#C9A063' } : (window.WM_STORE.getUser(it.user) || { shortName: it.userName || '—' });
                return `<div class="tl-item ${it.type || ''}">
                    <div class="tl-time">${C.fmtTime(it.ts)}</div>
                    <div class="tl-action">${C.escapeHtml(it.action)}</div>
                    <div class="tl-user">— ${user.shortName}${it.comment ? ' · ' + C.escapeHtml(it.comment) : ''}</div>
                </div>`;
            }).join('')
        }</div>`;
    };

    // ===== 向导步骤 =====
    C.wizardSteps = function (steps, current) {
        return `<div class="wm-wizard-steps">${
            steps.map((s, i) => {
                const cls = i < current ? 'done' : (i === current ? 'active' : 'wait');
                return `<div class="wm-wizard-step ${cls}">
                    <div class="step-dot">${i < current ? '✓' : i + 1}</div>
                    <div class="step-label">${s}</div>
                </div>`;
            }).join('')
        }</div>`;
    };

    // ===== 用户角色顶部（for 已登录页面的 Topbar）=====
    C.userChip = function () {
        const u = window.WM_AUTH.currentUser();
        if (!u) return `<a href="login.html" class="wm-btn wm-btn-gold wm-btn-sm">登录</a>`;
        return `<div class="relative" id="wm-user-chip-wrap">
            <div class="wm-user-chip" id="wm-user-chip-trigger">
                <div class="uc-avatar" style="background:${u.avatarBg};">${u.avatar}</div>
                <div>
                    <div class="uc-name">${u.shortName} <span class="uc-role">· ${u.roleLabel}</span></div>
                </div>
            </div>
        </div>`;
    };

    // ===== 角色切换下拉（含个人中心 / 系统设置 / 帮助入口）=====
    C.renderRoleSwitcher = function () {
        const current = window.WM_AUTH.currentUser();
        const users = window.WM_USERS;
        return `<div class="wm-role-switcher" id="wm-role-switcher" style="display:none;">
            <div class="rs-header">账户与偏好</div>
            <a href="profile.html" class="rs-item" style="text-decoration:none;color:inherit;">
                <div class="rs-avatar" style="background:#0F2A56;">👤</div>
                <div class="rs-info">
                    <div class="rs-name">个人中心</div>
                    <div class="rs-role">账户信息 · 安全 · 日志</div>
                </div>
            </a>
            <a href="settings.html" class="rs-item" style="text-decoration:none;color:inherit;">
                <div class="rs-avatar" style="background:#1F4A8A;">⚙️</div>
                <div class="rs-info">
                    <div class="rs-name">系统设置</div>
                    <div class="rs-role">外观 · 通知 · 隐私</div>
                </div>
            </a>
            <a href="help.html" class="rs-item" style="text-decoration:none;color:inherit;">
                <div class="rs-avatar" style="background:#A8823E;">❓</div>
                <div class="rs-info">
                    <div class="rs-name">帮助中心</div>
                    <div class="rs-role">FAQ · 新手引导 · 反馈</div>
                </div>
            </a>
            <div class="rs-header" style="margin-top:8px;">切换角色 · 体验不同视角</div>
            ${users.map(u => `
                <div class="rs-item ${current && current.id === u.id ? 'current' : ''}" data-user-id="${u.id}">
                    <div class="rs-avatar" style="background:${u.avatarBg};">${u.avatar}</div>
                    <div class="rs-info">
                        <div class="rs-name">${u.shortName} · ${u.roleLabel}</div>
                        <div class="rs-role">${u.org}</div>
                    </div>
                </div>
            `).join('')}
            <div class="rs-item" id="wm-logout" style="color:#D64045;">
                <div class="rs-avatar" style="background:#D64045;">⎋</div>
                <div class="rs-info">
                    <div class="rs-name">退出登录</div>
                    <div class="rs-role">返回登录页</div>
                </div>
            </div>
        </div>`;
    };

    // ===== 已登录版 Topbar（替代 shared.js 的 renderTopbar）=====
    C.renderAuthTopbar = function (currentPage) {
        const user = window.WM_AUTH.currentUser();
        const unreadCount = user ? window.WM_STORE.getMessages(user.id).filter(m => !m.read).length : 0;
        const todosCount = user ? window.WM_TICKETS.myTodos().length : 0;

        return `
        <div class="wm-topbar">
            <div class="flex items-center justify-between px-8 py-3">
                <div class="flex items-center gap-4">
                    <a href="workbench.html" class="flex items-center gap-3 no-underline" style="color:inherit;">
                        <div class="brand-mark">皖</div>
                        <div>
                            <div class="brand-text">皖美信用</div>
                            <div class="brand-sub">ANHUI · WAN-MEI CREDIT · 国资国企智能平台</div>
                        </div>
                    </a>
                    <span class="wm-badge wm-badge-aaa ml-2" style="border-radius:2px;">V2.0 MVP</span>
                </div>
                <div class="flex items-center gap-5 text-sm">
                    <div class="flex items-center gap-1.5">
                        <span class="wm-light green wm-pulse"></span>
                        <span class="opacity-90">系统运行正常</span>
                    </div>
                    <div id="wm-clock" class="opacity-80 font-mono"></div>
                    <a href="todos.html" class="relative hover:text-wm-accent" title="待办" style="color:inherit;">
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                        ${todosCount > 0 ? `<span class="wm-badge-count" style="position:absolute;top:-6px;right:-8px;">${todosCount}</span>` : ''}
                    </a>
                    <a href="messages.html" class="relative hover:text-wm-accent" title="消息" style="color:inherit;">
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                        ${unreadCount > 0 ? `<span class="wm-badge-count" style="position:absolute;top:-6px;right:-8px;">${unreadCount}</span>` : ''}
                    </a>
                    ${C.userChip()}
                </div>
            </div>
            <div class="wm-navbar">
                <div class="flex px-6 items-stretch" id="wm-navbar-inner">
                    <a class="nav-item ${currentPage === 'workbench' ? 'active' : ''}" href="workbench.html">🏠 我的工作台</a>
                    <a class="nav-item ${currentPage === 'todos' ? 'active' : ''}" href="todos.html">✓ 待办中心${todosCount > 0 ? ` <span class="wm-badge-count ml-1" style="background:#C9A063;">${todosCount}</span>` : ''}</a>
                    <a class="nav-item ${currentPage === 'my-tickets' ? 'active' : ''}" href="my-tickets.html">📁 我的申请</a>
                    <a class="nav-item ${currentPage === 'supervise' ? 'active' : ''}" href="supervise-center.html">📣 督办中心</a>
                    <a class="nav-item ${currentPage === 'documents' ? 'active' : ''}" href="documents.html">📚 文档中心</a>

                    <!-- 七大智能体下拉 -->
                    <div class="nav-dropdown-wrap ${['credit','financing','investment','assets','ma','supply','risk'].includes(currentPage) ? 'has-active' : ''}" id="wm-agents-dropdown">
                        <div class="nav-item nav-dropdown-trigger ${['credit','financing','investment','assets','ma','supply','risk'].includes(currentPage) ? 'active' : ''}" id="wm-agents-trigger">
                            🧭 七大智能体 <span class="nav-caret">▾</span>
                        </div>
                        <div class="nav-dropdown-menu" id="wm-agents-menu">
                            <a class="nav-drop-item ${currentPage === 'credit' ? 'active' : ''}" href="agent-credit.html">
                                <span class="drop-ico" style="background:#B8141A20;color:#B8141A;">🏛</span>
                                <div class="flex-1">
                                    <div class="drop-title">信用优化智能体</div>
                                    <div class="drop-desc">六维度评级 · AAA-CCC</div>
                                </div>
                            </a>
                            <a class="nav-drop-item ${currentPage === 'financing' ? 'active' : ''}" href="agent-financing.html">
                                <span class="drop-ico" style="background:#0F2A5620;color:#0F2A56;">💰</span>
                                <div class="flex-1">
                                    <div class="drop-title">融资支持智能体</div>
                                    <div class="drop-desc">10+ 品种智能匹配</div>
                                </div>
                            </a>
                            <a class="nav-drop-item ${currentPage === 'investment' ? 'active' : ''}" href="agent-investment.html">
                                <span class="drop-ico" style="background:#1F4A8A20;color:#1F4A8A;">📈</span>
                                <div class="flex-1">
                                    <div class="drop-title">投资决策智能体</div>
                                    <div class="drop-desc">Multi-Agent 尽调</div>
                                </div>
                            </a>
                            <a class="nav-drop-item ${currentPage === 'assets' ? 'active' : ''}" href="agent-assets.html">
                                <span class="drop-ico" style="background:#C9A06320;color:#A8823E;">🏗</span>
                                <div class="flex-1">
                                    <div class="drop-title">三资盘活智能体</div>
                                    <div class="drop-desc">REITs / ABS / 数据资产</div>
                                </div>
                            </a>
                            <a class="nav-drop-item ${currentPage === 'ma' ? 'active' : ''}" href="agent-ma.html">
                                <span class="drop-ico" style="background:#8A0F1420;color:#8A0F14;">🔗</span>
                                <div class="flex-1">
                                    <div class="drop-title">并购工具智能体</div>
                                    <div class="drop-desc">标的匹配 · 交易结构</div>
                                </div>
                            </a>
                            <a class="nav-drop-item ${currentPage === 'supply' ? 'active' : ''}" href="agent-supply.html">
                                <span class="drop-ico" style="background:#A8823E20;color:#A8823E;">🔄</span>
                                <div class="flex-1">
                                    <div class="drop-title">供应链管理智能体</div>
                                    <div class="drop-desc">招投标 · 供应链金融</div>
                                </div>
                            </a>
                            <a class="nav-drop-item ${currentPage === 'risk' ? 'active' : ''}" href="agent-risk.html">
                                <span class="drop-ico" style="background:#D6404520;color:#D64045;">🛡</span>
                                <div class="flex-1">
                                    <div class="drop-title">风险防控智能体</div>
                                    <div class="drop-desc">三穿透 · 战略管控</div>
                                </div>
                            </a>
                        </div>
                    </div>

                    <a class="nav-item ${currentPage === 'workflow' ? 'active' : ''}" href="agent-workflow.html" style="margin-left:auto;">🤖 AI 工作流</a>
                    <a class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" href="dashboard.html">🧭 监管驾驶舱</a>
                </div>
            </div>
        </div>`;
    };

    // ===== 角色切换下拉绑定 =====
    C.bindRoleSwitcher = function () {
        setTimeout(() => {
            const trigger = document.getElementById('wm-user-chip-trigger');
            const wrap = document.getElementById('wm-user-chip-wrap');
            if (!trigger || !wrap) return;

            // 注入下拉菜单
            const existing = document.getElementById('wm-role-switcher');
            if (!existing) wrap.insertAdjacentHTML('beforeend', C.renderRoleSwitcher());

            const dropdown = document.getElementById('wm-role-switcher');
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });
            document.addEventListener('click', () => { dropdown.style.display = 'none'; });
            dropdown.addEventListener('click', (e) => e.stopPropagation());

            dropdown.querySelectorAll('[data-user-id]').forEach(item => {
                item.addEventListener('click', () => {
                    const uid = item.getAttribute('data-user-id');
                    window.showToast('切换至：' + item.querySelector('.rs-name').textContent, 'success');
                    setTimeout(() => window.WM_AUTH.switchRole(uid), 300);
                });
            });

            const logoutBtn = document.getElementById('wm-logout');
            if (logoutBtn) logoutBtn.addEventListener('click', () => {
                window.showToast('退出登录', 'info');
                setTimeout(() => window.WM_AUTH.logout(), 300);
            });

            // ===== 七大智能体下拉绑定 =====
            C.bindAgentsDropdown();
        }, 100);
    };

    // ===== 七大智能体下拉菜单绑定（事件委托，不依赖绑定时序）=====
    C.bindAgentsDropdown = function () {
        // 只初始化一次全局委托
        if (window.__wmAgentsDropdownInit) return;
        window.__wmAgentsDropdownInit = true;

        let hoverTimer = null;
        let isLocked = false;

        function getEls() {
            return {
                wrap: document.getElementById('wm-agents-dropdown'),
                trigger: document.getElementById('wm-agents-trigger'),
                menu: document.getElementById('wm-agents-menu'),
            };
        }
        function show() {
            const { trigger, menu } = getEls();
            if (!trigger || !menu) return;
            clearTimeout(hoverTimer);
            menu.classList.add('open');
            trigger.classList.add('opened');
        }
        function hide() {
            const { trigger, menu } = getEls();
            if (!trigger || !menu) return;
            clearTimeout(hoverTimer);
            menu.classList.remove('open');
            trigger.classList.remove('opened');
            isLocked = false;
        }

        // 全局委托：click
        document.addEventListener('click', function (e) {
            const hitTrigger = e.target.closest('#wm-agents-trigger');
            const hitWrap = e.target.closest('#wm-agents-dropdown');

            if (hitTrigger) {
                e.stopPropagation();
                e.preventDefault();
                const { menu } = getEls();
                if (menu && menu.classList.contains('open') && isLocked) {
                    hide();
                } else {
                    show();
                    isLocked = true;
                }
            } else if (!hitWrap) {
                // 点击外部：关闭
                hide();
            }
            // 点击菜单项：让跳转发生，不阻止
        }, false);

        // 全局委托：mouseover / mouseout（hover 打开）
        document.addEventListener('mouseover', function (e) {
            const hitWrap = e.target.closest('#wm-agents-dropdown');
            if (hitWrap) {
                clearTimeout(hoverTimer);
                show();
            }
        });
        document.addEventListener('mouseout', function (e) {
            const hitWrap = e.target.closest('#wm-agents-dropdown');
            const movingTo = e.relatedTarget ? e.relatedTarget.closest('#wm-agents-dropdown') : null;
            if (hitWrap && !movingTo) {
                if (isLocked) return;
                clearTimeout(hoverTimer);
                hoverTimer = setTimeout(hide, 280);
            }
        });

        // ESC 关闭
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') hide();
        });
    };

    // 自动初始化（立即，不等 DOMContentLoaded 之后，不依赖任何 setTimeout）
    if (typeof document !== 'undefined') {
        C.bindAgentsDropdown();
    }

    // ===== 模态弹窗 =====
    C.modal = function (options) {
        options = options || {};
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.className = 'wm-modal-backdrop';
            backdrop.innerHTML = `
                <div class="wm-modal">
                    <div class="wm-modal-header">
                        <div class="wm-modal-title">${C.escapeHtml(options.title || '提示')}</div>
                        <div class="wm-modal-close">×</div>
                    </div>
                    <div class="wm-modal-body">${options.body || ''}</div>
                    <div class="wm-modal-footer">
                        ${options.cancelText !== false ? `<button class="wm-btn wm-btn-ghost wm-btn-sm" data-act="cancel">${options.cancelText || '取消'}</button>` : ''}
                        <button class="wm-btn wm-btn-primary wm-btn-sm" data-act="confirm">${options.confirmText || '确认'}</button>
                    </div>
                </div>`;
            document.body.appendChild(backdrop);
            const close = (result) => { backdrop.remove(); resolve(result); };
            backdrop.querySelector('.wm-modal-close').onclick = () => close(false);
            backdrop.addEventListener('click', e => { if (e.target === backdrop) close(false); });
            const btnCancel = backdrop.querySelector('[data-act="cancel"]');
            if (btnCancel) btnCancel.onclick = () => close(false);
            backdrop.querySelector('[data-act="confirm"]').onclick = () => {
                // 收集表单值（如果有）
                const inputs = backdrop.querySelectorAll('input, textarea, select');
                const values = {};
                inputs.forEach(i => { if (i.name) values[i.name] = i.value; });
                close({ ok: true, values });
            };
        });
    };

    window.WM_C = C;
})();

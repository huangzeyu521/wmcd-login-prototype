/* =============================================================
   皖美信用 · 单据工作流引擎
   ============================================================= */
(function () {
    'use strict';

    // 生成单据 ID
    function genId(type) {
        const d = new Date();
        const prefix = { credit: 'CRD', financing: 'FIN', investment: 'INV', assets: 'AST', ma: 'MA', supply: 'SUP', risk: 'RSK' }[type] || 'TK';
        const pad = n => String(n).padStart(2, '0');
        const seq = String(Math.floor(Math.random() * 900) + 100);
        return `TK-${prefix}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${seq}`;
    }

    const Tickets = {
        // 创建单据
        create(type, payload, options) {
            options = options || {};
            const user = window.WM_AUTH.currentUser();
            if (!user) throw new Error('未登录');

            const meta = window.WM_TICKET_TYPES[type];
            const ticket = {
                id: genId(type),
                type: type,
                title: options.title || (payload.title || `${user.enterpriseName || '省国资委'} · ${meta.name}`),
                status: options.status || 'draft',
                creator: user.id,
                creatorName: user.shortName,
                owner: options.owner || user.id,
                enterpriseId: user.enterpriseId || null,
                enterpriseName: user.enterpriseName || null,
                amount: payload.amount || null,
                priority: options.priority || 'normal',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                deadline: options.deadline || null,
                payload: payload || {},
                timeline: [
                    { ts: Date.now(), user: user.id, userName: user.shortName, action: `发起${meta.name}`, type: 'create' },
                ],
            };
            return window.WM_STORE.saveTicket(ticket);
        },

        // 状态流转
        transit(ticketId, newStatus, actionLabel, extra) {
            const ticket = window.WM_STORE.getTicket(ticketId);
            if (!ticket) throw new Error('单据不存在');
            const user = window.WM_AUTH.currentUser();
            const oldStatus = ticket.status;
            ticket.status = newStatus;
            ticket.timeline.push({
                ts: Date.now(),
                user: user.id, userName: user.shortName,
                action: actionLabel || `${oldStatus} → ${newStatus}`,
                type: newStatus,
                comment: extra && extra.comment,
            });
            if (extra && extra.currentApprover) ticket.currentApprover = extra.currentApprover;
            if (extra && extra.owner) ticket.owner = extra.owner;
            return window.WM_STORE.saveTicket(ticket);
        },

        // 提交审批
        submit(ticketId, approverId) {
            const t = this.transit(ticketId, 'reviewing', '提交审批', { currentApprover: approverId });
            // 同步消息给审批人
            const ticket = window.WM_STORE.getTicket(ticketId);
            window.WM_STORE.addMessage({
                to: approverId,
                from: ticket.creator,
                type: 'approval_request',
                title: `【待审批】${ticket.title}`,
                body: `请审批单据 ${ticket.id}`,
                relatedTicketId: ticketId,
            });
            return t;
        },

        // 审批通过
        approve(ticketId, comment) {
            return this.transit(ticketId, 'approved', '审批通过', { comment });
        },

        // 审批驳回
        reject(ticketId, comment) {
            return this.transit(ticketId, 'rejected', '审批驳回', { comment });
        },

        // 开始执行
        execute(ticketId) {
            return this.transit(ticketId, 'executing', '进入执行阶段');
        },

        // 完成
        complete(ticketId, comment) {
            return this.transit(ticketId, 'completed', '执行完成', { comment });
        },

        // 归档
        archive(ticketId) {
            return this.transit(ticketId, 'archived', '已归档');
        },

        // 列表（按当前用户相关性排序）
        list(filter) {
            filter = filter || {};
            let arr = window.WM_STORE.getTickets();
            const user = window.WM_AUTH.currentUser();
            if (filter.mine && user) {
                arr = arr.filter(t => t.creator === user.id || t.owner === user.id || t.currentApprover === user.id);
            }
            if (filter.pendingApprovalBy) {
                arr = arr.filter(t => t.status === 'reviewing' && t.currentApprover === filter.pendingApprovalBy);
            }
            if (filter.type) arr = arr.filter(t => t.type === filter.type);
            if (filter.status) {
                const arr2 = Array.isArray(filter.status) ? filter.status : [filter.status];
                arr = arr.filter(t => arr2.indexOf(t.status) >= 0);
            }
            if (filter.enterpriseId) arr = arr.filter(t => t.enterpriseId === filter.enterpriseId);
            if (filter.keyword) {
                const k = filter.keyword.toLowerCase();
                arr = arr.filter(t => t.title.toLowerCase().indexOf(k) >= 0 || t.id.toLowerCase().indexOf(k) >= 0);
            }
            return arr.sort((a, b) => b.updatedAt - a.updatedAt);
        },

        // 派生"我的待办"
        myTodos() {
            const user = window.WM_AUTH.currentUser();
            if (!user) return [];
            const all = window.WM_STORE.getTickets();
            const todos = [];

            // 1. 待我审批的
            all.filter(t => t.status === 'reviewing' && t.currentApprover === user.id).forEach(t => {
                todos.push({
                    ticketId: t.id, type: 'approval',
                    title: '【审批】' + t.title,
                    priority: t.priority, deadline: t.deadline,
                    meta: window.WM_TICKET_TYPES[t.type],
                });
            });

            // 2. 我发起但驳回的（需修改重交）
            all.filter(t => (t.status === 'draft' || t.status === 'rejected') && t.creator === user.id).forEach(t => {
                todos.push({
                    ticketId: t.id, type: 'draft',
                    title: (t.status === 'rejected' ? '【被驳回需修改】' : '【草稿待完成】') + t.title,
                    priority: t.priority, deadline: t.deadline,
                    meta: window.WM_TICKET_TYPES[t.type],
                });
            });

            // 3. 我负责执行的
            all.filter(t => (t.status === 'approved' || t.status === 'executing' || t.status === 'submitted') && t.owner === user.id && t.creator !== user.id).forEach(t => {
                todos.push({
                    ticketId: t.id, type: 'execute',
                    title: '【待处理】' + t.title,
                    priority: t.priority, deadline: t.deadline,
                    meta: window.WM_TICKET_TYPES[t.type],
                });
            });

            // 4. 未读消息
            const unreadMsgs = window.WM_STORE.getMessages(user.id).filter(m => !m.read).length;
            if (unreadMsgs > 0) {
                todos.push({
                    type: 'messages',
                    title: `${unreadMsgs} 条未读消息`,
                    priority: 'normal',
                    url: 'messages.html',
                });
            }

            // 排序：urgent > high > normal > low
            const priMap = { urgent: 0, high: 1, normal: 2, low: 3 };
            return todos.sort((a, b) => (priMap[a.priority] || 2) - (priMap[b.priority] || 2));
        },

        // 统计卡片
        stats() {
            const user = window.WM_AUTH.currentUser();
            if (!user) return {};
            const all = window.WM_STORE.getTickets();
            const mine = all.filter(t => t.creator === user.id);
            const pendingApproval = all.filter(t => t.currentApprover === user.id && t.status === 'reviewing');
            return {
                total: mine.length,
                inProgress: mine.filter(t => ['submitted', 'reviewing', 'approved', 'executing'].indexOf(t.status) >= 0).length,
                completed: mine.filter(t => ['completed', 'archived'].indexOf(t.status) >= 0).length,
                rejected: mine.filter(t => t.status === 'rejected').length,
                pendingApproval: pendingApproval.length,
            };
        },
    };

    window.WM_TICKETS = Tickets;
})();

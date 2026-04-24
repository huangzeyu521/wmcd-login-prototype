/* =============================================================
   皖美信用 · Phase 2 数据层扩展
   -------------------------------------------------------------
   - 审批链模板（按单据类型+金额区间）
   - 多级审批流转
   - @提醒/评论
   - 督办（Supervision）
   - 电子签章（Signatures）
   - 附件（Attachments）
   ============================================================= */
(function () {
    'use strict';

    const P2_KEYS = {
        APPROVAL_CHAINS: 'wm_p2_approval_chains',
        SIGNATURES: 'wm_p2_signatures',
        ATTACHMENTS: 'wm_p2_attachments',
        SUPERVISIONS: 'wm_p2_supervisions',
        SEED_P2: 'wm_p2_seed',
    };
    const P2_SEED_VERSION = 'p2-v1.0';

    // ============== 审批链默认模板 ==============
    // 按单据类型 + 金额区间定义多级审批
    const DEFAULT_CHAINS = {
        financing: [
            { minAmount: 0, maxAmount: 10000, chain: ['U005'], name: '小额融资（≤1亿）' },
            { minAmount: 10000, maxAmount: 50000, chain: ['U005', 'U006'], name: '中额融资（1-5亿）' },
            { minAmount: 50000, maxAmount: 200000, chain: ['U005', 'U006', 'U002'], name: '大额融资（5-20亿）' },
            { minAmount: 200000, maxAmount: 9999999999, chain: ['U005', 'U006', 'U002', 'U001'], name: '超大融资（>20亿）' },
        ],
        investment: [
            { minAmount: 0, maxAmount: 5000, chain: ['U004'], name: '战略部内审（≤5000万）' },
            { minAmount: 5000, maxAmount: 30000, chain: ['U005', 'U006'], name: '中额投资（0.5-3亿）' },
            { minAmount: 30000, maxAmount: 9999999999, chain: ['U005', 'U006', 'U002'], name: '大额投资（>3亿，国资备案）' },
        ],
        assets: [
            { minAmount: 0, maxAmount: 10000, chain: ['U005'], name: '小额盘活' },
            { minAmount: 10000, maxAmount: 9999999999, chain: ['U005', 'U006'], name: '大额盘活' },
        ],
        ma: [
            { minAmount: 0, maxAmount: 50000, chain: ['U005', 'U006'], name: '中额并购（≤5亿）' },
            { minAmount: 50000, maxAmount: 9999999999, chain: ['U005', 'U006', 'U002', 'U001'], name: '大额并购（>5亿 国资审批）' },
        ],
        supply: [
            { minAmount: 0, maxAmount: 10000, chain: ['U005'], name: '常规招标' },
            { minAmount: 10000, maxAmount: 9999999999, chain: ['U005', 'U006'], name: '大额招标' },
        ],
        credit: [
            { minAmount: 0, maxAmount: 9999999999, chain: ['U005'], name: '信用评估内审' },
        ],
        risk: [
            { minAmount: 0, maxAmount: 9999999999, chain: ['U005', 'U002'], name: '风险处置（内审+国资备案）' },
        ],
        supervision: [
            { minAmount: 0, maxAmount: 9999999999, chain: ['U001'], name: '督办主任审批' },
        ],
    };

    // ============== 预置督办样例 ==============
    function seedSupervisions() {
        const now = Date.now();
        const day = 86400000;
        return [
            {
                id: 'SV-20260423-001',
                title: '【红色】XX建工集团债务兑付风险 · 立即处置',
                level: 'red',
                sender: 'U002', senderName: '王科长',
                receiver: 'U005', receiverName: '陈雪梅',
                enterpriseId: 'E002', enterpriseName: 'XX建工集团',
                status: 'handling', // pending/handling/responded/closed
                createdAt: now - 6 * 3600 * 1000,
                deadline: now + 1 * day,
                relatedTicketId: 'TK-RSK-20260423-007',
                content: '经监管驾驶舱预警，该企业7日内到期债务5.2亿，现金流覆盖率<0.8。请：1) 24小时内提交处置方案；2) 启动债务接续；3) 每日汇报进度。',
                responses: [
                    { ts: now - 5 * 3600 * 1000, user: 'U005', userName: '陈雪梅', type: 'accept', content: '已接单，启动处置方案制定' },
                ],
            },
            {
                id: 'SV-20260422-002',
                title: '【橙色】全省省属国企担保圈专项排查',
                level: 'orange',
                sender: 'U001', senderName: '李主任',
                receiver: 'U005', receiverName: '陈雪梅',
                enterpriseId: 'E001', enterpriseName: '皖能集团',
                status: 'responded',
                createdAt: now - 2 * day,
                deadline: now + 3 * day,
                content: '按照十五五国资监管专项行动要求，请各省属国企在一周内排查本集团担保圈情况，识别并报告存在传染风险的关联交易。',
                responses: [
                    { ts: now - 2 * day + 3600000, user: 'U005', userName: '陈雪梅', type: 'accept', content: '已接单' },
                    { ts: now - 6 * 3600 * 1000, user: 'U005', userName: '陈雪梅', type: 'report', content: '排查完成：本集团涉及 0 个担保圈，对外担保额 28 亿，均为正常业务担保，无异常。详细报告附后。' },
                ],
            },
        ];
    }

    // ============== 预置附件样例 ==============
    function seedAttachments() {
        const now = Date.now();
        return [
            { id: 'AT-001', ticketId: 'TK-FIN-20260418-001', name: '融资可行性分析报告.pdf', size: 2436890, type: 'pdf', uploadedBy: 'U003', ts: now - 3 * 86400000 },
            { id: 'AT-002', ticketId: 'TK-FIN-20260418-001', name: '绿色项目环评证明.pdf', size: 1823410, type: 'pdf', uploadedBy: 'U003', ts: now - 3 * 86400000 },
            { id: 'AT-003', ticketId: 'TK-INV-20260422-003', name: '合肥XX储能科技_财务报表.xlsx', size: 3821904, type: 'xlsx', uploadedBy: 'U004', ts: now - 2 * 86400000 },
            { id: 'AT-004', ticketId: 'TK-AST-20260419-004', name: '合肥产业园_资产评估报告.docx', size: 1923840, type: 'docx', uploadedBy: 'U003', ts: now - 4 * 86400000 },
        ];
    }

    // ============== 预置签章 ==============
    function seedSignatures() {
        return [
            { userId: 'U001', style: 'seal', text: '李建国' },
            { userId: 'U002', style: 'seal', text: '王丽华' },
            { userId: 'U003', style: 'handwrite', text: '张建军' },
            { userId: 'U004', style: 'handwrite', text: '刘志强' },
            { userId: 'U005', style: 'seal', text: '陈雪梅' },
            { userId: 'U006', style: 'seal', text: '赵建平' },
            { userId: 'U007', style: 'handwrite', text: '孙建军' },
        ];
    }

    // ============== P2 Store ==============
    const P2Store = {
        _init() {
            const ver = localStorage.getItem(P2_KEYS.SEED_P2);
            if (ver !== P2_SEED_VERSION) {
                localStorage.setItem(P2_KEYS.APPROVAL_CHAINS, JSON.stringify(DEFAULT_CHAINS));
                localStorage.setItem(P2_KEYS.SUPERVISIONS, JSON.stringify(seedSupervisions()));
                localStorage.setItem(P2_KEYS.ATTACHMENTS, JSON.stringify(seedAttachments()));
                localStorage.setItem(P2_KEYS.SIGNATURES, JSON.stringify(seedSignatures()));
                localStorage.setItem(P2_KEYS.SEED_P2, P2_SEED_VERSION);
            }
        },

        // 审批链
        getChains() {
            this._init();
            try { return JSON.parse(localStorage.getItem(P2_KEYS.APPROVAL_CHAINS) || '{}'); }
            catch (e) { return DEFAULT_CHAINS; }
        },
        saveChains(data) {
            localStorage.setItem(P2_KEYS.APPROVAL_CHAINS, JSON.stringify(data));
        },
        // 根据单据类型+金额获取适用审批链
        getChainFor(type, amount) {
            const chains = this.getChains()[type] || [];
            const amt = amount || 0;
            for (const rule of chains) {
                if (amt >= rule.minAmount && amt < rule.maxAmount) {
                    return { chain: rule.chain.slice(), name: rule.name, rule };
                }
            }
            return { chain: [], name: '无适用审批链', rule: null };
        },

        // 督办
        getSupervisions(filter) {
            this._init();
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(P2_KEYS.SUPERVISIONS) || '[]'); }
            catch (e) { arr = []; }
            filter = filter || {};
            if (filter.receiver) arr = arr.filter(s => s.receiver === filter.receiver);
            if (filter.sender) arr = arr.filter(s => s.sender === filter.sender);
            if (filter.status) arr = arr.filter(s => s.status === filter.status);
            return arr.sort((a, b) => b.createdAt - a.createdAt);
        },
        getSupervision(id) {
            return this.getSupervisions().find(s => s.id === id);
        },
        saveSupervision(sv) {
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(P2_KEYS.SUPERVISIONS) || '[]'); }
            catch (e) { arr = []; }
            const idx = arr.findIndex(s => s.id === sv.id);
            if (idx >= 0) arr[idx] = sv; else arr.unshift(sv);
            localStorage.setItem(P2_KEYS.SUPERVISIONS, JSON.stringify(arr));
            return sv;
        },
        createSupervision(data) {
            const sv = {
                id: 'SV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 900) + 100),
                status: 'pending',
                createdAt: Date.now(),
                responses: [],
                ...data,
            };
            this.saveSupervision(sv);
            // 通知接收方
            window.WM_STORE.addMessage({
                to: data.receiver,
                from: data.sender,
                type: 'supervise',
                title: '【督办】' + data.title,
                body: data.content ? data.content.slice(0, 100) : '请查看督办详情',
                relatedSupervisionId: sv.id,
            });
            return sv;
        },
        addSupervisionResponse(id, user, type, content) {
            const sv = this.getSupervision(id);
            if (!sv) return null;
            sv.responses = sv.responses || [];
            sv.responses.push({ ts: Date.now(), user: user.id, userName: user.shortName, type, content });
            if (type === 'accept') sv.status = 'handling';
            if (type === 'report') sv.status = 'responded';
            if (type === 'close') sv.status = 'closed';
            this.saveSupervision(sv);
            // 通知发起方
            window.WM_STORE.addMessage({
                to: sv.sender,
                from: user.id,
                type: 'supervise',
                title: `【督办${type === 'accept' ? '接收' : type === 'report' ? '反馈' : '关闭'}】` + sv.title,
                body: (content || '').slice(0, 100),
                relatedSupervisionId: sv.id,
            });
            return sv;
        },

        // 附件
        getAttachments(ticketId) {
            this._init();
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(P2_KEYS.ATTACHMENTS) || '[]'); }
            catch (e) { arr = []; }
            if (ticketId) arr = arr.filter(a => a.ticketId === ticketId);
            return arr.sort((a, b) => b.ts - a.ts);
        },
        addAttachment(ticketId, file) {
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(P2_KEYS.ATTACHMENTS) || '[]'); }
            catch (e) { arr = []; }
            const user = window.WM_AUTH.currentUser();
            const at = {
                id: 'AT-' + Date.now() + Math.floor(Math.random() * 100),
                ticketId,
                name: file.name,
                size: file.size || Math.floor(Math.random() * 5000000) + 100000,
                type: (file.name.split('.').pop() || 'file').toLowerCase(),
                uploadedBy: user ? user.id : null,
                ts: Date.now(),
            };
            arr.unshift(at);
            localStorage.setItem(P2_KEYS.ATTACHMENTS, JSON.stringify(arr));
            return at;
        },
        deleteAttachment(id) {
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(P2_KEYS.ATTACHMENTS) || '[]'); }
            catch (e) { arr = []; }
            arr = arr.filter(a => a.id !== id);
            localStorage.setItem(P2_KEYS.ATTACHMENTS, JSON.stringify(arr));
        },

        // 签章
        getSignature(userId) {
            this._init();
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(P2_KEYS.SIGNATURES) || '[]'); }
            catch (e) { arr = []; }
            return arr.find(s => s.userId === userId);
        },
    };

    // ============== 扩展 Tickets 支持多级审批 ==============
    const P2Tickets = {
        // 使用审批链提交（替代原 submit）
        submitWithChain(ticketId, amount) {
            const ticket = window.WM_STORE.getTicket(ticketId);
            if (!ticket) throw new Error('单据不存在');
            const user = window.WM_AUTH.currentUser();
            const chainInfo = P2Store.getChainFor(ticket.type, amount || ticket.amount || 0);
            if (!chainInfo.chain.length) throw new Error('未配置适用审批链');

            ticket.status = 'reviewing';
            ticket.approvalChain = chainInfo.chain;
            ticket.approvalChainName = chainInfo.name;
            ticket.approvalStepIndex = 0;
            ticket.currentApprover = chainInfo.chain[0];
            ticket.approvalHistory = [];
            ticket.timeline.push({
                ts: Date.now(), user: user.id, userName: user.shortName,
                action: `提交审批（${chainInfo.name} · ${chainInfo.chain.length}级）`,
                type: 'submit',
            });
            window.WM_STORE.saveTicket(ticket);

            // 通知第一级审批人
            const firstApprover = window.WM_STORE.getUser(chainInfo.chain[0]);
            window.WM_STORE.addMessage({
                to: chainInfo.chain[0],
                from: ticket.creator,
                type: 'approval_request',
                title: `【待审批 · 第1/${chainInfo.chain.length}级】${ticket.title}`,
                body: `请审批单据 ${ticket.id}`,
                relatedTicketId: ticketId,
            });
            return ticket;
        },

        // 多级审批通过（流转到下一级或完成）
        approveMultiLevel(ticketId, comment, signatureData) {
            const ticket = window.WM_STORE.getTicket(ticketId);
            if (!ticket) throw new Error('单据不存在');
            const user = window.WM_AUTH.currentUser();
            const idx = ticket.approvalStepIndex || 0;

            // 记录此级审批结果
            ticket.approvalHistory = ticket.approvalHistory || [];
            ticket.approvalHistory.push({
                stepIndex: idx,
                approver: user.id, approverName: user.shortName, approverRole: user.roleLabel,
                result: 'approved', comment, signatureData,
                ts: Date.now(),
            });

            const nextIdx = idx + 1;
            if (ticket.approvalChain && nextIdx < ticket.approvalChain.length) {
                // 流转到下一级
                ticket.approvalStepIndex = nextIdx;
                ticket.currentApprover = ticket.approvalChain[nextIdx];
                ticket.timeline.push({
                    ts: Date.now(), user: user.id, userName: user.shortName,
                    action: `第${idx + 1}级审批通过，流转至第${nextIdx + 1}级`,
                    type: 'approved', comment,
                });
                window.WM_STORE.saveTicket(ticket);
                // 通知下一级审批人
                window.WM_STORE.addMessage({
                    to: ticket.approvalChain[nextIdx],
                    from: user.id,
                    type: 'approval_request',
                    title: `【待审批 · 第${nextIdx + 1}/${ticket.approvalChain.length}级】${ticket.title}`,
                    body: `请审批单据 ${ticket.id}`,
                    relatedTicketId: ticketId,
                });
            } else {
                // 全部审批通过
                ticket.status = 'approved';
                ticket.currentApprover = null;
                ticket.timeline.push({
                    ts: Date.now(), user: user.id, userName: user.shortName,
                    action: `终审通过（全${(ticket.approvalChain || []).length}级审批完成）`,
                    type: 'approved', comment,
                });
                window.WM_STORE.saveTicket(ticket);
                // 通知发起人
                window.WM_STORE.addMessage({
                    to: ticket.creator,
                    from: user.id,
                    type: 'approval',
                    title: `✓ 审批通过：${ticket.title}`,
                    body: `您的单据已完成全部审批，可进入执行阶段`,
                    relatedTicketId: ticketId,
                });
            }
            return ticket;
        },

        // 多级审批驳回（全流程终止）
        rejectMultiLevel(ticketId, comment) {
            const ticket = window.WM_STORE.getTicket(ticketId);
            if (!ticket) throw new Error('单据不存在');
            const user = window.WM_AUTH.currentUser();
            const idx = ticket.approvalStepIndex || 0;

            ticket.approvalHistory = ticket.approvalHistory || [];
            ticket.approvalHistory.push({
                stepIndex: idx,
                approver: user.id, approverName: user.shortName, approverRole: user.roleLabel,
                result: 'rejected', comment,
                ts: Date.now(),
            });

            ticket.status = 'rejected';
            ticket.currentApprover = null;
            ticket.timeline.push({
                ts: Date.now(), user: user.id, userName: user.shortName,
                action: `第${idx + 1}级审批驳回`,
                type: 'rejected', comment,
            });
            window.WM_STORE.saveTicket(ticket);
            window.WM_STORE.addMessage({
                to: ticket.creator,
                from: user.id,
                type: 'approval',
                title: `✗ 审批驳回：${ticket.title}`,
                body: comment || '请查看驳回意见并修改后重新提交',
                relatedTicketId: ticketId,
            });
            return ticket;
        },

        // 评论并@
        addComment(ticketId, content, mentions) {
            const ticket = window.WM_STORE.getTicket(ticketId);
            if (!ticket) throw new Error('单据不存在');
            const user = window.WM_AUTH.currentUser();
            ticket.timeline.push({
                ts: Date.now(), user: user.id, userName: user.shortName,
                action: content,
                type: 'comment',
                mentions: mentions || [],
            });
            window.WM_STORE.saveTicket(ticket);
            // 通知被@的人
            (mentions || []).forEach(uid => {
                if (uid === user.id) return;
                window.WM_STORE.addMessage({
                    to: uid,
                    from: user.id,
                    type: 'approval',
                    title: `@ ${user.shortName} 在单据中提到您`,
                    body: content.slice(0, 100),
                    relatedTicketId: ticketId,
                });
            });
            return ticket;
        },
    };

    window.WM_P2 = P2Store;
    window.WM_P2_TICKETS = P2Tickets;
    window.WM_P2_KEYS = P2_KEYS;

    P2Store._init();
})();

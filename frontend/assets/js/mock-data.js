/* =============================================================
   皖美信用平台 · MVP 数据模拟层
   -------------------------------------------------------------
   所有"假数据"的唯一数据源。使用 localStorage 持久化，支持：
   - 预置用户/角色
   - 单据（Tickets）CRUD
   - 消息（Messages）
   - 待办（Todos，派生自 Tickets）
   ============================================================= */
(function () {
    'use strict';

    const KEYS = {
        CURRENT_USER: 'wm_current_user',
        TICKETS: 'wm_tickets',
        MESSAGES: 'wm_messages',
        SEED_VERSION: 'wm_seed_v',
    };
    const SEED_VERSION = 'v1.3';

    // ============== 预置用户（按角色）==============
    const USERS = [
        {
            id: 'U000', name: '系统管理员', shortName: 'admin',
            role: 'sys_admin', roleLabel: '平台系统管理员',
            title: '平台主管账号', org: '安徽国资数字科技有限公司',
            avatar: 'A', avatarBg: '#0F2A56',
            account: 'admin', password: 'admin123',
            permissions: ['*'],
            scope: 'all_province',
            description: '平台测试/运维默认账号',
        },
        {
            id: 'U001', name: '李建国', shortName: '李主任',
            role: 'sasac_chief', roleLabel: '省国资委副主任',
            title: '副主任', org: '安徽省国有资产监督管理委员会',
            avatar: '李', avatarBg: '#B8141A',
            permissions: ['*'], // 全权
            scope: 'all_province',
            description: '全省国资国企高层监管',
        },
        {
            id: 'U002', name: '王丽华', shortName: '王科长',
            role: 'sasac_officer', roleLabel: '省国资委监管员',
            title: '财务监督处 处长', org: '安徽省国资委',
            avatar: '王', avatarBg: '#8A0F14',
            permissions: ['approve', 'supervise', 'report'],
            scope: 'all_province',
            description: '日常监管执行、督办下发',
        },
        {
            id: 'U003', name: '张建军', shortName: '张总',
            role: 'soe_cfo', roleLabel: '国企CFO',
            title: '财务总监', org: '安徽皖能集团有限公司',
            avatar: '张', avatarBg: '#0F2A56',
            permissions: ['create_financing', 'create_asset', 'view_credit'],
            scope: 'own_enterprise',
            enterpriseId: 'E001', enterpriseName: '皖能集团',
            description: '集团融资决策、债务管理',
        },
        {
            id: 'U004', name: '刘志强', shortName: '刘总',
            role: 'soe_strategy', roleLabel: '国企战略部',
            title: '战略发展部 部长', org: '皖能集团',
            avatar: '刘', avatarBg: '#1F4A8A',
            permissions: ['create_investment', 'create_ma', 'view_credit'],
            scope: 'own_enterprise',
            enterpriseId: 'E001', enterpriseName: '皖能集团',
            description: '投资决策、并购重组',
        },
        {
            id: 'U005', name: '陈雪梅', shortName: '陈总',
            role: 'soe_risk', roleLabel: '国企风控合规总监',
            title: '风险合规部 总监', org: '皖能集团',
            avatar: '陈', avatarBg: '#D64045',
            permissions: ['handle_risk', 'view_credit', 'approve'],
            scope: 'own_enterprise',
            enterpriseId: 'E001', enterpriseName: '皖能集团',
            description: '风险处置、合规审查',
        },
        {
            id: 'U006', name: '赵建平', shortName: '赵董事长',
            role: 'soe_chairman', roleLabel: '国企董事长',
            title: '董事长', org: '皖能集团',
            avatar: '赵', avatarBg: '#A8823E',
            permissions: ['*'],
            scope: 'own_enterprise',
            enterpriseId: 'E001', enterpriseName: '皖能集团',
            description: '集团最高决策层、重大审批',
        },
        {
            id: 'U007', name: '孙建军', shortName: '孙经理',
            role: 'soe_procurement', roleLabel: '国企采购总监',
            title: '采购供应链部 总监', org: '皖能集团',
            avatar: '孙', avatarBg: '#A8823E',
            permissions: ['create_bidding', 'manage_supplier'],
            scope: 'own_enterprise',
            enterpriseId: 'E001', enterpriseName: '皖能集团',
            description: '供应链管理、智能招投标',
        },
    ];

    // ============== 单据类型元数据 ==============
    const TICKET_TYPES = {
        credit: { name: '信用评估', icon: '🏛', agent: 'credit', color: '#B8141A' },
        financing: { name: '融资申请', icon: '💰', agent: 'financing', color: '#0F2A56' },
        investment: { name: '投资尽调', icon: '📈', agent: 'investment', color: '#1F4A8A' },
        assets: { name: '三资盘活', icon: '🏗', agent: 'assets', color: '#C9A063' },
        ma: { name: '并购重组', icon: '🔗', agent: 'ma', color: '#8A0F14' },
        supply: { name: '招投标', icon: '🔄', agent: 'supply', color: '#A8823E' },
        risk: { name: '风险处置', icon: '🛡', agent: 'risk', color: '#D64045' },
    };

    // ============== 单据状态元数据 ==============
    const TICKET_STATUS = {
        draft: { label: '起草', color: '#7A7A7A', next: ['submitted'] },
        submitted: { label: '已提交', color: '#1F4A8A', next: ['reviewing', 'rejected'] },
        reviewing: { label: '审批中', color: '#E8A33D', next: ['approved', 'rejected'] },
        approved: { label: '已批准', color: '#2B9348', next: ['executing'] },
        executing: { label: '执行中', color: '#0F2A56', next: ['completed'] },
        completed: { label: '已完成', color: '#2B9348', next: ['archived'] },
        archived: { label: '已归档', color: '#4A4A4A', next: [] },
        rejected: { label: '已驳回', color: '#D64045', next: ['draft'] },
    };

    // ============== 预置单据（样例数据，便于演示）==============
    function seedTickets() {
        const now = Date.now();
        const day = 86400000;
        return [
            {
                id: 'TK-FIN-20260418-001',
                type: 'financing',
                title: '皖能集团 · 5年期20亿元绿色债发行',
                status: 'reviewing',
                creator: 'U003', creatorName: '张总',
                owner: 'U003',
                currentApprover: 'U006',
                enterpriseId: 'E001', enterpriseName: '皖能集团',
                amount: 200000,
                createdAt: now - 3 * day,
                updatedAt: now - 2 * 3600 * 1000,
                deadline: now + 5 * day,
                priority: 'high',
                payload: {
                    amount: 200000, unit: '万元',
                    term: 60, termUnit: '月',
                    purpose: '新能源机组投资 + 绿色转型',
                    collateral: '集团信用担保',
                    preferredProducts: ['绿色债券', '公司债'],
                    expectedRate: '3.05%-3.15%',
                },
                timeline: [
                    { ts: now - 3 * day, user: 'U003', action: '发起融资申请', type: 'create' },
                    { ts: now - 3 * day + 3600 * 1000, user: 'SYSTEM', action: 'AI诊断完成，推荐3套方案', type: 'system' },
                    { ts: now - 2 * day, user: 'U003', action: '选择方案A并提交审批', type: 'submit' },
                    { ts: now - 2 * 3600 * 1000, user: 'U006', action: '董事长审批中', type: 'reviewing' },
                ],
            },
            {
                id: 'TK-CRD-20260420-002',
                type: 'credit',
                title: '皖能集团 · 季度信用评估',
                status: 'completed',
                creator: 'U003', creatorName: '张总',
                owner: 'U003',
                enterpriseId: 'E001', enterpriseName: '皖能集团',
                createdAt: now - 5 * day,
                updatedAt: now - 1 * day,
                priority: 'normal',
                payload: { period: '2026-Q1', result: 'AAA', score: 968 },
                timeline: [
                    { ts: now - 5 * day, user: 'U003', action: '发起评估', type: 'create' },
                    { ts: now - 4 * day, user: 'SYSTEM', action: 'AI综合评估完成 · AAA 968分', type: 'system' },
                    { ts: now - 1 * day, user: 'U003', action: '确认归档', type: 'complete' },
                ],
            },
            {
                id: 'TK-INV-20260422-003',
                type: 'investment',
                title: '合肥XX储能科技 · 并购尽调（3亿元）',
                status: 'executing',
                creator: 'U004', creatorName: '刘总',
                owner: 'U004',
                enterpriseId: 'E001', enterpriseName: '皖能集团',
                amount: 30000,
                createdAt: now - 2 * day,
                updatedAt: now - 2 * 3600 * 1000,
                deadline: now + 7 * day,
                priority: 'high',
                payload: {
                    targetName: '合肥XX储能科技有限公司',
                    industry: '储能',
                    targetRev: 180000000,
                    investAmount: 30000,
                    equityPct: 20,
                    stage: 'Multi-Agent尽调（5/8 完成）',
                },
                timeline: [
                    { ts: now - 2 * day, user: 'U004', action: '发起尽调', type: 'create' },
                    { ts: now - 2 * day + 1800000, user: 'SYSTEM', action: '8大Agent并行启动', type: 'system' },
                    { ts: now - 2 * 3600 * 1000, user: 'SYSTEM', action: '风险Agent扫描中（6/8）', type: 'progress' },
                ],
            },
            {
                id: 'TK-AST-20260419-004',
                type: 'assets',
                title: '合肥产业园 · 类REITs盘活方案',
                status: 'approved',
                creator: 'U003', creatorName: '张总',
                owner: 'U003',
                enterpriseId: 'E001', enterpriseName: '皖能集团',
                amount: 18000,
                createdAt: now - 4 * day,
                updatedAt: now - 3 * 3600 * 1000,
                payload: {
                    assetType: '产业园不动产',
                    appraisal: 187000,
                    plan: '类REITs 首期 18亿',
                    expectedIRR: '13.8%',
                },
                timeline: [
                    { ts: now - 4 * day, user: 'U003', action: '发起盘活项目', type: 'create' },
                    { ts: now - 3 * day, user: 'SYSTEM', action: 'AI估值 18.7亿', type: 'system' },
                    { ts: now - 2 * day, user: 'U003', action: '选择类REITs方案', type: 'select' },
                    { ts: now - 3 * 3600 * 1000, user: 'U006', action: '董事长审批通过', type: 'approved' },
                ],
            },
            {
                id: 'TK-MA-20260417-005',
                type: 'ma',
                title: '新能源三电 · 产业链并购（4亿元）',
                status: 'draft',
                creator: 'U004', creatorName: '刘总',
                owner: 'U004',
                enterpriseId: 'E001', enterpriseName: '皖能集团',
                amount: 40000,
                createdAt: now - 1 * day,
                updatedAt: now - 4 * 3600 * 1000,
                payload: {
                    maType: '纵向并购',
                    targetCandidates: 5,
                    stage: '标的筛选',
                },
                timeline: [
                    { ts: now - 1 * day, user: 'U004', action: '创建并购意向', type: 'create' },
                ],
            },
            {
                id: 'TK-SUP-20260421-006',
                type: 'supply',
                title: '光伏设备采购 · 智能招标（2.8亿）',
                status: 'executing',
                creator: 'U007', creatorName: '孙经理',
                owner: 'U007',
                enterpriseId: 'E001', enterpriseName: '皖能集团',
                amount: 28000,
                createdAt: now - 3 * day,
                updatedAt: now - 1 * 3600 * 1000,
                deadline: now + 3 * day,
                payload: {
                    category: '光伏设备',
                    biddersCount: 6,
                    anomaly: '检测到 1 组围标嫌疑（C-D）',
                    stage: 'AI评标中',
                },
                timeline: [
                    { ts: now - 3 * day, user: 'U007', action: '发布招标公告', type: 'create' },
                    { ts: now - 2 * day, user: 'SYSTEM', action: '6家供应商响应', type: 'system' },
                    { ts: now - 1 * day, user: 'SYSTEM', action: 'AI检测到 C-D 围标嫌疑', type: 'alert' },
                ],
            },
            {
                id: 'TK-RSK-20260423-007',
                type: 'risk',
                title: '🔴 XX建工集团 · 债务兑付预警处置',
                status: 'submitted',
                creator: 'U002', creatorName: '王科长',
                owner: 'U005',
                currentApprover: 'U005',
                enterpriseId: 'E002', enterpriseName: 'XX建工集团',
                createdAt: now - 6 * 3600 * 1000,
                updatedAt: now - 30 * 60 * 1000,
                deadline: now + 1 * day,
                priority: 'urgent',
                payload: {
                    riskLevel: 'red',
                    riskType: '债务风险',
                    trigger: '7日内到期债务5.2亿，现金流覆盖率<0.8',
                    suggestion: '启动债务接续 + 联动融资智能体',
                },
                timeline: [
                    { ts: now - 6 * 3600 * 1000, user: 'SYSTEM', action: '风险防控智能体红色预警', type: 'alert' },
                    { ts: now - 5 * 3600 * 1000, user: 'U002', action: '已下发督办至皖能风控', type: 'supervise' },
                    { ts: now - 30 * 60 * 1000, user: 'U005', action: '已接单，开始处置方案制定', type: 'handle' },
                ],
            },
            {
                id: 'TK-FIN-20260415-008',
                type: 'financing',
                title: '皖能集团 · 3亿元超短融',
                status: 'archived',
                creator: 'U003', creatorName: '张总',
                owner: 'U003',
                enterpriseId: 'E001', enterpriseName: '皖能集团',
                amount: 30000,
                createdAt: now - 15 * day,
                updatedAt: now - 8 * day,
                payload: { amount: 30000, term: 9, termUnit: '月', actualRate: '2.85%' },
                timeline: [
                    { ts: now - 15 * day, user: 'U003', action: '发起', type: 'create' },
                    { ts: now - 10 * day, user: 'SYSTEM', action: '工商银行放款', type: 'complete' },
                    { ts: now - 8 * day, user: 'U003', action: '归档', type: 'archived' },
                ],
            },
        ];
    }

    // ============== 预置消息 ==============
    function seedMessages() {
        const now = Date.now();
        return [
            {
                id: 'M001', to: 'U003', from: 'SYSTEM',
                type: 'approval', title: '您的融资申请进入董事长审批',
                body: '单据 TK-FIN-20260418-001 · 5年期20亿元绿色债发行 已提交董事长赵建平审批',
                ts: now - 2 * 3600 * 1000, read: false,
                relatedTicketId: 'TK-FIN-20260418-001',
            },
            {
                id: 'M002', to: 'U006', from: 'U003',
                type: 'approval_request', title: '【待审批】融资申请 · 200亿',
                body: '张总提交了"5年期20亿元绿色债发行"，请审批',
                ts: now - 2 * 3600 * 1000, read: false,
                relatedTicketId: 'TK-FIN-20260418-001',
            },
            {
                id: 'M003', to: 'U005', from: 'U002',
                type: 'supervise', title: '【督办】XX建工债务兑付预警处置',
                body: '省国资委下发督办：请在24小时内制定处置方案',
                ts: now - 5 * 3600 * 1000, read: false,
                relatedTicketId: 'TK-RSK-20260423-007',
            },
            {
                id: 'M004', to: 'U003', from: 'SYSTEM',
                type: 'alert', title: '📊 信用评估已完成',
                body: '皖能集团 Q1 信用评估完成 · AAA 968分 · 较上季度 +12',
                ts: now - 24 * 3600 * 1000, read: true,
                relatedTicketId: 'TK-CRD-20260420-002',
            },
            {
                id: 'M005', to: 'U004', from: 'SYSTEM',
                type: 'progress', title: 'Multi-Agent尽调进度',
                body: '合肥XX储能尽调：风险Agent正在扫描，预计42分钟完成',
                ts: now - 2 * 3600 * 1000, read: false,
                relatedTicketId: 'TK-INV-20260422-003',
            },
            {
                id: 'M006', to: 'U001', from: 'SYSTEM',
                type: 'daily_report', title: '📄 每日监管态势简报',
                body: '今日风险：🔴红3 🟠橙9 🟡黄15 · 处置闭环率 96.8% · 穿透覆盖 100%',
                ts: now - 1 * 3600 * 1000, read: false,
            },
            {
                id: 'M007', to: 'U002', from: 'SYSTEM',
                type: 'alert', title: '🚨 新增红色预警',
                body: 'XX城投 · 信用评分下滑56分，等级BBB · 建议立即排查',
                ts: now - 30 * 60 * 1000, read: false,
            },
            {
                id: 'M008', to: 'U007', from: 'SYSTEM',
                type: 'alert', title: '⚠ 招标异常检测',
                body: '光伏设备采购招标：检测到 C-D 投标方围标嫌疑 87%',
                ts: now - 1 * 3600 * 1000, read: false,
                relatedTicketId: 'TK-SUP-20260421-006',
            },
        ];
    }

    // ============== 数据访问层 ==============
    const Store = {
        _init() {
            const ver = localStorage.getItem(KEYS.SEED_VERSION);
            if (ver !== SEED_VERSION) {
                localStorage.setItem(KEYS.TICKETS, JSON.stringify(seedTickets()));
                localStorage.setItem(KEYS.MESSAGES, JSON.stringify(seedMessages()));
                localStorage.setItem(KEYS.SEED_VERSION, SEED_VERSION);
            }
        },
        // 用户
        getUsers() { return USERS; },
        getUser(id) { return USERS.find(u => u.id === id); },
        getUserByRole(role) { return USERS.find(u => u.role === role); },
        // 单据
        getTickets() {
            this._init();
            try { return JSON.parse(localStorage.getItem(KEYS.TICKETS) || '[]'); }
            catch (e) { return []; }
        },
        getTicket(id) { return this.getTickets().find(t => t.id === id); },
        saveTickets(arr) { localStorage.setItem(KEYS.TICKETS, JSON.stringify(arr)); },
        saveTicket(ticket) {
            const arr = this.getTickets();
            const idx = arr.findIndex(t => t.id === ticket.id);
            ticket.updatedAt = Date.now();
            if (idx >= 0) arr[idx] = ticket; else arr.unshift(ticket);
            this.saveTickets(arr);
            return ticket;
        },
        // 消息
        getMessages(toUserId) {
            this._init();
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]'); }
            catch (e) { arr = []; }
            if (toUserId) arr = arr.filter(m => m.to === toUserId);
            return arr.sort((a, b) => b.ts - a.ts);
        },
        saveMessage(msg) {
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(KEYS.MESSAGES) || '[]'); }
            catch (e) { arr = []; }
            const idx = arr.findIndex(m => m.id === msg.id);
            if (idx >= 0) arr[idx] = msg; else arr.unshift(msg);
            localStorage.setItem(KEYS.MESSAGES, JSON.stringify(arr));
            return msg;
        },
        addMessage(partial) {
            const msg = {
                id: 'M' + Date.now() + Math.floor(Math.random() * 1000),
                ts: Date.now(),
                read: false,
                ...partial,
            };
            return this.saveMessage(msg);
        },
        markMessageRead(id) {
            const arr = this.getMessages();
            const m = arr.find(x => x.id === id);
            if (m) { m.read = true; this.saveMessage(m); }
        },
        // 重置
        reset() {
            localStorage.removeItem(KEYS.TICKETS);
            localStorage.removeItem(KEYS.MESSAGES);
            localStorage.removeItem(KEYS.SEED_VERSION);
            this._init();
        },
    };

    // 初始化
    Store._init();

    // 暴露
    window.WM_USERS = USERS;
    window.WM_TICKET_TYPES = TICKET_TYPES;
    window.WM_TICKET_STATUS = TICKET_STATUS;
    window.WM_STORE = Store;
    window.WM_KEYS = KEYS;
})();

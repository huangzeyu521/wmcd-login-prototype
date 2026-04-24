/* ===== 皖美信用平台 - 共享JS ===== */

// 通用图表配色
window.WM_PALETTE = {
    primary: '#B8141A',
    primaryDark: '#8A0F14',
    secondary: '#0F2A56',
    secondaryLight: '#1F4A8A',
    accent: '#C9A063',
    success: '#2B9348',
    warning: '#E8A33D',
    danger: '#D64045',
    gray: '#7A7A7A',
    chartColors: ['#B8141A', '#0F2A56', '#C9A063', '#2B9348', '#1F4A8A', '#E8A33D', '#D64045', '#A8823E']
};

// 数字滚动动画
window.animateNumber = function(el, target, duration = 1500, decimals = 0) {
    if (!el) return;
    const start = parseFloat(el.textContent) || 0;
    const startTime = performance.now();
    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = start + (target - start) * eased;
        el.textContent = decimals ? val.toFixed(decimals) : Math.floor(val).toLocaleString('zh-CN');
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
};

// 当前时间显示
window.renderClock = function(el) {
    if (!el) return;
    const update = () => {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        el.textContent = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    update();
    setInterval(update, 1000);
};

// 七大智能体元数据
window.WM_AGENTS = [
    {
        id: 'credit',
        name: '信用优化智能体',
        subtitle: 'Credit Optimization',
        desc: '平台核心业务引擎｜全省统一信用管理体系',
        icon: '🏛',
        iconSvg: 'credit',
        page: 'agent-credit.html',
        color: '#B8141A',
        tagline: '信用筑基',
        metric: '覆盖企业', value: '1,248', unit: '家'
    },
    {
        id: 'financing',
        name: '融资支持智能体',
        subtitle: 'Financing Support',
        desc: '信用价值转化器｜融资全流程闭环',
        icon: '💰',
        iconSvg: 'financing',
        page: 'agent-financing.html',
        color: '#0F2A56',
        tagline: '价值变现',
        metric: '融资撮合', value: '1,862', unit: '亿元'
    },
    {
        id: 'investment',
        name: '投资决策智能体',
        subtitle: 'Investment Decision',
        desc: '国有资本布局优化工具｜投资全生命周期',
        icon: '📈',
        iconSvg: 'investment',
        page: 'agent-investment.html',
        color: '#1F4A8A',
        tagline: '决策科学',
        metric: '在投项目', value: '326', unit: '个'
    },
    {
        id: 'assets',
        name: '三资盘活智能体',
        subtitle: 'Assets Activation',
        desc: '数字化产投智能中枢｜资金资产资源统筹',
        icon: '🏗',
        iconSvg: 'assets',
        page: 'agent-assets.html',
        color: '#C9A063',
        tagline: '资产激活',
        metric: '盘活规模', value: '587', unit: '亿元'
    },
    {
        id: 'ma',
        name: '并购工具智能体',
        subtitle: 'M&A Tool',
        desc: '产业链补链强链专家｜并购决策中枢',
        icon: '🔗',
        iconSvg: 'ma',
        page: 'agent-ma.html',
        color: '#8A0F14',
        tagline: '补链强链',
        metric: '候选标的', value: '4,126', unit: '个'
    },
    {
        id: 'supply',
        name: '供应链管理智能体',
        subtitle: 'Supply Chain Mgmt',
        desc: '生态协同治理中心｜供应链全生命周期',
        icon: '🔄',
        iconSvg: 'supply',
        page: 'agent-supply.html',
        color: '#A8823E',
        tagline: '生态协同',
        metric: '合规供应商', value: '8,642', unit: '家'
    },
    {
        id: 'risk',
        name: '风险防控智能体',
        subtitle: 'Risk Control',
        desc: '战略管控神经中枢｜穿透式智慧监管',
        icon: '🛡',
        iconSvg: 'risk',
        page: 'agent-risk.html',
        color: '#D64045',
        tagline: '全域防控',
        metric: '今日预警', value: '27', unit: '条'
    }
];

// 渲染顶部Topbar
window.renderTopbar = function(current) {
    return `
    <div class="wm-topbar">
        <div class="flex items-center justify-between px-8 py-3">
            <div class="flex items-center gap-4">
                <div class="brand-mark">皖</div>
                <div>
                    <div class="brand-text">皖美信用</div>
                    <div class="brand-sub">ANHUI · WAN-MEI CREDIT · 国资国企智能平台</div>
                </div>
                <span class="wm-badge wm-badge-aaa ml-4" style="border-radius:2px;">V2.0</span>
            </div>
            <div class="flex items-center gap-6 text-sm">
                <div class="flex items-center gap-1.5">
                    <span class="wm-light green wm-pulse"></span>
                    <span class="opacity-90">系统运行正常</span>
                </div>
                <div id="wm-clock" class="opacity-80 font-mono"></div>
                <div class="flex items-center gap-4">
                    <button class="hover:text-wm-accent" title="消息">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    </button>
                    <button class="hover:text-wm-accent" title="帮助">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </button>
                    <div class="flex items-center gap-2 px-3 py-1 border border-white/20 rounded">
                        <div class="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-red-900 font-bold flex items-center justify-center text-xs">李</div>
                        <span>李主任 · 省国资委</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="wm-navbar">
            <div class="flex px-6 overflow-x-auto">
                <a class="nav-item ${current==='home'?'active':''}" href="index.html">平台首页</a>
                <a class="nav-item ${current==='credit'?'active':''}" href="agent-credit.html">信用优化</a>
                <a class="nav-item ${current==='financing'?'active':''}" href="agent-financing.html">融资支持</a>
                <a class="nav-item ${current==='investment'?'active':''}" href="agent-investment.html">投资决策</a>
                <a class="nav-item ${current==='assets'?'active':''}" href="agent-assets.html">三资盘活</a>
                <a class="nav-item ${current==='ma'?'active':''}" href="agent-ma.html">并购工具</a>
                <a class="nav-item ${current==='supply'?'active':''}" href="agent-supply.html">供应链管理</a>
                <a class="nav-item ${current==='risk'?'active':''}" href="agent-risk.html">风险防控</a>
                <a class="nav-item ${current==='dashboard'?'active':''}" href="dashboard.html" style="margin-left:auto;">
                    🧭 智慧监管驾驶舱
                </a>
            </div>
        </div>
    </div>`;
};

// 渲染页脚
window.renderFooter = function() {
    return `
    <div class="wm-footer">
        <div class="flex items-center justify-center gap-2 mb-1 flex-wrap">
            <span>© 2026 安徽省国有资产监督管理委员会</span>
            <span class="gold-line">|</span>
            <span>技术支持：远东信用产业集团 · 中国科学技术大学</span>
            <span class="gold-line">|</span>
            <span>皖ICP备 2026XXXXXX 号</span>
        </div>
        <div class="opacity-70" style="font-size:11px;">
            信用筛基 · 数字赋能 · 全面助力安徽省国资国企高质量发展 ｜ 文档依据 GB/T 8567-2006
        </div>
    </div>`;
};

// 数据模拟：生成假的时序数据
window.fakeSeries = function(n, min, max) {
    return Array.from({length: n}, () => Math.round(min + Math.random() * (max - min)));
};

// 工具：随机抖动
window.wobble = function(v, pct) {
    return v * (1 + (Math.random() - 0.5) * pct * 2);
};

// ECharts通用主题配置
window.WM_ECHARTS_THEME = {
    color: ['#B8141A', '#0F2A56', '#C9A063', '#2B9348', '#1F4A8A', '#E8A33D', '#D64045', '#A8823E'],
    textStyle: { fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif' },
    title: { textStyle: { color: '#1A1A1A', fontWeight: 700 } }
};

// 初始化：如果页面有时钟占位符就启动
document.addEventListener('DOMContentLoaded', () => {
    const clockEl = document.getElementById('wm-clock');
    if (clockEl) window.renderClock(clockEl);
});

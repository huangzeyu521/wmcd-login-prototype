/* ================================================================
   皖美信用平台 · 全局交互增强脚本 (interactions.js)
   ----------------------------------------------------------------
   职责：
   1. 左侧导航栏 .sb-item 的点击切换、active 同步、键盘可达、反馈
   2. 所有 .wm-btn 按钮的默认点击反馈（含表格行内小按钮）
   3. 空链接 href="#" / href="" 的拦截并反馈
   4. Toast 提示系统
   5. Ripple 点击涟漪效果（可选增强）
   6. 数据模块切换伪逻辑（基于 data-module 或文本匹配）
   ================================================================ */
(function () {
    'use strict';

    // ============== Toast 系统 ==============
    const TOAST_QUEUE = [];
    let toastContainer = null;

    function ensureToastContainer() {
        if (toastContainer) return toastContainer;
        toastContainer = document.createElement('div');
        toastContainer.className = 'wm-toast-container';
        document.body.appendChild(toastContainer);
        return toastContainer;
    }

    function showToast(msg, type = 'info', duration = 2200) {
        if (!msg) return;
        const container = ensureToastContainer();
        const toast = document.createElement('div');
        toast.className = 'wm-toast wm-toast-' + type;
        const icon = { success: '✓', info: 'ℹ', warn: '⚠', error: '✕' }[type] || 'ℹ';
        toast.innerHTML = '<span class="wm-toast-icon">' + icon + '</span><span>' + msg + '</span>';
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 260);
        }, duration);
    }

    // 暴露到全局
    window.showToast = showToast;

    // ============== 侧边栏增强 ==============
    function enhanceSidebar() {
        const items = document.querySelectorAll('.wm-sidebar .sb-item');
        items.forEach((item) => {
            if (item.dataset.wmBound === '1') return;
            item.dataset.wmBound = '1';

            // a 标签：保留原生跳转，但添加 active 切换
            if (item.tagName === 'A') {
                item.addEventListener('click', function () {
                    items.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                });
                return;
            }

            // div：添加无障碍属性
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.style.cursor = 'pointer';
            item.style.userSelect = 'none';

            // 点击：切换 active + Toast 反馈
            item.addEventListener('click', function (e) {
                // 若点击的是 <a> 子元素（未来扩展），交给原生
                if (e.target.closest('a') && e.target.closest('a') !== this) return;

                items.forEach(i => i.classList.remove('active'));
                this.classList.add('active');

                const label = (this.textContent || '').trim().replace(/\s+/g, ' ');
                showToast('已切换模块：' + label, 'success');

                // 平滑滚动到主内容区（如有 main）
                const main = document.querySelector('main');
                if (main && typeof main.scrollIntoView === 'function') {
                    main.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });

            // 键盘可达（Enter / Space）
            item.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
        return items.length;
    }

    // ============== 按钮增强 ==============
    function enhanceButtons() {
        const btns = document.querySelectorAll('button, .wm-btn, [role="button"]:not(.sb-item)');
        let bound = 0;
        btns.forEach((btn) => {
            if (btn.dataset.wmBound === '1') return;
            // 已有 onclick 或 <a> 带有效 href 的跳过
            if (btn.tagName === 'A' && btn.getAttribute('href') && btn.getAttribute('href') !== '#' && btn.getAttribute('href') !== '') return;
            if (btn.hasAttribute('onclick')) return;

            btn.dataset.wmBound = '1';
            bound++;

            // 确保可点击
            if (!btn.hasAttribute('type') && btn.tagName === 'BUTTON') btn.setAttribute('type', 'button');

            // 点击反馈
            btn.addEventListener('click', function (e) {
                if (this.hasAttribute('disabled')) return;
                const label = (this.textContent || this.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
                if (!label) return;

                // 按钮文字-动作映射（智能反馈）
                const actionMap = {
                    '生成报告': '正在生成报告…',
                    'AI解读': '调用 AI 大模型生成解读…',
                    'AI诊断': '启动 AI 融资诊断…',
                    'AI匹配': '启动 AI 标的匹配引擎…',
                    'AI方案': '启动 AI 方案设计…',
                    'AI评标': '启动 AI 评标引擎…',
                    'AI产研': '启动 AI 产业研究…',
                    'AI处置': '启动 AI 风险处置建议…',
                    '分享授权': '打开分享授权弹窗…',
                    '历史追溯': '加载评级历史记录…',
                    '历史方案': '加载历史融资方案…',
                    '新建融资需求': '打开融资需求创建向导…',
                    '新建尽调': '打开新建尽调工作流…',
                    '新建盘活项目': '打开盘活项目创建向导…',
                    '新建并购': '打开并购项目创建向导…',
                    '发布招标': '打开招标发布向导…',
                    '进入驾驶舱': '跳转至智慧监管驾驶舱…',
                    '成本对比': '加载成本对比分析…',
                    '案例库': '加载全国案例库…',
                    '全部案例': '加载全部案例…',
                    '全部案例': '加载全部案例…',
                    '组合分析': '加载投资组合分析…',
                    '三资估值': '加载三资智能估值…',
                    '采购计划': '加载采购计划…',
                    '黑名单': '加载供应链黑名单库…',
                    '风险报告': '生成风险处置报告…',
                    '处置案例': '加载风险处置案例库…',
                    '调整权重': '打开评级权重配置…',
                    '采纳并分派': '已采纳建议并分派至责任人',
                    '深入': '打开方案深度分析…',
                    '对比': '打开方案对比视图…',
                    '查看画像 →': '打开标的详细画像…',
                    '生成投委会决策包': '生成投委会 Pre-IC 材料…',
                    '查看实时日志': '查看 Multi-Agent 执行日志…',
                    '⏸ 暂停': 'Multi-Agent 工作流已暂停',
                    '一键下发督办': '已下发督办至全省 16 地市…',
                    '📄 生成月度监管报告': '生成月度监管报告…'
                };

                // 提取关键字
                let action = actionMap[label];
                if (!action) {
                    for (const key in actionMap) {
                        if (label.includes(key)) { action = actionMap[key]; break; }
                    }
                }
                if (!action) action = '已触发操作：' + label;

                // 判断类型
                const isPrimary = this.classList.contains('wm-btn-primary');
                const isGold = this.classList.contains('wm-btn-gold');
                const type = isPrimary || isGold ? 'success' : 'info';

                showToast(action, type);
            });
        });
        return bound;
    }

    // ============== 空链接增强 ==============
    function enhanceEmptyLinks() {
        const links = document.querySelectorAll('a[href="#"], a[href=""]');
        let bound = 0;
        links.forEach((a) => {
            if (a.dataset.wmBound === '1') return;
            if (a.classList.contains('sb-item')) return; // 侧边栏 a 已处理
            a.dataset.wmBound = '1';
            bound++;
            a.addEventListener('click', function (e) {
                e.preventDefault();
                const label = (this.textContent || '').trim().replace(/\s+/g, ' ');
                if (label.includes('全部')) {
                    showToast('加载' + label + '…', 'info');
                } else {
                    showToast('已触发：' + (label || '链接'), 'info');
                }
            });
        });
        return bound;
    }

    // ============== 全局点击记录（用于调试） ==============
    function enableClickLog() {
        window.__wmClickLog = [];
        document.addEventListener('click', function (e) {
            const target = e.target.closest('.sb-item, .wm-btn, button, a');
            if (!target) return;
            const entry = {
                tag: target.tagName,
                cls: target.className,
                text: (target.textContent || '').trim().slice(0, 40),
                ts: Date.now()
            };
            window.__wmClickLog.push(entry);
            if (window.__wmClickLog.length > 200) window.__wmClickLog.shift();
        }, true);
    }

    // ============== 主初始化 ==============
    function init() {
        const sbCount = enhanceSidebar();
        const btnCount = enhanceButtons();
        const lnkCount = enhanceEmptyLinks();
        enableClickLog();
        window.__wmEnhance = { sbCount, btnCount, lnkCount, timestamp: Date.now() };
        // Debug
        try { console.log('[WM] interactions enhanced:', window.__wmEnhance); } catch (_) { }
    }

    // 兼容已加载与即将加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // 延迟 50ms，等待 renderTopbar / 动态内容渲染
            setTimeout(init, 50);
        });
    } else {
        setTimeout(init, 50);
    }

    // 监听 DOM 变化，为动态注入的元素补齐绑定（如 renderTopbar 之后）
    const observer = new MutationObserver(() => {
        clearTimeout(observer.__timer);
        observer.__timer = setTimeout(() => {
            enhanceSidebar();
            enhanceButtons();
            enhanceEmptyLinks();
        }, 100);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // 暴露手动触发
    window.wmEnhance = init;
})();

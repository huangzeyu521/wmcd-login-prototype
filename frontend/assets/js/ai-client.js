/* ================================================================
   皖美信用 · AI 前端客户端
   ----------------------------------------------------------------
   功能：
   1. WMAI.call(agent, function, context) → 返回 PanelHandle
   2. WMAI.assistant(message, history) → 全局助手
   3. 自动处理 SSE 流式、思考链、异常、取消
   ================================================================ */
(function () {
    'use strict';

    const WMAI = {};

    // 后端配置
    WMAI.BASE_URL = 'http://127.0.0.1:8766';

    // 默认挂载节点
    WMAI.defaultMount = null;

    /** 简易 Markdown 渲染（轻量） */
    function renderMarkdown(md) {
        if (!md) return '';
        let html = md;

        // 代码块（避免其他规则影响）
        html = html.replace(/```([\s\S]*?)```/g, (m, code) =>
            '<pre><code>' + code.replace(/</g, '&lt;') + '</code></pre>');

        // 标题
        html = html
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // 表格（简单处理）
        html = html.replace(/(\|[^\n]+\|\n)(\|[-\s:|]+\|\n)(\|[^\n]+\|\n?)+/g, (m) => {
            const lines = m.trim().split('\n');
            const head = lines[0].split('|').slice(1, -1).map(s => s.trim());
            const body = lines.slice(2).map(l => l.split('|').slice(1, -1).map(s => s.trim()));
            return '<table><thead><tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr></thead>' +
                '<tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') +
                '</tbody></table>';
        });

        // 粗体、斜体
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

        // 行内代码
        html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

        // 无序列表
        html = html.replace(/^(-|\*) (.+)$/gm, '<li>$2</li>');
        html = html.replace(/(<li>[\s\S]+?<\/li>)(?=\n\n|\n[^<]|$)/g, m => '<ul>' + m + '</ul>');

        // 有序列表
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // 段落
        html = html.replace(/\n\n/g, '</p><p>');
        if (!html.startsWith('<')) html = '<p>' + html;
        if (!html.endsWith('>')) html += '</p>';

        return html;
    }

    /**
     * 流式 SSE 调用
     * options: {
     *   url, body, onEvent(name, data), signal
     * }
     */
    async function sseFetch(url, body, onEvent, signal) {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal,
        });
        if (!resp.ok) {
            let msg = `HTTP ${resp.status}`;
            try {
                const json = await resp.json();
                msg = json.message || msg;
            } catch (_) { }
            onEvent('error', { code: 'http_' + resp.status, message: msg });
            return;
        }
        if (!resp.body) {
            onEvent('error', { code: 'no_body', message: '响应体为空' });
            return;
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buf = '';
        let eventName = 'message';

        while (true) {
            let chunk;
            try {
                chunk = await reader.read();
            } catch (e) {
                if (e.name === 'AbortError') {
                    onEvent('aborted', {});
                    return;
                }
                onEvent('error', { code: 'read_error', message: '连接中断' });
                return;
            }
            if (chunk.done) break;
            buf += decoder.decode(chunk.value, { stream: true });

            // 处理 SSE 帧
            let idx;
            while ((idx = buf.indexOf('\n\n')) >= 0) {
                const frame = buf.slice(0, idx);
                buf = buf.slice(idx + 2);
                let evt = 'message';
                let dataStr = '';
                for (const line of frame.split('\n')) {
                    if (line.startsWith('event:')) evt = line.slice(6).trim();
                    else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
                    else if (line.startsWith(':')) continue; // comment
                }
                if (!dataStr) continue;
                let data;
                try {
                    data = JSON.parse(dataStr);
                } catch (_) {
                    data = dataStr;
                }
                onEvent(evt, data);
                if (evt === 'done' || evt === 'error') return;
            }
        }
    }

    /**
     * 在指定容器渲染 AI 面板
     * @param container HTML元素
     * @param options { title, showThinking, showToolbar }
     */
    WMAI.renderPanel = function (container, options = {}) {
        const html = `
<div class="wm-ai-panel">
    <div class="wm-ai-progress">
        <div class="wm-ai-progress-steps" data-role="steps"></div>
        <div class="wm-ai-step-current" data-role="current"></div>
    </div>
    <div class="wm-ai-body">
        <div class="wm-ai-thinking">
            <div class="wm-ai-thinking-header">
                <span class="wm-ai-thinking-title">AI 思考过程</span>
                <button class="wm-ai-toggle" data-role="toggle-think">折叠</button>
            </div>
            <div class="wm-ai-thinking-body" data-role="thinking">
                <div class="wm-ai-empty">
                    <div class="empty-icon">💭</div>
                    <div>等待启动…</div>
                </div>
            </div>
        </div>
        <div class="wm-ai-result">
            <div class="wm-ai-result-header">
                <span class="wm-ai-result-title">${options.title || 'AI 答复'}</span>
                <span class="wm-ai-meta">
                    <span class="model-badge" data-role="model-badge">qwen3-max-preview</span>
                </span>
            </div>
            <div class="wm-ai-result-body" data-role="content">
                <div class="wm-ai-empty">
                    <div class="empty-icon">✨</div>
                    <div>点击"启动 AI 分析"开始</div>
                </div>
            </div>
        </div>
    </div>
    <div class="wm-ai-toolbar">
        <div class="wm-ai-meta" data-role="meta">
            <span>状态：<strong data-role="status">就绪</strong></span>
            <span data-role="duration"></span>
            <span data-role="tokens"></span>
        </div>
        <div class="wm-ai-actions">
            <button class="wm-btn wm-btn-ghost wm-btn-sm" data-role="cancel" style="display:none;">取消</button>
            <button class="wm-btn wm-btn-ghost wm-btn-sm" data-role="copy" style="display:none;">📋 复制</button>
        </div>
    </div>
</div>`;
        container.innerHTML = html;

        const refs = {
            root: container.querySelector('.wm-ai-panel'),
            steps: container.querySelector('[data-role="steps"]'),
            current: container.querySelector('[data-role="current"]'),
            thinking: container.querySelector('[data-role="thinking"]'),
            content: container.querySelector('[data-role="content"]'),
            status: container.querySelector('[data-role="status"]'),
            duration: container.querySelector('[data-role="duration"]'),
            tokens: container.querySelector('[data-role="tokens"]'),
            cancel: container.querySelector('[data-role="cancel"]'),
            copy: container.querySelector('[data-role="copy"]'),
            toggleThink: container.querySelector('[data-role="toggle-think"]'),
            toolbar: container.querySelector('.wm-ai-toolbar'),
        };

        // 折叠
        refs.toggleThink.addEventListener('click', () => {
            refs.root.classList.toggle('collapsed');
            refs.toggleThink.textContent = refs.root.classList.contains('collapsed') ? '展开' : '折叠';
        });

        return refs;
    };

    /**
     * 核心调用函数
     * @param opts {
     *   container,   // DOM 容器
     *   agent,       // 'credit'|'financing'|...
     *   function,    // 功能ID
     *   context,     // 业务上下文
     *   userId, enterpriseId,
     *   autoStart,   // 是否立即开始
     *   title,
     * }
     * @returns Handle { start(), cancel(), onDone, onError }
     */
    WMAI.call = function (opts) {
        const refs = WMAI.renderPanel(opts.container, { title: opts.title });
        const controller = new AbortController();
        let startedAt = 0;
        let thinkingText = '';
        let contentText = '';
        let lastThinkLine = null;

        const STEP_TOTAL = 6;
        const stepNames = ['数据解析', '规则匹配', '深度推理', '方案生成', '合规校验', '结果输出'];

        // 初始化步骤条
        function renderSteps(activeIdx, statuses) {
            refs.steps.innerHTML = stepNames.map((n, i) => {
                const s = (statuses && statuses[i]) || (i < activeIdx ? 'done' : i === activeIdx ? 'running' : 'wait');
                return `<div class="wm-ai-step ${s}">
                    <div class="wm-ai-step-dot">${s === 'done' ? '✓' : s === 'warning' ? '!' : i + 1}</div>
                    <div class="wm-ai-step-label">${n}</div>
                </div>`;
            }).join('');
        }

        renderSteps(-1, []);

        const statuses = new Array(STEP_TOTAL).fill('wait');

        function updateStatus(text) { refs.status.textContent = text; }
        function updateDuration() {
            if (startedAt) {
                const s = ((Date.now() - startedAt) / 1000).toFixed(1);
                refs.duration.textContent = `用时 ${s}s`;
            }
        }
        const durationTimer = setInterval(updateDuration, 200);

        const onEventHandlers = {};
        const handle = {
            on(evt, fn) { onEventHandlers[evt] = fn; return handle; },
            cancel() {
                controller.abort();
                updateStatus('已取消');
                clearInterval(durationTimer);
            },
            async start(overrideContext) {
                const ctx = overrideContext || opts.context;
                startedAt = Date.now();
                thinkingText = '';
                contentText = '';
                refs.thinking.innerHTML = '';
                refs.content.innerHTML = '';
                refs.cancel.style.display = '';
                refs.copy.style.display = 'none';
                updateStatus('正在连接大模型…');

                refs.cancel.onclick = () => handle.cancel();

                const url = opts.agent === 'common' && opts.function === 'assistant_chat'
                    ? `${WMAI.BASE_URL}/api/ai/assistant/stream`
                    : `${WMAI.BASE_URL}/api/ai/agent/${opts.agent}/stream`;

                const body = opts.agent === 'common' && opts.function === 'assistant_chat'
                    ? {
                        message: (ctx || {}).message,
                        history: (ctx || {}).history || [],
                        user_id: opts.userId, user_role: (ctx || {}).user_role,
                    }
                    : {
                        function: opts.function,
                        context: ctx || {},
                        user_id: opts.userId,
                        enterprise_id: opts.enterpriseId,
                    };

                try {
                    await sseFetch(url, body, (evt, data) => {
                        if (evt === 'step') {
                            const idx = (data.step || 1) - 1;
                            statuses[idx] = data.status || 'running';
                            // 已完成的前置步骤标记为 done
                            for (let i = 0; i < idx; i++) if (statuses[i] === 'running') statuses[i] = 'done';
                            renderSteps(idx, statuses);
                            refs.current.textContent = `【${data.name}】${data.msg || ''}`;
                            updateStatus(data.name);
                        } else if (evt === 'thinking') {
                            // 清空 empty
                            if (refs.thinking.querySelector('.wm-ai-empty')) refs.thinking.innerHTML = '';
                            thinkingText += data;
                            // 按换行切成多个 div
                            const lines = thinkingText.split('\n');
                            refs.thinking.innerHTML = lines.filter(l => l.trim()).map((l, i) => `
                                <div class="tk-line ${i === lines.length - 1 ? 'fresh' : ''}">${escapeHtml(l)}</div>
                            `).join('');
                            refs.thinking.scrollTop = refs.thinking.scrollHeight;
                        } else if (evt === 'content') {
                            if (refs.content.querySelector('.wm-ai-empty')) refs.content.innerHTML = '';
                            contentText += data;
                            refs.content.innerHTML = renderMarkdown(contentText) +
                                '<span class="typing-cursor"></span>';
                            refs.content.scrollTop = refs.content.scrollHeight;
                        } else if (evt === 'token') {
                            if (data.total_tokens) {
                                refs.tokens.textContent = `Token ${data.total_tokens}`;
                            }
                        } else if (evt === 'done') {
                            // 全部步骤完成
                            for (let i = 0; i < STEP_TOTAL; i++) {
                                if (statuses[i] !== 'warning') statuses[i] = 'done';
                            }
                            renderSteps(STEP_TOTAL - 1, statuses);
                            // 移除光标
                            refs.content.innerHTML = renderMarkdown(contentText);
                            refs.current.textContent = '✓ 生成完成';
                            refs.current.style.color = 'var(--color-success)';
                            updateStatus('完成');
                            refs.cancel.style.display = 'none';
                            refs.copy.style.display = '';
                            refs.copy.onclick = () => {
                                navigator.clipboard.writeText(contentText);
                                window.showToast && window.showToast('已复制到剪贴板', 'success');
                            };
                            clearInterval(durationTimer);
                            onEventHandlers.done && onEventHandlers.done(contentText);
                        } else if (evt === 'error') {
                            showError(data);
                            onEventHandlers.error && onEventHandlers.error(data);
                            clearInterval(durationTimer);
                        } else if (evt === 'aborted') {
                            refs.current.textContent = '已取消';
                            updateStatus('已取消');
                            refs.cancel.style.display = 'none';
                            clearInterval(durationTimer);
                        }
                    }, controller.signal);
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        showError({ code: 'network', message: '无法连接 AI 后端服务（请确认 http://127.0.0.1:8766 已启动）' });
                    }
                    clearInterval(durationTimer);
                }
            },
        };

        function showError(err) {
            const html = `
<div class="wm-ai-error">
    <div class="wm-ai-error-icon">⚠</div>
    <div class="wm-ai-error-body">
        <div class="wm-ai-error-title">大模型调用异常</div>
        <div class="wm-ai-error-hint">${escapeHtml(err.message || '未知错误')}（错误码: ${err.code || '-'}）· 您的输入已保留。</div>
        <a href="#" class="wm-ai-error-retry" data-role="retry">🔄 重试</a>
    </div>
</div>`;
            // 放在 toolbar 上面
            const existing = refs.root.querySelector('.wm-ai-error');
            if (existing) existing.remove();
            refs.toolbar.insertAdjacentHTML('beforebegin', html);
            refs.root.querySelector('[data-role="retry"]').addEventListener('click', (e) => {
                e.preventDefault();
                refs.root.querySelector('.wm-ai-error').remove();
                handle.start();
            });
            updateStatus('调用失败');
            refs.cancel.style.display = 'none';
        }

        if (opts.autoStart !== false) handle.start();
        return handle;
    };

    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/[&<>"]/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    }

    WMAI.renderMarkdown = renderMarkdown;

    /** 全局 AI 助手（右下角悬浮） */
    WMAI.mountAssistant = function () {
        if (document.getElementById('wm-ai-fab')) return;

        const fab = document.createElement('button');
        fab.id = 'wm-ai-fab';
        fab.className = 'wm-ai-assistant-fab';
        fab.title = '皖美 AI 助手';
        fab.innerHTML = '🤖';
        document.body.appendChild(fab);

        const drawer = document.createElement('div');
        drawer.className = 'wm-assistant-drawer';
        drawer.innerHTML = `
            <div class="wm-assistant-header">
                <div class="wm-assistant-title">
                    <span>🤖</span>
                    <span>皖美 AI 助手</span>
                    <span style="font-size:10px;opacity:0.8;margin-left:6px;">qwen3-max-preview</span>
                </div>
                <div style="cursor:pointer;font-size:20px;" data-role="close">×</div>
            </div>
            <div class="wm-assistant-body" data-role="body">
                <div class="wm-assistant-msg ai">
                    您好！我是皖美信用平台 AI 助手。您可以问我：<br>
                    · 国资监管政策解读<br>
                    · 平台功能导航<br>
                    · 业务快速咨询<br>
                    · 跨智能体协同建议
                </div>
            </div>
            <div class="wm-assistant-footer">
                <textarea class="wm-assistant-input" rows="1" placeholder="输入问题（Enter 发送 · Shift+Enter 换行）" data-role="input"></textarea>
                <button class="wm-assistant-send" data-role="send">发送</button>
            </div>`;
        document.body.appendChild(drawer);

        const body = drawer.querySelector('[data-role="body"]');
        const input = drawer.querySelector('[data-role="input"]');
        const send = drawer.querySelector('[data-role="send"]');
        const close = drawer.querySelector('[data-role="close"]');
        const history = [];

        fab.addEventListener('click', () => {
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) input.focus();
        });
        close.addEventListener('click', () => drawer.classList.remove('open'));

        async function sendMessage() {
            const msg = input.value.trim();
            if (!msg) return;
            input.value = '';
            send.disabled = true;

            // 用户消息
            body.insertAdjacentHTML('beforeend', `<div class="wm-assistant-msg user">${escapeHtml(msg)}</div>`);

            // AI 消息占位
            const aiEl = document.createElement('div');
            aiEl.className = 'wm-assistant-msg ai';
            aiEl.innerHTML = '<div class="thinking-compact" data-role="think">正在思考…</div><div data-role="content"></div>';
            body.appendChild(aiEl);
            body.scrollTop = body.scrollHeight;

            const thinkEl = aiEl.querySelector('[data-role="think"]');
            const contentEl = aiEl.querySelector('[data-role="content"]');
            let thinkingAcc = '';
            let contentAcc = '';

            // 获取当前用户角色
            let role = 'user';
            try {
                if (window.WM_AUTH && window.WM_AUTH.currentUser()) {
                    role = window.WM_AUTH.currentUser().roleLabel;
                }
            } catch (_) { }

            try {
                await sseFetch(
                    `${WMAI.BASE_URL}/api/ai/assistant/stream`,
                    { message: msg, history, user_role: role },
                    (evt, data) => {
                        if (evt === 'thinking') {
                            thinkingAcc += data;
                            thinkEl.textContent = thinkingAcc.slice(-200);
                        } else if (evt === 'content') {
                            contentAcc += data;
                            contentEl.innerHTML = renderMarkdown(contentAcc);
                            body.scrollTop = body.scrollHeight;
                        } else if (evt === 'done') {
                            thinkEl.classList.add('collapsed');
                            thinkEl.style.display = thinkingAcc ? 'block' : 'none';
                        } else if (evt === 'error') {
                            thinkEl.style.display = 'none';
                            contentEl.innerHTML = `<div style="color:#D64045;">⚠ ${escapeHtml(data.message)}</div>`;
                        }
                    }
                );
                history.push({ role: 'user', content: msg });
                history.push({ role: 'assistant', content: contentAcc });
            } catch (e) {
                thinkEl.style.display = 'none';
                contentEl.innerHTML = `<div style="color:#D64045;">⚠ AI 后端未连接（请确认 http://127.0.0.1:8766 已启动）</div>`;
            } finally {
                send.disabled = false;
            }
        }

        send.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(80, input.scrollHeight) + 'px';
        });
    };

    window.WMAI = WMAI;

    // 自动挂载助手（在所有已登录页面）
    document.addEventListener('DOMContentLoaded', () => {
        // 延迟到 WM_AUTH 初始化后
        setTimeout(() => {
            try {
                if (window.WM_AUTH && window.WM_AUTH.isLoggedIn()) {
                    WMAI.mountAssistant();
                }
            } catch (_) { }
        }, 300);
    });
})();

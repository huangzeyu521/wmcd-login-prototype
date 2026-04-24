"""dispatchEvent 派发原生 PointerEvent 模拟真实拖拽"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/pages/login.html"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, storage_state=None)
    page = ctx.new_page()
    page.on("console", lambda m: print(f"[{m.type}]", m.text))
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)

    # 在 JS 中派发完整 pointer 事件序列
    result = page.evaluate("""() => {
        const h = document.querySelector('[data-role="handle-group"]');
        if (!h) return { ok: false, err: 'no handle' };
        const rect = h.getBoundingClientRect();
        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;

        const fire = (type, clientY, pointerId) => {
            const ev = new PointerEvent(type, {
                bubbles: true,
                cancelable: true,
                composed: true,
                pointerId: pointerId || 1,
                pointerType: 'mouse',
                clientX: cx,
                clientY: clientY,
                button: 0,
                buttons: type === 'pointerup' ? 0 : 1,
                isPrimary: true
            });
            h.dispatchEvent(ev);
        };

        // down
        fire('pointerdown', cy);

        // move 10 step, each +8px
        const moves = [];
        for (let i = 1; i <= 10; i++) {
            const y = cy + i * 8;
            const ev = new PointerEvent('pointermove', {
                bubbles: true, cancelable: true, composed: true,
                pointerId: 1, pointerType: 'mouse',
                clientX: cx, clientY: y, button: 0, buttons: 1, isPrimary: true
            });
            window.dispatchEvent(ev);
            moves.push(y);
        }
        // up
        const upEv = new PointerEvent('pointerup', {
            bubbles: true, cancelable: true, composed: true,
            pointerId: 1, pointerType: 'mouse',
            clientX: cx, clientY: cy + 80, button: 0, buttons: 0, isPrimary: true
        });
        window.dispatchEvent(upEv);

        return { ok: true, cx, cy, moves };
    }""")
    print("派发结果:", result)

    page.wait_for_timeout(1500)
    stage = page.locator('html').get_attribute('data-stage')
    fsm_state = page.evaluate("() => window.WMLogin?.Controller?.fsm?.get()")
    drag_y_max = page.evaluate("() => window.WMLogin?.Controller?.dragY")
    print(f"\nfinal stage = {stage}, fsm = {fsm_state}, dragY = {drag_y_max}")

    browser.close()

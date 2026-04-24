"""视觉诊断 · 检查字段 opacity 与水印"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/pages/login.html"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, storage_state=None)
    page = ctx.new_page()
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    # 启封
    page.locator('[data-role="handle-group"]').focus()
    page.keyboard.press("Enter")
    page.wait_for_timeout(2800)

    # 查询每个字段的可见性
    fields = page.evaluate("""() => {
        const items = Array.from(document.querySelectorAll('.wm-scroll-inner > *'));
        return items.map((el, i) => {
            const cs = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                idx: i + 1,
                tag: el.tagName,
                cls: el.className,
                opacity: cs.opacity,
                display: cs.display,
                visibility: cs.visibility,
                height: rect.height,
                top: rect.top,
                inView: rect.top >= 0 && rect.top < 900,
                nthChild: i + 1
            };
        });
    }""")
    for f in fields:
        print(f"  #{f['idx']} <{f['tag']}.{f['cls']}> opacity={f['opacity']} h={f['height']:.0f} top={f['top']:.0f} inView={f['inView']}")

    # 查询 watermark
    wm = page.evaluate("""() => {
        const el = document.querySelector('.wm-watermark');
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { opacity: cs.opacity, fontSize: cs.fontSize, top: r.top, left: r.left, w: r.width, h: r.height };
    }""")
    print(f"\nwatermark: {wm}")

    # 查询 scroll 容器
    scroll = page.evaluate("""() => {
        const s = document.querySelector('.wm-scroll');
        const cs = getComputedStyle(s);
        const r = s.getBoundingClientRect();
        return { maxHeight: cs.maxHeight, opacity: cs.opacity, h: r.height, w: r.width, top: r.top };
    }""")
    print(f"scroll: {scroll}")

    browser.close()

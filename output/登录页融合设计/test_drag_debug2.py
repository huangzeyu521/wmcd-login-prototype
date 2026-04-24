"""深度 pointer 调试"""
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

    # 注入事件监听器
    page.evaluate("""() => {
        const h = document.querySelector('[data-role="handle-group"]');
        ['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','click'].forEach(t => {
            h.addEventListener(t, (e) => { console.log('EVT:', t, 'at', e.clientX, e.clientY); });
        });
    }""")

    handle = page.locator('[data-role="handle-group"]')
    box = handle.bounding_box()
    print(f"handle box: {box}")
    cx = box["x"] + box["width"]/2
    cy = box["y"] + box["height"]/2
    print(f"mouse click target: ({cx}, {cy})")

    page.mouse.move(cx, cy)
    page.wait_for_timeout(200)
    page.mouse.down()
    page.wait_for_timeout(200)
    page.mouse.move(cx, cy + 30)
    page.wait_for_timeout(100)
    page.mouse.move(cx, cy + 60)
    page.wait_for_timeout(100)
    page.mouse.up()
    page.wait_for_timeout(1500)

    stage = page.locator('html').get_attribute('data-stage')
    print(f"final stage = {stage}")

    browser.close()

"""精确拖拽调试 · 清 storage 后直接从 SEALED 拖拽"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/pages/login.html"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 1440, "height": 900},
        storage_state=None,
    )
    page = ctx.new_page()
    page.on("console", lambda m: print(f"[console.{m.type}]", m.text))
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(500)
    # 清理存储
    page.evaluate("() => { sessionStorage.clear(); }")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(800)

    print(f"init stage = {page.locator('html').get_attribute('data-stage')}")
    print(f"init theme = {page.locator('html').get_attribute('data-theme')}")

    # 方法 1: 直接 dispatchEvent 派发 pointer 事件
    print("\n--- 尝试 dispatchEvent 派发 pointer 事件 ---")
    handle = page.locator('[data-role="handle-group"]')
    box = handle.bounding_box()
    print(f"handle box: {box}")
    cx = box["x"] + box["width"]/2
    cy = box["y"] + box["height"]/2

    # 原生拖拽方式（Pointer Events）
    page.mouse.move(cx, cy)
    page.wait_for_timeout(50)
    page.mouse.down()
    page.wait_for_timeout(50)
    # 逐步增大
    for dy in range(6, 101, 6):
        page.mouse.move(cx, cy + dy)
        page.wait_for_timeout(15)
    page.wait_for_timeout(150)
    page.mouse.up()
    page.wait_for_timeout(1500)

    stage = page.locator('html').get_attribute('data-stage')
    print(f"\n after drag stage = {stage}")

    # 如果仍失败，尝试 fsm 调试
    fsm_state = page.evaluate("() => window.WMLogin?.Controller?.fsm?.get()")
    drag_active = page.evaluate("() => window.WMLogin?.Controller?.dragActive")
    drag_y = page.evaluate("() => window.WMLogin?.Controller?.dragY")
    print(f"fsm={fsm_state}, dragActive={drag_active}, dragY={drag_y}")

    page.screenshot(path="D:/MyAIProject/CreditAgent7/output/登录页融合设计/screenshots/debug_after_drag.png")
    browser.close()

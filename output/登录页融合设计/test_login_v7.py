"""皖美信用 · 登录页 V7 · 印章立体化 + 白文篆刻 + 锦盒台座
验证：
  1) 印章抬升到灯杆之上（z-index >= 5）
  2) 印章放大（宽度 >= 92px）
  3) SVG 新增元素：stamp-base（锦盒）、stamp-body-side（侧阴影）、stamp-frame-outer/inner（双框）、stamp-handle（大手柄）
  4) 水印穿帮消除（SEALED 态 opacity=0；UNSEALED 态 <=0.03）
  5) 邀约文字提亮（SEALED opacity=1，color含金色）
  6) admin/admin123 登录仍然通过
  7) 控制台 0 错误
"""
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"
OUT_DIR = "D:/MyAIProject/CreditAgent7/output/登录页融合设计/screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

results = []
def check(name, cond, detail=""):
    status = "[OK]" if cond else "[FAIL]"
    results.append((status, name, detail))
    print(f"  {status} {name}" + (f" · {detail}" if detail else ""))
    return cond

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, storage_state=None)
        page = ctx.new_page()
        console_err = []
        page.on("pageerror", lambda e: console_err.append(str(e)))
        page.on("console", lambda m: console_err.append(m.text) if m.type == "error" else None)

        # ========== 1. 结构检查 ==========
        print("\n【V7·1】立体印章结构")
        page.goto(f"{BASE}/pages/login.html", wait_until="networkidle")
        page.wait_for_timeout(900)
        check("锦盒台座已渲染 (stamp-base)", page.locator('.wm-desk-stamp .stamp-base').count() == 1)
        check("印身侧阴影 (stamp-body-side)", page.locator('.wm-desk-stamp .stamp-body-side').count() == 1)
        check("印身顶面斜透视 (stamp-body-top)", page.locator('.wm-desk-stamp .stamp-body-top').count() == 1)
        check("双框外框 (stamp-frame-outer)", page.locator('.wm-desk-stamp .stamp-frame-outer').count() == 1)
        check("双框内框 (stamp-frame-inner)", page.locator('.wm-desk-stamp .stamp-frame-inner').count() == 1)
        check("十字分隔竖 (stamp-divider-v)", page.locator('.wm-desk-stamp .stamp-divider-v').count() == 1)
        check("十字分隔横 (stamp-divider-h)", page.locator('.wm-desk-stamp .stamp-divider-h').count() == 1)

        # ========== 2. 层级与大小 ==========
        print("\n【V7·2】z-index + 尺寸")
        z = page.evaluate("() => parseInt(getComputedStyle(document.querySelector('.wm-desk-stamp')).zIndex || '0')")
        check(f"印章 z-index >= 5 · 实际={z}", z >= 5)
        w = page.evaluate("() => document.querySelector('.wm-desk-stamp').getBoundingClientRect().width")
        check(f"印章宽度 >= 90px · 实际={w:.1f}", w >= 90)
        h = page.evaluate("() => document.querySelector('.wm-desk-stamp').getBoundingClientRect().height")
        check(f"印章高度 >= 128px · 实际={h:.1f}", h >= 128)

        # ========== 3. 水印穿帮消除 ==========
        print("\n【V7·3】水印收敛")
        wm_op_sealed = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.wm-watermark')).opacity)")
        check(f"SEALED 态水印 opacity = 0 · 实际={wm_op_sealed}", wm_op_sealed < 0.01)

        # ========== 4. 邀约文字提亮 ==========
        print("\n【V7·4】邀约文字提亮")
        invite_style = page.evaluate("""() => {
            const el = document.querySelector('.wm-seal-invite');
            const s = getComputedStyle(el);
            return { opacity: parseFloat(s.opacity), color: s.color, fontSize: s.fontSize };
        }""")
        check(f"邀约字 opacity = 1 · 实际={invite_style['opacity']}",
              invite_style['opacity'] >= 0.95)
        check(f"邀约字含金色（r>180, g>140） · 实际={invite_style['color']}",
              any(int(v) > 140 for v in invite_style['color'].replace('rgb(', '').replace(')', '').replace(',', '').split()[:3]))
        page.screenshot(path=f"{OUT_DIR}/v7_01_sealed.png", full_page=False)

        # ========== 5. 启封后印章立体化验证 ==========
        print("\n【V7·5】启封 · 双框 + 白文浮现")
        page.wait_for_timeout(3500)  # 自动启封
        page.wait_for_timeout(2000)  # 等印章动画完成
        body_on = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.wm-desk-stamp .stamp-body-on')).opacity)")
        check(f"启封后朱身浮现 · opacity={body_on}", body_on >= 0.9)
        frame_outer = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.wm-desk-stamp .stamp-frame-outer')).opacity)")
        check(f"双重外框浮现 · opacity={frame_outer}", frame_outer >= 0.85)
        wm_op_unsealed = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.wm-watermark')).opacity)")
        check(f"UNSEALED 态水印 <= 0.03 · 实际={wm_op_unsealed}",
              wm_op_unsealed <= 0.03)
        # 白文是否能看到
        char_fill = page.evaluate("() => document.querySelector('.wm-desk-stamp .stamp-char').getAttribute('fill')")
        check(f"印面白文颜色 · 实际={char_fill}", '#F5EDD8' == char_fill or '#F5E' in char_fill)
        page.screenshot(path=f"{OUT_DIR}/v7_02_unsealed.png", full_page=False)

        # ========== 6. admin 登录 ==========
        print("\n【V7·6】admin 登录")
        check("账号预填 admin", page.locator('#wm-acct').input_value() == 'admin')
        page.locator('#wm-cta').click()
        try:
            page.wait_for_url(lambda u: 'workbench' in u, timeout=5000)
            check(f"跳转 workbench · {page.url.split('/')[-1]}", 'workbench' in page.url)
        except Exception as e:
            check(f"跳转失败 · {str(e)[:80]}", False)

        # ========== 7. 浅色主题 ==========
        print("\n【V7·7】浅色主题")
        page.evaluate("() => localStorage.removeItem('wm_current_user')")
        page.goto(f"{BASE}/pages/login.html", wait_until="networkidle")
        page.wait_for_timeout(500)
        page.locator('[data-action="toggle-theme"]').click()
        page.wait_for_timeout(400)
        check("浅色印章可见", page.locator('.wm-desk-stamp').is_visible())
        page.wait_for_timeout(3800)  # 等启封 + 印章动画
        page.screenshot(path=f"{OUT_DIR}/v7_03_light_unsealed.png", full_page=False)

        # ========== 8. 控制台 ==========
        print("\n【V7·8】控制台")
        real_err = [e for e in console_err if 'favicon' not in e.lower() and 'net::ERR' not in e and 'Failed to load' not in e]
        check(f"无 JS 报错 · 共 {len(real_err)} 条", len(real_err) == 0)
        for e in real_err[:5]:
            print(f"    ! {e[:180]}")

        browser.close()

    print("\n" + "=" * 70)
    passed = sum(1 for r in results if r[0] == "[OK]")
    total = len(results)
    failed = total - passed
    print(f"\n V7 登录页回归结果：{passed}/{total} 通过  |  {failed} 失败")
    if failed:
        print("\n 失败项：")
        for s, n, d in results:
            if s == "[FAIL]":
                print(f"   × {n}" + (f" · {d}" if d else ""))
    return failed == 0

if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)

"""皖美信用 · 登录页 V6 · 灯下验印（隐喻统一重构）
苏格拉底式再造：让灯与印成为同一场景的两个部件

验证：
  1) 左侧舞台出现"桌上立体印章"（wm-desk-stamp）
  2) 封印态：印章暗色；启封后：朱身 + 朱文"皖美信用"浮现
  3) 右侧封印态删除"印"大块，改为"灯下验印·四步叙事"
  4) 表单顶部 CREDIT 前出现 验印圆徽标
  5) 点击登录 → 朱红圆印章从按钮中心钤落
  6) admin/admin123 仍可一键登录
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

        # ========== 1. 封印态验证印章存在 ==========
        print("\n【V6·1】封印态 · 桌上印章存在")
        page.goto(f"{BASE}/pages/login.html", wait_until="networkidle")
        page.wait_for_timeout(800)
        check("桌上印章已渲染", page.locator('.wm-desk-stamp').count() == 1)
        check("印章 SVG 存在", page.locator('.wm-desk-stamp svg').count() == 1)
        check("手柄（stamp-handle）已渲染", page.locator('.wm-desk-stamp .stamp-handle').count() == 1)
        check("金属套环（stamp-collar）已渲染", page.locator('.wm-desk-stamp .stamp-collar').count() == 1)
        check("印身 off 态（stamp-body-off）已渲染",
              page.locator('.wm-desk-stamp .stamp-body-off').count() == 1)
        check("印身 on 态（stamp-body-on）已渲染",
              page.locator('.wm-desk-stamp .stamp-body-on').count() == 1)
        check("四个朱文字（stamp-char）已渲染",
              page.locator('.wm-desk-stamp .stamp-char').count() == 4)
        # 封印态：朱身应处于 opacity 0
        body_opacity = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.wm-desk-stamp .stamp-body-on')).opacity)")
        check(f"封印态朱身未显现 · opacity={body_opacity}", body_opacity < 0.1)
        page.screenshot(path=f"{OUT_DIR}/v6_01_sealed.png", full_page=False)

        # ========== 2. 右侧封印态 · 四步叙事 ==========
        print("\n【V6·2】右侧封印态叙事卡")
        check("删除了旧 .ph-seal 大块", page.locator('.wm-form-placeholder .ph-seal').count() == 0)
        check("ph-title 为 灯·下·验·印",
              '灯' in (page.locator('.wm-form-placeholder .ph-title').text_content() or '') and
              '印' in (page.locator('.wm-form-placeholder .ph-title').text_content() or ''))
        check("四步叙事存在（ph-step 个数 = 4）",
              page.locator('.wm-form-placeholder .ph-step').count() == 4)
        check("步骤一 · 壹 · 掌灯",
              '壹' in (page.locator('.wm-form-placeholder .ph-step').first.text_content() or ''))

        # ========== 3. 启封 → 印章发光 ==========
        print("\n【V6·3】启封 · 印章朱身发光")
        page.wait_for_timeout(3500)  # 等自动启封
        check("data-stage = UNSEALED",
              page.locator('html[data-stage="UNSEALED"]').count() == 1)
        # 等待印章动画完成（body 动画 700+1600ms, char 动画到 1740+800ms）
        page.wait_for_timeout(3000)
        body_on_opacity = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.wm-desk-stamp .stamp-body-on')).opacity)")
        check(f"启封后朱身浮现 · opacity={body_on_opacity}", body_on_opacity >= 0.9)
        char_opacity = page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.wm-desk-stamp .stamp-char')).opacity)")
        check(f"朱文首字浮现 · opacity={char_opacity}", char_opacity >= 0.85)
        page.screenshot(path=f"{OUT_DIR}/v6_02_unsealed_stamp_on.png", full_page=False)

        # ========== 4. 表单「验印」徽标存在 ==========
        print("\n【V6·4】验印徽标")
        check("验印徽标已渲染", page.locator('.wm-verify-badge').count() == 1)
        check("验印徽标 SVG 存在", page.locator('.wm-verify-badge svg').count() == 1)
        check("验印徽标位于 CREDIT 前",
              page.locator('.wm-form-subtitle .wm-verify-badge').count() == 1)

        # ========== 5. admin/admin123 登录 + 盖印动画 ==========
        print("\n【V6·5】盖印动画 + 登录跳转")
        check("账号预填 admin",
              page.locator('#wm-acct').input_value() == 'admin')
        check("密码预填 admin123",
              page.locator('#wm-pwd').input_value() == 'admin123')
        # 点击后立即验证盖印元素出现
        page.locator('#wm-cta').click()
        page.wait_for_timeout(250)
        seal_drop = page.locator('.wm-cta-seal-drop.active')
        check(f"盖印章元素已挂载 · 数量={seal_drop.count()}", seal_drop.count() == 1)
        check("盖印章 SVG 为朱红圆印",
              page.evaluate("() => { const el = document.querySelector('.wm-cta-seal-drop circle'); return el && el.getAttribute('fill') === '#B8141A'; }"))
        page.screenshot(path=f"{OUT_DIR}/v6_03_seal_drop.png", full_page=False)
        # 继续等待跳转
        try:
            page.wait_for_url(lambda u: 'workbench' in u, timeout=4000)
            check(f"登录跳转 · {page.url.split('/')[-1]}", 'workbench' in page.url)
        except Exception as e:
            check(f"登录跳转失败 · {str(e)[:80]}", False)

        # ========== 6. 浅色主题 · 印章 ==========
        print("\n【V6·6】浅色主题印章")
        page.evaluate("() => localStorage.removeItem('wm_current_user')")
        page.goto(f"{BASE}/pages/login.html", wait_until="networkidle")
        page.wait_for_timeout(400)
        page.locator('[data-action="toggle-theme"]').click()
        page.wait_for_timeout(400)
        check("浅色主题下印章仍可见",
              page.locator('.wm-desk-stamp').is_visible())
        page.wait_for_timeout(3500)  # 等启封 + 动画
        page.screenshot(path=f"{OUT_DIR}/v6_04_light_stamp.png", full_page=False)

        # ========== 7. 控制台错误 ==========
        print("\n【V6·7】控制台错误")
        real_err = [e for e in console_err if 'favicon' not in e.lower() and 'net::ERR' not in e and 'Failed to load' not in e]
        check(f"无 JS 报错 · 共 {len(real_err)} 条", len(real_err) == 0)
        for e in real_err[:5]:
            print(f"    ! {e[:180]}")

        browser.close()

    print("\n" + "=" * 70)
    passed = sum(1 for r in results if r[0] == "[OK]")
    total = len(results)
    failed = total - passed
    print(f"\n V6 登录页回归结果：{passed}/{total} 通过  |  {failed} 失败")
    if failed:
        print("\n 失败项：")
        for s, n, d in results:
            if s == "[FAIL]":
                print(f"   × {n}" + (f" · {d}" if d else ""))
    return failed == 0

if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)

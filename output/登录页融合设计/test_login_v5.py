"""皖美信用 · 登录页 V5 资深设计师优化 · 自动化回归
验证：
  1) 封印态指示卡升级（大卡 + 倒计时环）
  2) 3s 自动启封 → 表单浮现
  3) admin/admin123 预填正确
  4) 测试凭证便签可见
  5) 点击"核验并登录" → 成功跳转 workbench
  6) 控制台 0 错误
  7) 深/浅色主题切换无破坏
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

        # ========== 1. 封印态加载（深色） ==========
        print("\n【V5·1】封印态加载")
        page.goto(f"{BASE}/pages/login.html", wait_until="networkidle")
        page.wait_for_timeout(800)
        check("页面 data-stage 为 SEALED", page.locator('html[data-stage="SEALED"]').count() == 1)
        check("封印指示卡已渲染", page.locator('.wm-form-placeholder').is_visible())
        check("倒计时环已渲染", page.locator('#wm-autostart-ring svg').count() == 1)
        check("倒计时提示文字正确",
              '3 秒后自动启封' in (page.locator('#wm-autostart-hint').text_content() or ''))
        check("封印大字已升级至 40px 级别",
              float(page.evaluate("() => parseFloat(getComputedStyle(document.querySelector('.wm-form-placeholder .ph-seal')).fontSize)")) >= 30)
        page.screenshot(path=f"{OUT_DIR}/v5_01_sealed_dark.png", full_page=False)

        # ========== 2. 3s 自动启封 ==========
        print("\n【V5·2】3s 自动启封")
        page.wait_for_timeout(3500)
        check("data-stage 已切换为 UNSEALED",
              page.locator('html[data-stage="UNSEALED"]').count() == 1)
        check("表单卡已可见（max-height 展开）",
              page.locator('.wm-scroll').is_visible())
        page.screenshot(path=f"{OUT_DIR}/v5_02_unsealed_dark.png", full_page=False)

        # ========== 3. admin/admin123 预填 ==========
        print("\n【V5·3】admin/admin123 预填")
        acct_val = page.locator('#wm-acct').input_value()
        pwd_val  = page.locator('#wm-pwd').input_value()
        check(f"账号字段已预填 admin · 实际='{acct_val}'", acct_val == 'admin')
        check(f"密码字段已预填 admin123 · 实际长度={len(pwd_val)}", pwd_val == 'admin123')
        check("测试凭证便签可见", page.locator('.wm-cred-hint').is_visible())
        check("便签中含 admin 代码块",
              page.locator('.wm-cred-hint code').count() >= 2)

        # ========== 4. 点击登录 → 跳转 workbench ==========
        print("\n【V5·4】登录跳转")
        try:
            with page.expect_navigation(timeout=6000):
                page.locator('#wm-cta').click()
            url = page.url
            check(f"已跳转 workbench · {url.split('/')[-1]}", 'workbench' in url)
        except Exception as e:
            check(f"登录失败 · {str(e)[:100]}", False)

        # ========== 5. 验证当前用户是 admin（U000） ==========
        print("\n【V5·5】当前用户验证")
        cur = page.evaluate("() => JSON.parse(localStorage.getItem('wm_current_user'))")
        check(f"当前用户 ID = U000 · 实际={cur and cur.get('id')}",
              cur and cur.get('id') == 'U000')
        check(f"当前用户 shortName = admin · 实际={cur and cur.get('shortName')}",
              cur and cur.get('shortName') == 'admin')
        check(f"当前用户拥有 * 权限 · 实际={cur and cur.get('permissions')}",
              cur and '*' in (cur.get('permissions') or []))
        page.screenshot(path=f"{OUT_DIR}/v5_03_workbench.png", full_page=False)

        # ========== 6. 登出回到登录页，测试浅色主题 ==========
        print("\n【V5·6】浅色主题")
        page.evaluate("() => localStorage.removeItem('wm_current_user')")
        page.goto(f"{BASE}/pages/login.html", wait_until="networkidle")
        page.wait_for_timeout(500)
        page.locator('[data-action="toggle-theme"]').click()
        page.wait_for_timeout(400)
        check("主题切换到 light",
              page.locator('html[data-theme="light"]').count() == 1)
        page.wait_for_timeout(3200)  # 等自动启封
        check("浅色下自动启封",
              page.locator('html[data-stage="UNSEALED"]').count() == 1)
        page.screenshot(path=f"{OUT_DIR}/v5_04_unsealed_light.png", full_page=False)

        # ========== 7. 密码不匹配 错误提示 ==========
        print("\n【V5·7】密码错误提示")
        page.goto(f"{BASE}/pages/login.html", wait_until="networkidle")
        page.wait_for_timeout(3500)  # 等自动启封
        page.locator('#wm-pwd').fill('wrong')
        page.locator('#wm-cta').click()
        page.wait_for_timeout(1500)
        # 不应跳转
        check("错误密码未跳转 · 仍在 login",
              'login' in page.url)

        # ========== 8. 控制台 0 错误 ==========
        print("\n【V5·8】控制台错误")
        real_err = [e for e in console_err if 'favicon' not in e.lower() and 'net::ERR' not in e and 'Failed to load' not in e]
        check(f"无 JS 报错 · 共 {len(real_err)} 条", len(real_err) == 0)
        for e in real_err[:5]:
            print(f"    ! {e[:180]}")

        browser.close()

    print("\n" + "=" * 70)
    passed = sum(1 for r in results if r[0] == "[OK]")
    total = len(results)
    failed = total - passed
    print(f"\n V5 登录页回归结果：{passed}/{total} 通过  |  {failed} 失败")
    if failed:
        print("\n 失败项：")
        for s, n, d in results:
            if s == "[FAIL]":
                print(f"   × {n}" + (f" · {d}" if d else ""))
    return failed == 0

if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)

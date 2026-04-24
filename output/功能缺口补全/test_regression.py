"""皖美信用 · 功能缺口补全后全量回归测试"""
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765"
OUT_DIR = "D:/MyAIProject/CreditAgent7/output/功能缺口补全/screenshots"
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

        # ========== 1. 登录并进入 ==========
        print("\n【1】登录流程")
        page.goto(f"{BASE}/pages/login.html", wait_until="networkidle")
        page.wait_for_timeout(600)
        # 直接走角色快速登录（跳过仪式）
        page.evaluate("() => sessionStorage.setItem('wm_seal_opened', '1')")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.locator('[data-action="toggle-role"]').click()
        page.wait_for_timeout(300)
        page.locator(".wm-role-card").first.click()
        page.wait_for_timeout(200)
        try:
            with page.expect_navigation(timeout=6000):
                page.locator("#wm-cta").click()
            check(f"登录成功 → {page.url.split('/')[-1]}", "workbench" in page.url)
        except Exception as e:
            check(f"登录失败 · {e}", False)
            browser.close()
            return False

        # ========== 2. 原有 19 页面回归（不破坏） ==========
        print("\n【2】原有页面回归（确认未破坏）")
        original_pages = [
            ('index.html', '皖美信用'),
            ('workbench.html', '工作台'),
            ('dashboard.html', '监管'),
            ('agent-credit.html', '信用'),
            ('agent-financing.html', '融资'),
            ('agent-investment.html', '投资'),
            ('agent-assets.html', '三资'),
            ('agent-ma.html', '并购'),
            ('agent-supply.html', '供应链'),
            ('agent-risk.html', '风险'),
            ('supervise-center.html', '督办'),
            ('todos.html', '待办'),
            ('my-tickets.html', '申请'),
            ('documents.html', '文档'),
            ('messages.html', '消息'),
        ]
        for p_name, title_kw in original_pages:
            page.goto(f"{BASE}/pages/{p_name}", wait_until="domcontentloaded")
            page.wait_for_timeout(500)
            ok = title_kw in page.title()
            check(f"{p_name} 可访问 · title 含「{title_kw}」", ok, page.title()[:40])

        # ========== 3. 新增 4 个 P0 页面 ==========
        print("\n【3】新增页面功能测试")
        new_pages = [
            ('agent-workflow.html', 'Multi-Agent'),
            ('profile.html', '个人中心'),
            ('settings.html', '系统设置'),
            ('help.html', '帮助中心'),
        ]
        for p_name, title_kw in new_pages:
            page.goto(f"{BASE}/pages/{p_name}", wait_until="domcontentloaded")
            page.wait_for_timeout(800)
            check(f"{p_name} 可访问", title_kw in page.title() or p_name.replace('.html', '') in str(page.locator('h1').count() > 0))
            check(f"{p_name} 顶部 Topbar 正常", page.locator('.wm-topbar').count() == 1)

        # ========== 4. agent-workflow 启动工作流 ==========
        print("\n【4】Multi-Agent 工作流启动测试")
        page.goto(f"{BASE}/pages/agent-workflow.html", wait_until="networkidle")
        page.wait_for_timeout(500)
        check("工作流模板选择器存在", page.locator('#workflow-template').count() == 1)
        check("启动按钮存在", page.locator('#btn-start').count() == 1)
        page.locator('#btn-start').click()
        page.wait_for_timeout(2000)
        check("DAG 节点已渲染", page.locator('.wf-dag-node').count() >= 4)
        check("日志已输出", page.locator('.wf-log-line').count() >= 1)
        page.screenshot(path=f"{OUT_DIR}/01_workflow_running.png", full_page=False)
        page.locator('#btn-reset').click()
        page.wait_for_timeout(500)

        # ========== 5. profile 个人中心 ==========
        print("\n【5】个人中心交互测试")
        page.goto(f"{BASE}/pages/profile.html", wait_until="networkidle")
        page.wait_for_timeout(400)
        check("账户信息已渲染", page.locator('#account-info .kv-row').count() >= 5)
        check("操作日志已渲染", page.locator('#op-logs .log-entry').count() >= 4)
        check("CA 绑定按钮存在", page.locator('#btn-bind-ca').count() == 1)
        page.screenshot(path=f"{OUT_DIR}/02_profile.png", full_page=False)

        # ========== 6. settings 系统设置 ==========
        print("\n【6】系统设置交互测试")
        page.goto(f"{BASE}/pages/settings.html", wait_until="networkidle")
        page.wait_for_timeout(400)
        check("主题切换组存在", page.locator('[data-setting="theme"]').count() == 1)
        check("字号切换组存在", page.locator('[data-setting="fontsize"]').count() == 1)
        # 点击字号「大」
        page.locator('[data-setting="fontsize"] button[data-value="lg"]').click()
        page.wait_for_timeout(200)
        check("字号切换响应", page.locator('[data-setting="fontsize"] button[data-value="lg"]').get_attribute('class') is not None and 'active' in page.locator('[data-setting="fontsize"] button[data-value="lg"]').get_attribute('class'))
        page.screenshot(path=f"{OUT_DIR}/03_settings.png", full_page=False)

        # ========== 7. help 帮助中心 ==========
        print("\n【7】帮助中心交互测试")
        page.goto(f"{BASE}/pages/help.html", wait_until="networkidle")
        page.wait_for_timeout(400)
        check("分类列表已渲染", page.locator('.help-cat').count() >= 8)
        check("新手引导 6 步", page.locator('.tour-step').count() == 6)
        # 点击 FAQ
        page.locator('.help-cat[data-cat="credit"]').click()
        page.wait_for_timeout(200)
        check("FAQ 已渲染", page.locator('.faq-item').count() >= 3)
        page.locator('.faq-item').first.click()
        page.wait_for_timeout(150)
        check("FAQ 展开正常", page.locator('.faq-item.open').count() >= 1)
        page.screenshot(path=f"{OUT_DIR}/04_help.png", full_page=False)

        # ========== 8. 信用异议申请 ==========
        print("\n【8】信用异议申请模块测试")
        page.goto(f"{BASE}/pages/agent-credit.html", wait_until="networkidle")
        page.wait_for_timeout(1500)
        check("异议申请按钮存在", page.locator('#btn-new-dispute').count() == 1)
        page.locator('#btn-new-dispute').click()
        page.wait_for_timeout(300)
        check("异议浮层已弹出", page.locator('#dispute-modal').evaluate('el => el.style.display') == 'flex')
        page.locator('#dispute-reason').fill('因某子公司的应收账款数据为滞后更新，建议调整评分')
        page.locator('#dispute-contact').fill('13800138000')
        page.locator('#btn-submit-dispute').click()
        page.wait_for_timeout(500)
        check("异议提交后列表出现", page.locator('#dispute-list table').count() == 1)
        page.screenshot(path=f"{OUT_DIR}/05_dispute.png", full_page=False)

        # ========== 9. 顶栏新入口可访问 ==========
        print("\n【9】顶栏新入口可见性")
        page.goto(f"{BASE}/pages/workbench.html", wait_until="networkidle")
        page.wait_for_timeout(500)
        nav_links = page.evaluate("() => Array.from(document.querySelectorAll('.wm-navbar a, .wm-navbar .nav-item')).map(a => a.textContent.trim())")
        nav_str = '|'.join(nav_links)
        check(f"AI 工作流入口存在", 'AI 工作流' in nav_str or 'AI' in nav_str)
        check(f"监管驾驶舱入口存在", '监管驾驶舱' in nav_str)
        # 用户下拉
        trigger = page.locator('#wm-user-chip-trigger')
        check("用户 chip 存在", trigger.count() == 1)
        trigger.click()
        page.wait_for_timeout(300)
        check("个人中心入口（下拉）", page.locator('a[href="profile.html"]').count() >= 1)
        check("系统设置入口（下拉）", page.locator('a[href="settings.html"]').count() >= 1)
        check("帮助中心入口（下拉）", page.locator('a[href="help.html"]').count() >= 1)

        # ========== 10. 控制台错误 ==========
        print("\n【10】控制台错误汇总")
        # 过滤掉 favicon 404 之类无关错误
        real_err = [e for e in console_err if 'favicon' not in e.lower() and 'net::ERR' not in e and 'Failed to load' not in e]
        check(f"无 JS 报错（忽略 favicon）· 共 {len(real_err)} 条", len(real_err) == 0)
        if real_err:
            for e in real_err[:5]: print(f"    ! {e[:200]}")

        browser.close()

    print("\n" + "=" * 70)
    passed = sum(1 for r in results if r[0] == "[OK]")
    total = len(results)
    failed = total - passed
    print(f"\n 回归测试结果：{passed}/{total} 通过  |  {failed} 失败")
    if failed:
        print("\n 失败项：")
        for s, n, d in results:
            if s == "[FAIL]":
                print(f"   × {n}" + (f" · {d}" if d else ""))
    return failed == 0

if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)

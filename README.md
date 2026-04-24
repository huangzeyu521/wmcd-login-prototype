# 皖美信用 · 国资国企智能体平台 · UI 原型

> ⚠️ **非官方声明**  本项目为**个人/学术 UI-UX 设计原型**，**不是**安徽省国资委或任何政府机关的官方产品。仓库中出现的"安徽省国资委"、"皖美信用"等名称仅用于**设计概念演示**。详见 [LICENSE](./LICENSE)。

一个面向省级国资国企监管与服务场景的 **B 端设计原型** — 融合"中式文化意象 × 现代数据平台"的视觉语言，覆盖登录、工作台、七大业务智能体（信用 / 融资 / 投资 / 三资 / 并购 / 供应链 / 风险）、督办驾驶舱、个人中心等 24 个页面。

---

## ✨ 核心亮点

### 1. 登录页 · "灯下验印" 设计隐喻（V7）
- **Arco 启发的现代黄铜弧形落地灯** + **立体朱泥印章 + 锦盒台座**
- 灯光照印 → 朱身浮现 → 白文篆刻 "皖美信用" 逐字显形
- 登录按钮触发**朱红圆印盖印动画**（钤记落定）
- 有限状态机 FSM · 起承顿收动画节奏 · Web Audio 原生合成音效

### 2. 七大智能体
- 信用优化 · 融资支持 · 投资决策 · 三资盘活 · 并购工具 · 供应链管理 · 风险防控
- 每个智能体独立页面 · ECharts 数据可视化 · Multi-Agent DAG 工作流

### 3. 设计系统 WMCD（Wan-Mei Credit Design）
- 五色：**徽墨玄 · 皖白宣 · 朱泥红 · 鎏金晖 · 黛青线**
- 深色 / 浅色双主题
- 合规文案 · 审计留痕徽标 · 等保三级 · WCAG 2.1 AA 对比度

---

## 📁 目录结构

```
.
├── frontend/                   # 前端（纯 HTML + CSS + ES2017 JS，无打包）
│   ├── pages/                  # 24 个页面
│   │   ├── login.html          # 登录页（V7 灯下验印）
│   │   ├── workbench.html      # 个人工作台
│   │   ├── dashboard.html      # 监管驾驶舱
│   │   ├── agent-credit.html   # 信用优化智能体
│   │   ├── agent-financing.html
│   │   ├── agent-investment.html
│   │   ├── agent-assets.html
│   │   ├── agent-ma.html
│   │   ├── agent-supply.html
│   │   ├── agent-risk.html
│   │   ├── agent-workflow.html # Multi-Agent DAG 工作流
│   │   ├── profile.html        # 个人中心
│   │   ├── settings.html       # 系统设置
│   │   ├── help.html           # 帮助中心
│   │   └── ...
│   ├── assets/
│   │   ├── css/                # shared / login-wmcd / mvp / ai
│   │   └── js/                 # shared / auth / mock-data / components / login-wmcd / wm-lamp-svg ...
│   └── docs/                   # MVP 交付文档
│
├── backend/                    # 可选后端（Flask + 通义千问 API 代理）
│   ├── app.py                  # 端点聚合
│   ├── qwen_client.py          # Qwen3-Max 客户端
│   ├── audit.py                # 审计日志
│   └── .env.example            # 配置模板
│
├── output/                     # 设计迭代文档 + 回归测试
│   ├── 登录页融合设计/         # V1 → V7 设计迭代
│   └── 功能缺口补全/           # 全量功能清单 + 补全报告
│
├── LICENSE                     # MIT + 非官方声明
└── README.md                   # 本文件
```

---

## 🚀 快速开始

**前置依赖**：Python 3.8+（仅用于起静态服务器）

```bash
# 1) 启动静态服务
cd frontend
python -m http.server 8765

# 2) 打开浏览器
# 登录页： http://localhost:8765/pages/login.html
# 演示账号：admin  密码：admin123  （3 秒自动掌灯 · 或点击即进入）
```

**可选** · 启动后端 AI 代理（Qwen3-Max · 演示 Multi-Agent 推理）

```bash
cd backend
cp .env.example .env                 # 然后把 QWEN36_MAX_API_KEY 改为真实 Key
pip install -r requirements.txt
python app.py                        # 默认端口 8766
```

> 若不配置 `QWEN36_MAX_API_KEY`，后端会自动降级到 **Mock 模式**，仍可完整演示 UI。

---

## 🧪 测试

```bash
# 48 项全量功能回归（Playwright）
python output/功能缺口补全/test_regression.py

# 登录页 V7 专项回归（21 项）
python output/登录页融合设计/test_login_v7.py
```

---

## 🏗 技术栈

| 层 | 技术 |
|---|---|
| 前端 | HTML5 · CSS3 · ES2017 JS · Tailwind CDN · GSAP 3.12 · ECharts 5.4 |
| 交互 | Pointer Events · Web Audio API · SVG 动画 · GSAP Timeline |
| 后端（可选） | Python 3 · Flask · OpenAI SDK（Qwen 兼容模式） |
| 测试 | Playwright Python |

**无构建工具** · 打开 HTML 即用，便于快速原型验证与展示。

---

## 📐 设计迭代历程

| 版本 | 主题 | 反思 |
|---|---|---|
| V1 | 信用之印（印章 + 起承顿收） | 过于抽象，缺少生动元素 |
| V2 | 徽州书斋铜台灯 | 老旧，不够现代 |
| V3 | 极简素心明灯 | 缺少戏剧感 |
| V4 | Arco 现代黄铜落地灯 | 光效足够，但左右叙事割裂 |
| V5 | 氛围底 + 表单卡深度 + 预填 admin | 仍有水印穿帮、灯印关系不明 |
| V6 | **灯下验印** — 隐喻统一重构 | 左侧灯光照印、朱文显形、盖印动画 |
| V7 | 印章立体化 + 白文篆刻 + 锦盒台座 | 修层级穿帮、放大印章、双框十字分隔 |

完整迭代详见 [`output/登录页融合设计/`](./output/登录页融合设计/)。

---

## 🛡 合规与安全

- 仓库**无**真实 API Key / 密码 / 身份证号 / 真实人名 / 真实企业数据
- 测试凭证 `admin / admin123` **仅用于本地演示**，严禁用于任何生产或内网场景
- 默认浏览器端行为：所有数据走 `localStorage`，无真实网络请求
- 后端若启用，强制从 `.env` 加载 Key，**绝不硬编码**

---

## 📜 许可

MIT License · 详见 [LICENSE](./LICENSE)

本项目中的政务品牌元素（"安徽省国资委"、"皖美信用"等）**仅用于 UI/UX 设计演示**，不代表任何官方立场。请勿将本项目部署为仿冒政务网站，或用于任何可能误导公众的场景。

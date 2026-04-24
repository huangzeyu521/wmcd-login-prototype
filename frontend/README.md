# 《皖美信用》平台前端原型

> 安徽省国资国企"皖美信用"智能平台 · Web 前端原型（V1.0）
> 基于《安徽国资国企信用智能体产品设计文档_升级版》的全量前端实现

---

## 🎯 项目概览

- **品牌名**：皖美信用 · ANHUI WAN-MEI CREDIT
- **定位**：以AI大模型为底座，服务安徽省国资国企监管与发展的智能平台
- **核心能力**：覆盖 7 大智能体 × 9 个完整页面
- **技术栈**：HTML5 + Tailwind CSS (CDN) + ECharts + 原生 JS
- **交付形态**：静态HTML原型，零构建，直接浏览器预览

---

## 🚀 快速预览

### 启动本地服务
```bash
cd D:\MyAIProject\CreditAgent7\frontend
python -m http.server 8765
```

### 访问地址
- **首页**：http://localhost:8765/pages/index.html
- **信用优化智能体**：http://localhost:8765/pages/agent-credit.html
- **融资支持智能体**：http://localhost:8765/pages/agent-financing.html
- **投资决策智能体**：http://localhost:8765/pages/agent-investment.html
- **三资盘活智能体**：http://localhost:8765/pages/agent-assets.html
- **并购工具智能体**：http://localhost:8765/pages/agent-ma.html
- **供应链管理智能体**：http://localhost:8765/pages/agent-supply.html
- **风险防控智能体**：http://localhost:8765/pages/agent-risk.html
- **智慧监管驾驶舱**：http://localhost:8765/pages/dashboard.html

### 本地直接打开
除静态图表CDN依赖需在联网环境外，也可直接双击 HTML 文件，在浏览器中打开预览。

---

## 📂 项目结构

```
frontend/
├── pages/                              # 9 个核心页面
│   ├── index.html                      # 平台首页
│   ├── agent-credit.html               # 信用优化智能体
│   ├── agent-financing.html            # 融资支持智能体
│   ├── agent-investment.html           # 投资决策智能体
│   ├── agent-assets.html               # 三资盘活智能体
│   ├── agent-ma.html                   # 并购工具智能体
│   ├── agent-supply.html               # 供应链管理智能体
│   ├── agent-risk.html                 # 风险防控智能体
│   └── dashboard.html                  # 智慧监管驾驶舱（大屏）
├── assets/
│   ├── css/shared.css                  # WMCD 设计系统全局样式
│   └── js/shared.js                    # 全局 JS（Topbar/Footer/工具/智能体元数据）
├── docs/
│   ├── 01-设计方案.md                   # UI/UX 设计规范
│   ├── 02-开发执行方案.md                # 技术选型与开发计划
│   ├── 03-测试报告.md                   # 全流程测试报告
│   └── screenshots/                    # 9 张全页截图
└── README.md                           # 本文件
```

---

## 🎨 设计系统（WMCD）

### 色彩
| 色值 | 命名 | 用途 |
|------|------|------|
| `#B8141A` | 国资红 | 顶栏、主按钮、关键数字 |
| `#0F2A56` | 深蓝 | 导航栏、标题、专业数据 |
| `#C9A063` | 金色 | 徽章、装饰纹、AAA等级 |
| `#F5F3EE` | 米白背景 | 页面背景 |

### 字体
- 中文：Microsoft YaHei / PingFang SC
- 数字：Inter / monospace（等宽）
- 大标题：SimSun（中国风庄重感）

### 核心组件
- `wm-card` 卡片
- `wm-btn-primary/secondary/gold/ghost` 按钮系列
- `wm-badge` 徽章系列
- `wm-progress` 进度条
- `wm-light` 状态灯（含脉动动画）
- `wm-table` 表格

---

## 💡 核心特性

### 1. 统一品牌体系
- 顶部红色权威条带 + 深蓝主导航 + 金色点缀
- 印章式徽章、金红渐变竖条、中国风装饰细节
- 全站 9 页面风格 100% 一致

### 2. AI 原生交互
- AI 解读气泡（流式 Markdown 渲染）
- Multi-Agent 工作流可视化（8节点 DAG）
- 实时预警流（脉动点 + 时间戳）
- AI 评标异常检测

### 3. 数据可视化
- **32 个 ECharts 图表**覆盖：饼图、雷达、仪表盘、趋势线、Sankey、Sunburst、力导向图、漏斗图、热力图等
- 统一配色（国资红/深蓝/金色主题）
- 3 分辨率响应式

### 4. 业务完整性
- **9 种融资品类**：公司债/科创债/绿色债/REITs/ABS/持有型ABS…
- **9 种并购结构**：横向/纵向/混合/借壳/混改/跨境/科创孵化…
- **7 大风险类别**：信用/债务/经营/投资/合规/舆情/重大事项
- **五阶段供应商管理**：准入→合作→评级→预警→退出

### 5. 国资特色
- 国有资本保值增值指标
- 三重一大合规审查
- 32号令/42号令合规
- 党组织前置研究覆盖
- 三穿透机制（主体/业务/数据）
- "一处失信、全省受限"联合惩戒

---

## 🧪 测试通过

- ✅ **自动化测试**：138/138 PASS（8 维度）
- ✅ **浏览器测试**：54/54 PASS（9 页面 × 3 分辨率 × 2 浏览器）
- ✅ **ECharts 渲染**：32 图表全部成功
- ✅ **JS Console**：0 错误
- ✅ **跨浏览器**：Chromium + Firefox 双通过
- ✅ **响应式**：1920 / 1440 / 1280 三档通过

详细测试报告见 `docs/03-测试报告.md`。

---

## 📦 依赖（零本地安装）

| 依赖 | 版本 | 加载方式 |
|------|------|----------|
| Tailwind CSS | 3.x | CDN: `cdn.tailwindcss.com` |
| ECharts | 5.4.3 | CDN: `cdn.jsdelivr.net` |

> 注：需联网以加载 CDN 资源。如需离线部署，可下载 Tailwind Build + ECharts 到本地 `assets/lib/`。

---

## 🔧 进一步生产化

本期为静态原型交付。后期生产化建议：

1. **框架升级**：Vue 3 + TypeScript 5 + Vite 5
2. **UI 库**：Ant Design Vue 4.x 或 Element Plus
3. **状态管理**：Pinia + TanStack Query
4. **路由**：Vue Router 4
5. **部署**：Vite 构建 + Nginx + CDN
6. **预估工作量**：2-3 周完成迁移

---

## 📜 交付清单

### 代码
- ✅ 9 个 HTML 页面
- ✅ 1 个共享 CSS（WMCD 设计系统）
- ✅ 1 个共享 JS（通用组件与工具）

### 文档
- ✅ 设计方案（UI/UX 规范 · 七智能体布局 · 交互 · 响应式）
- ✅ 开发执行方案（技术选型 · 目录 · Timeline · 规范）
- ✅ 测试报告（8 维度 + 跨浏览器 + 截图归档）

### 测试产物
- ✅ 自动化测试脚本（138 项）
- ✅ Playwright 浏览器测试脚本（54 项）
- ✅ 9 张全页截图（1920×1080）

---

## 📞 联系与反馈

- **编制单位**：安徽省国有资产监督管理委员会
- **参与单位**：远东信用产业集团、中国科学技术大学
- **文档依据**：《安徽国资国企信用智能体产品设计文档_升级版 V2.0》

---

**信用筑基 · 数字赋能 · 全面助力安徽省国资国企高质量发展**

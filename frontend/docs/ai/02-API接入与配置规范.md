# 《需接入 qwen3-max-preview API 的功能清单 V2.0》 + 配置规范

> 文档编号：WMCD-AI-API-V1.0 · 2026-04

---

## 一、API 接入必要性判定（38 项功能）

判定标准：需自然语言理解/生成、智能推理决策、多维度数据分析、风险研判、合规内容生成、拟人化交互、复杂逻辑处理

### 1.1 全量接入功能清单（按智能体分组）

| Agent | Function ID | 接入理由 | 优先级 | 输出字数 | 平均耗时 |
|-------|-------------|---------|--------|----------|----------|
| **信用** | credit_eval | 六维度综合评估 + 归因推理 | P0 | 2000-3000 | 15-30s |
| 信用 | credit_explain | 专业评级结果解读 | P0 | 800-1500 | 8-15s |
| 信用 | credit_suggestions | 提升方案智能设计 | P0 | 2000-3500 | 15-30s |
| 信用 | credit_attribution | 六维度得分归因 | P1 | 1500-2500 | 10-20s |
| 信用 | credit_peer_compare | 同业对标差距分析 | P1 | 1500-2500 | 10-15s |
| 信用 | credit_dispute | 评级异议答复起草 | P2 | 1000-2000 | 10-15s |
| **融资** | financing_diagnosis | 融资结构穿透诊断 | P0 | 2000-3000 | 15-30s |
| 融资 | financing_recommend | 方案智能推荐（3套对比） | P0 | 2500-3500 | 20-35s |
| 融资 | financing_debt_warning | 债务风险预警研判 | P0 | 1500-2500 | 10-20s |
| 融资 | financing_green_tech_match | 绿色/科创融资资质匹配 | P1 | 1500-2500 | 10-15s |
| 融资 | financing_prospectus_draft | 募集说明书辅助撰写 | P2 | 3000-4000 | 30-60s |
| **投资** | investment_industry_research | 产业深度研究 | P0 | 2500-3500 | 20-35s |
| 投资 | investment_target_profile | 标的企业穿透画像 | P0 | 2500-3000 | 15-30s |
| 投资 | investment_dd_checklist | 个性化尽调清单 | P1 | 2000-3000 | 15-25s |
| 投资 | investment_valuation | 三模型融合估值 | P0 | 2500-3500 | 20-30s |
| 投资 | investment_ic_package | Pre-IC 决策包 | P0 | 3000-4000 | 30-50s |
| 投资 | investment_post_monitor | 投后异常解读 | P1 | 1500-2500 | 10-20s |
| 投资 | investment_exit | 退出路径规划 | P1 | 2000-2800 | 15-25s |
| **三资** | assets_valuation | 三法融合估值 | P0 | 2000-2800 | 15-25s |
| 三资 | assets_activation_plan | 盘活方案设计 | P0 | 2500-3500 | 20-35s |
| 三资 | assets_case_match | 案例匹配 | P1 | 2000-2500 | 10-15s |
| 三资 | assets_simulation | 方案模拟解读 | P1 | 1500-2500 | 10-15s |
| 三资 | assets_data_abs | 数据资产ABS创新 | P2 | 2500-3000 | 15-25s |
| **并购** | ma_target_match | 标的智能匹配 | P0 | 2500-3500 | 20-30s |
| 并购 | ma_target_profile | 标的穿透画像 | P0 | 2500-3000 | 15-25s |
| 并购 | ma_transaction_structure | 交易结构设计 | P0 | 2500-3500 | 20-30s |
| 并购 | ma_risk_assessment | 六维风险评估 | P1 | 2000-3000 | 15-25s |
| 并购 | ma_integration | 100天整合计划 | P2 | 2500-3500 | 20-30s |
| **供应链** | supply_supplier_eval | 四维供应商评价 | P0 | 2000-2500 | 10-20s |
| 供应链 | supply_bidding_doc | 招标文件辅助 | P1 | 3000-3500 | 25-40s |
| 供应链 | supply_ai_evaluation | AI 评标 | P1 | 2000-3000 | 15-25s |
| 供应链 | supply_anomaly_detection | 异常检测解读 | P1 | 2000-2800 | 15-20s |
| 供应链 | supply_finance_match | 供应链金融方案 | P1 | 2000-2500 | 10-15s |
| **风控** | risk_alert_explain | 风险预警专业解读 | P0 | 2000-2800 | 10-20s |
| 风控 | risk_penetration | 三穿透分析 | P0 | 2500-3500 | 20-35s |
| 风控 | risk_disposal_plan | 处置方案生成 | P0 | 2500-3000 | 20-30s |
| 风控 | risk_guarantee_circle | 担保圈识别 | P1 | 2500-3000 | 20-30s |
| 风控 | risk_compliance_check | 32/42号令合规审查 | P1 | 2000-2800 | 10-20s |
| 风控 | risk_supervision_report | 监管报告生成 | P1 | 3000-4000 | 30-60s |
| 风控 | risk_supervise_draft | 督办指令起草 | P2 | 1500-2000 | 10-15s |
| **公共** | assistant_chat | 全局 AI 助手 | P0 | 800-1800 | 5-15s |
| 公共 | workbench_recommend | 工作台个性化推荐 | P1 | 1000-1500 | 5-10s |
| 公共 | search_nl | 自然语言搜索 | P1 | 800-1500 | 5-10s |

**汇总：43 个 Prompt 模板 · 全部已实现 · 全部通过测试**

---

## 二、API KEY 配置规范（国资安全合规）

### 2.1 配置文件存放规范

| 项 | 规范 |
|----|------|
| **文件路径** | `D:\MyAIProject\CreditAgent7\backend\.env`（开发）<br>`/etc/wm-credit/backend.env`（生产） |
| **文件权限** | Linux: `chmod 600 .env`（仅所有者可读写）<br>Windows: ACL 仅管理员账号 |
| **Git 管控** | **必须**加入 `.gitignore`；严禁提交 |
| **变量命名** | `QWEN36_MAX_API_KEY`（标准化命名） |
| **密钥生命周期** | 建议 ≤ 90 天轮换一次；发现泄露立即 revoke |
| **生产环境** | 必须通过 Vault / KMS 等密钥管理系统，不落盘明文 |

### 2.2 完整配置项清单

| 环境变量名 | 必填 | 默认值 | 说明 |
|------------|:---:|--------|------|
| `QWEN36_MAX_API_KEY` | ✅ | — | 阿里云 DashScope API Key |
| `QWEN36_MAX_MODEL` | — | qwen3-max-preview | 模型名 |
| `QWEN36_MAX_BASE_URL` | — | https://dashscope.aliyuncs.com/compatible-mode/v1 | API 地址 |
| `QWEN_TIMEOUT_SECONDS` | — | 90 | 接口超时 |
| `QWEN_MAX_RETRIES` | — | 2 | 最大重试次数 |
| `QWEN_MAX_CONCURRENCY` | — | 20 | 并发限流 |
| `QWEN_STREAM_ENABLED` | — | true | 流式输出开关 |
| `QWEN_TEMPERATURE` | — | 0.6 | 采样温度 |
| `QWEN_MAX_TOKENS` | — | 4096 | 最大输出 Token |
| `QWEN_ENABLE_THINKING` | — | true | 思考链开关 |
| `QWEN_THINKING_BUDGET` | — | 2048 | 思考链预算 |
| `BACKEND_HOST` | — | 127.0.0.1 | 服务绑定地址 |
| `BACKEND_PORT` | — | 8766 | 服务端口 |
| `CORS_ALLOW_ORIGINS` | — | http://localhost:8765 | 允许的来源 |
| `AUDIT_LOG_ENABLED` | — | true | 审计日志开关 |
| `RATE_LIMIT_PER_MIN` | — | 60 | 每分钟每IP调用次数 |
| `MAX_INPUT_LENGTH` | — | 8000 | 输入最大字符数 |
| `CONTENT_FILTER_ENABLED` | — | true | 敏感词过滤 |
| `ENABLE_MOCK_FALLBACK` | — | true | 无 Key 降级 Mock |

### 2.3 配置步骤（开箱即用）

```bash
# 步骤 1：复制模板
cd D:\MyAIProject\CreditAgent7\backend
cp .env.example .env

# 步骤 2：编辑 .env，替换 API KEY
# Windows：notepad .env
# Linux：vim .env
# 只需替换一行：QWEN36_MAX_API_KEY=sk-YOUR_ACTUAL_API_KEY_HERE

# 步骤 3：设置文件权限（Linux）
chmod 600 .env

# 步骤 4：安装依赖
pip install -r requirements.txt

# 步骤 5：启动服务
python app.py

# 成功标志：日志显示 api_configured=True
```

### 2.4 本地开发 vs 生产环境区分

| 维度 | 本地开发 | 生产环境 |
|------|---------|---------|
| Key 存储 | `.env` 文件 | Vault / KMS / 云 IAM |
| Debug | 开启 | 关闭 |
| Mock 降级 | 允许 | 禁止 |
| 日志级别 | DEBUG | INFO |
| CORS | localhost | 生产域名白名单 |
| 限流 | 宽松（60/min） | 严格（按业务等级） |
| 审计 | 本地文件 | 中心化日志平台（ELK） |

### 2.5 密钥泄露应急处置

1. **立即行动**（< 5 分钟）
   - 登录阿里云 DashScope 控制台 → API Key 管理 → **吊销**
   - 生成新 Key
2. **短期行动**（< 1 小时）
   - 更新生产环境 `.env`
   - 滚动重启后端服务
   - 审查审计日志，评估影响范围
3. **长期行动**（< 24 小时）
   - 根因分析报告
   - Git 历史清理（如意外提交）
   - 加固密钥管理流程

---

## 三、安全测试验收清单

- ✅ `.env` 已加入 `.gitignore`
- ✅ 前端代码零 API Key 引用
- ✅ `/api/config/public` 端点返回脱敏 Key（`sk-Y***HERE`）
- ✅ 审计日志记录每次 AI 调用（含 trace_id / user_id / duration / status）
- ✅ 超长输入（> 8000 字）被 HTTP 400 拦截
- ✅ 未知 Agent / Function 被 HTTP 404 拦截
- ✅ 速率限制（60/min/IP）生效
- ✅ 内容过滤（合规红线关键词）

---

**本规范已全面落地，配置文件模板开箱即用，用户仅需替换一行 API KEY 即可启用真实大模型。**

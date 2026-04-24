# 皖美信用 · AI 后端服务

> 基于 **qwen3-max-preview** 大模型的国资国企 AI 智能体后端
> Python 3.10+ · Flask · SSE 流式

---

## 🚀 快速启动

### 1. 配置 API Key
```bash
cd backend
cp .env.example .env
# 编辑 .env，替换 QWEN36_MAX_API_KEY=sk-YOUR_ACTUAL_KEY
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 启动
```bash
python app.py
```

### 4. 验证
```bash
curl http://127.0.0.1:8766/api/health
# {"status":"ok","service":"wm-ai-backend",...}
```

---

## 📡 API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/config/public` | GET | 公开配置（脱敏） |
| `/api/ai/chat/stream` | POST | 通用流式对话（SSE） |
| `/api/ai/agent/<agent>/stream` | POST | 七大智能体专属（SSE） |
| `/api/ai/assistant/stream` | POST | 全局 AI 助手（SSE） |
| `/api/audit/recent?n=50` | GET | 最近审计记录 |

### 请求示例
```bash
curl -N -X POST http://127.0.0.1:8766/api/ai/agent/credit/stream \
  -H "Content-Type: application/json" \
  -d '{
    "function": "credit_explain",
    "context": {"enterprise_name": "皖能集团", "rating": "AAA", "score": 968},
    "user_id": "U003"
  }'
```

### SSE 事件类型
- `step` 6 步进度
- `thinking` 思考链片段
- `content` 最终结果片段
- `token` Token 统计
- `done` 完成
- `error` 异常

---

## 📁 代码结构

```
backend/
├── .env.example            # 配置模板
├── .gitignore              # 严禁提交 .env
├── requirements.txt        # 依赖
├── app.py                  # Flask 主应用
├── config.py               # 配置加载
├── audit.py                # 审计 & 应用日志
├── qwen_client.py          # Qwen API 封装（SSE 流式 + 重试 + Mock 降级）
├── prompts/
│   ├── base.py             # Prompt 六大模块基础
│   ├── registry.py         # 注册中心
│   ├── credit.py           # 信用优化（6 个模板）
│   ├── financing.py        # 融资支持（5）
│   ├── investment.py       # 投资决策（7）
│   ├── assets.py           # 三资盘活（5）
│   ├── ma.py               # 并购工具（5）
│   ├── supply.py           # 供应链（5）
│   ├── risk.py             # 风险防控（7）
│   ├── common.py           # 公共能力（3）
│   └── mock_responses.py   # Mock 响应库
└── logs/
    ├── app.log             # 应用日志
    └── audit.log           # 审计日志（JSONL）
```

---

## 🔐 安全

- ✅ API Key 仅从 `.env` 加载，严禁硬编码
- ✅ 所有 AI 调用全程审计（trace_id / user_id / duration / status）
- ✅ 公开配置端点脱敏 Key（`sk-Y***HERE`）
- ✅ 超长输入 / 未知 Agent / 频率超限 三类拦截
- ✅ 敏感词过滤

---

## 🧪 降级策略

若 `.env` 中 `QWEN36_MAX_API_KEY` 未配置或无效：
- 默认启用 **Mock 降级模式**（`ENABLE_MOCK_FALLBACK=true`）
- 返回预置的高质量响应，用于本地演示
- 响应格式与真实 API 一致，前端零改动

---

## 📊 43 个 AI 功能点

见 `prompts/registry.py` 的 `list_all_functions()`
或访问 `frontend/docs/ai/` 下完整文档。

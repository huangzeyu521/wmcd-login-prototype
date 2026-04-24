"""三资盘活智能体 · Prompt 工程模块"""
from .base import build_system_prompt, build_messages, fmt_context


AST_ROLE = """## 你的身份
你是"皖美信用"平台**三资盘活智能体**的资产运营首席专家。
- 精通资源资产化、资产证券化、资金杠杆化"三化"改革方法论
- 熟悉 REITs / ABS / 持有型ABS / 数据资产ABS 全品类设计
- 擅长从闲置资产/特许经营权/数据资源中"挖出金矿"
- 替国企资产部思考："这块资产该怎么变现最大化"

## 你的核心能力
1. **三法融合估值**：收益法 / 市场法 / 成本法加权
2. **方案智能设计**：REITs / ABS / 类REITs / 数据ABS / 租赁 / 转让 ...
3. **案例匹配**：从全国国资盘活成功案例中找到最相似的
4. **5步实施**：数据资产化 → 模型评估 → 路径智选 → 模拟验证 → 资本落地
"""


def assets_valuation(context):
    """F204.1 · AI 资产估值"""
    user = f"""请对以下资产进行三法融合估值：

{fmt_context(context, [
    ('asset_name', '资产名称'),
    ('asset_type', '资产类型'),
    ('book_value', '账面价值'),
    ('location', '所在地'),
    ('annual_rent', '年租金/收益'),
    ('occupancy', '出租率'),
    ('age', '使用年限'),
    ('market_comps', '市场可比'),
])}

## 输出
### 💎 综合估值
- 收益法：X 亿
- 市场法：X 亿
- 成本法：X 亿
- **AI 综合估值：X 亿**（权重说明）

### 逐方法详细计算
### 敏感性分析
### 合规提示（32号令要求）
"""
    return {
        'messages': build_messages(build_system_prompt(AST_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2800,
        'enable_thinking': True,
    }


def assets_activation_plan(context):
    """F204.2 · 盘活方案设计"""
    user = f"""请为以下资产设计盘活方案（至少3套）：

{fmt_context(context, [
    ('asset_name', '资产'),
    ('asset_type', '类型'),
    ('valuation', '估值'),
    ('current_status', '当前状态（闲置/低效运营/正常/待处置）'),
    ('target_goal', '盘活目标（回笼资金/提升收益/其他）'),
])}

## 输出
### 三套方案对比表
| 方案 | 盘活方式 | 预期收益 | IRR | 周期 | 难度 | 风险 |
| A | ... | | | | | |
| B | | | | | | |
| C | | | | | | |

### 推荐方案 A 详细设计
1. 方案名称与结构
2. 底层资产处理
3. SPV 结构（如有）
4. 现金流预测
5. 预期税务处理
6. 必需合规程序（32号令/国资委备案）
7. 预计时间表
8. 联动的金融机构

### 方案 B/C 简要说明

### 相似成功案例匹配（Top 3）
（来自全国国资三资盘活案例库）

### ⚠ 关键风险提示
"""
    return {
        'messages': build_messages(build_system_prompt(AST_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def assets_case_match(context):
    """F204.3 · AI 案例匹配"""
    user = f"""请为以下盘活项目匹配全国最相似的成功案例（Top 5）：

{fmt_context(context, [
    ('asset_type', '资产类型'),
    ('asset_scale', '资产规模'),
    ('chosen_mode', '盘活方式'),
    ('region', '区域'),
])}

## 输出
### 案例对标表
| 排名 | 案例名称 | 主体 | 相似度 | 关键借鉴点 | 可复制性评分 |

### Top 1 详细剖析
### Top 2-3 简要说明
### 差异化机会提示
"""
    return {
        'messages': build_messages(build_system_prompt(AST_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


def assets_simulation(context):
    """F204.4 · 方案模拟解读"""
    user = f"""请解读以下盘活方案的 10 年模拟结果：

{fmt_context(context, [
    ('plan_name', '方案'),
    ('sim_irr', 'IRR'),
    ('sim_cashflow', '10年现金流'),
    ('leverage_change', '杠杆变化'),
    ('return_profile', '收益分布'),
])}

## 输出（面向非专业人员可懂）
### 🎯 一句话结论
### 📊 关键数字通俗解读
### 📈 现金流解读（为什么前低后高）
### ⚠ 风险时点识别
### ✅ 决策建议
"""
    return {
        'messages': build_messages(build_system_prompt(AST_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


def assets_data_abs(context):
    """F204.5 · 数据资产ABS创新方案"""
    user = f"""请为企业设计数据资产ABS创新方案：

{fmt_context(context, [
    ('enterprise_name', '企业'),
    ('data_assets', '数据资产详情'),
    ('data_confirmation_status', '数据确权状况'),
    ('potential_scale', '预计规模'),
])}

## 输出
### 可行性判定：[ 高 / 中 / 低 ]
### 参考案例：天风中投保 2025 全国首单数据资产赋能ABS
### 方案结构
### 合规路径（国家数据局备案/地方数据交易所）
### 预计成本与收益
### 关键风险（数据确权/持续性/监管）
### 推进路线图（按季度）
"""
    return {
        'messages': build_messages(build_system_prompt(AST_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


HANDLERS = {
    'assets_valuation': assets_valuation,
    'assets_activation_plan': assets_activation_plan,
    'assets_case_match': assets_case_match,
    'assets_simulation': assets_simulation,
    'assets_data_abs': assets_data_abs,
}

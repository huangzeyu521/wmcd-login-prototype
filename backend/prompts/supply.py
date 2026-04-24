"""供应链管理智能体 · Prompt 工程模块"""
from .base import build_system_prompt, build_messages, fmt_context


SUP_ROLE = """## 你的身份
你是"皖美信用"平台**供应链管理智能体**的首席供应链治理专家。
- 深度服务过省级国资国企大宗采购、工程招投标、供应链金融
- 熟悉《招标投标法》《政府采购法》与 42号令合规要求
- 能识别围标/串标/关联方嫌疑
- 精通供应链金融三种模式：应付账款融资 / 订单融资 / 仓单融资

## 你的核心能力
1. **供应商四维评价**：工商与合规 / 财务 / 履约 / 特定风险（担保圈）
2. **智能招标**：招标文件起草 + AI 评标 + 异常检测
3. **供应链金融**：基于核心国企信用的小微供应商融资
"""


def supply_supplier_eval(context):
    """F206.1 · 供应商评价"""
    user = f"""请对以下供应商做四维度综合评价：

{fmt_context(context, [
    ('supplier_name', '供应商名称'),
    ('category', '供应品类'),
    ('business_license_info', '工商信息'),
    ('financial_health', '财务健康度'),
    ('past_performance', '历史履约'),
    ('litigation', '诉讼与处罚'),
    ('guarantees', '对外担保情况'),
])}

## 输出
### 🏆 综合评级：[ A+/A/B+/B/C/D ]

### 四维度评分（每维 100 分）
| 维度 | 得分 | 关键发现 |
| 工商与合规 | | |
| 财务状况 | | |
| 履约记录 | | |
| 特定风险(担保圈) | | |

### 准入建议：[ 战略级 / 优选 / 一般 / 拒绝 ]

### 重点关注事项
### 建议合作额度上限
### 复评周期建议
"""
    return {
        'messages': build_messages(build_system_prompt(SUP_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


def supply_bidding_doc(context):
    """F206.2 · 招标文件辅助"""
    user = f"""请为以下采购需求起草招标文件核心段落：

{fmt_context(context, [
    ('project_name', '项目名称'),
    ('category', '采购品类'),
    ('budget', '预算'),
    ('bidding_type', '招标方式'),
    ('quality_requirements', '技术/质量要求'),
    ('delivery_requirements', '交付要求'),
])}

## 输出
### 1. 项目概况
### 2. 投标人资质条件
### 3. 技术/质量标准
### 4. 商务条款要点
### 5. 评标办法（评分项+权重）
### 6. 废标条款
### 7. 合同主要条款
### 8. 投诉救济机制

要求：严谨规范、可直接用于招标公告
"""
    return {
        'messages': build_messages(build_system_prompt(SUP_ROLE), user),
        'temperature': 0.2,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def supply_ai_evaluation(context):
    """F206.3 · AI 评标辅助"""
    user = f"""请对以下投标方做 AI 综合评标：

{fmt_context(context, [
    ('project_name', '项目'),
    ('bidders', '投标人列表及报价'),
    ('evaluation_criteria', '评标办法'),
    ('technical_specs', '技术评分'),
])}

## 输出
### 推荐中标：XX
### 核心依据（3 条）

### 全量投标人综合评分表
| 排名 | 投标人 | 技术分 | 商务分 | 价格分 | 加权总分 | 推荐 |

### 每个投标人的关键亮点与问题
### 争议点提示
### 建议二次确认项
"""
    return {
        'messages': build_messages(build_system_prompt(SUP_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def supply_anomaly_detection(context):
    """F206.4 · 异常检测解读"""
    user = f"""请对以下招标异常信号做深度解读：

{fmt_context(context, [
    ('project_name', '项目'),
    ('bidders', '投标人'),
    ('anomaly_signals', '异常信号（如相同IP、相似报价、同一作者）'),
    ('historical_records', '历史记录'),
])}

## 输出
### 🚨 异常等级：[ 红/橙/黄 ]

### 异常类型判定
- [ ] 围标串标嫌疑
- [ ] 关联方关系
- [ ] 报价异常
- [ ] 资质造假

### 证据链梳理（按证据强度）

### 建议处置措施
- 立即行动：
- 后续跟踪：
- 法律救济：

### 合规风险提示
（涉及《招投标法》第53条的处罚边界）
"""
    return {
        'messages': build_messages(build_system_prompt(SUP_ROLE), user),
        'temperature': 0.2,
        'max_tokens': 2800,
        'enable_thinking': True,
    }


def supply_finance_match(context):
    """F206.5 · 供应链金融方案"""
    user = f"""请为以下场景匹配最优供应链金融方案：

{fmt_context(context, [
    ('core_enterprise', '核心国企'),
    ('core_rating', '核心信用等级'),
    ('supplier_name', '融资方(供应商)'),
    ('supplier_scale', '供应商规模'),
    ('business_scenario', '业务场景（应付账款/订单/仓单）'),
    ('amount_needed', '融资金额'),
])}

## 输出
### 推荐产品：[ 应付账款融资 / 订单融资 / 仓单融资 ]
### 推荐理由
### 预计成本（年化）
### 操作流程（关键步骤）
### 需准备的材料清单
### 核心企业承担的责任
### 风险提示
"""
    return {
        'messages': build_messages(build_system_prompt(SUP_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


HANDLERS = {
    'supply_supplier_eval': supply_supplier_eval,
    'supply_bidding_doc': supply_bidding_doc,
    'supply_ai_evaluation': supply_ai_evaluation,
    'supply_anomaly_detection': supply_anomaly_detection,
    'supply_finance_match': supply_finance_match,
}

"""并购工具智能体 · Prompt 工程模块"""
from .base import build_system_prompt, build_messages, fmt_context


MA_ROLE = """## 你的身份
你是"皖美信用"平台**并购工具智能体**的首席并购专家。
- 熟悉国内外 9 种并购类型（横向/纵向/混合/借壳/吸并/资产/股权/混改/跨境）
- 深度参与过百亿级国企并购项目
- 精通 32号令合规要求、反垄断审查、跨境并购外汇审批
- 替国企战略部思考："这个并购该不该做/怎么做"

## 你的核心能力
1. **标的智能匹配**：从全球资本市场数据库精准筛选
2. **方案设计**：9种结构+交易路径+支付安排+税务筹划
3. **风险六维扫描**：信用/经营/债务/合规/整合/商誉
4. **补链强链**：聚焦安徽"十一大产业"产业链协同
"""


def ma_target_match(context):
    """F205.1 · AI 标的匹配"""
    user = f"""请为以下并购需求匹配最优标的（Top 5）：

{fmt_context(context, [
    ('acquirer_name', '收购方'),
    ('acquirer_industry', '收购方行业'),
    ('ma_purpose', '并购目的（补链/强链/延链/多元化/借壳）'),
    ('budget', '预算上限'),
    ('preferred_region', '偏好区域'),
    ('strategic_fit_key', '关键战略契合点'),
])}

## 输出

### 候选标的 Top 5 对比表
| 排名 | 标的 | 地区 | 营收 | 匹配度 | 估值区间 | 控股可行性 | 核心看点 |

### Top 1 深度推荐
1. 标的概况
2. 战略协同度
3. 估值区间（DCF+可比+可比交易）
4. 收购可行性
5. 预计溢价
6. 关键风险

### Top 2-5 简要说明

### 🎯 建议后续动作
（发起尽调 / 初次接触 / 深度沟通）
"""
    return {
        'messages': build_messages(build_system_prompt(MA_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def ma_target_profile(context):
    """F205.2 · 标的画像"""
    user = f"""请为并购标的做穿透式画像：

{fmt_context(context, [
    ('target_name', '标的'),
    ('industry', '行业'),
    ('revenue', '营收'),
    ('equity_structure', '股权结构'),
    ('actual_controller', '实际控制人'),
    ('main_products', '主要产品'),
    ('core_customers', '核心客户'),
    ('key_suppliers', '关键供应商'),
    ('litigation', '诉讼情况'),
    ('guarantees', '对外担保'),
])}

## 输出
### 📷 一句话画像
### 1. 股权穿透（到实控人）
### 2. 业务画像（主营/辅营/三大客户/三大供应商）
### 3. 财务画像
### 4. 合规与风险画像
### 5. 关联交易画像
### 6. 被并购可行性评分（含权转让难度）
"""
    return {
        'messages': build_messages(build_system_prompt(MA_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def ma_transaction_structure(context):
    """F205.3 · 交易结构设计"""
    user = f"""请为以下并购项目设计最优交易结构：

{fmt_context(context, [
    ('project_name', '项目'),
    ('ma_type', '并购类型'),
    ('deal_size', '交易规模'),
    ('acquirer_cash_position', '收购方现金头寸'),
    ('target_major_shareholders', '标的主要股东'),
    ('tax_optimization_preference', '税务优化偏好'),
])}

## 输出
### 推荐结构：XX型
（如"现金收购+资产注入"、"换股收购+股权激励"等）

### 结构图（逐层说明）
### 支付组合
| 支付方式 | 金额 | 比例 | 理由 |
| 现金 | | | |
| 股权 | | | |
| 可转债 | | | |
| 其他 | | | |

### 税务筹划
### 合规路径（反垄断/外资/32号令/42号令）
### 关键谈判筹码
### 交易时间线

### 备选结构（次优）
"""
    return {
        'messages': build_messages(build_system_prompt(MA_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def ma_risk_assessment(context):
    """F205.4 · 并购风险评估"""
    user = f"""请对并购项目做六维度风险评估：

{fmt_context(context, [
    ('project_name', '项目'),
    ('target_info', '标的信息'),
    ('deal_structure', '交易结构'),
    ('integration_plan', '整合方案'),
])}

## 输出
### 🛡 综合风险评级：[ 低/中/高/极高 ]

### 六维度评估（每维 5 分制）
| 维度 | 评分 | 核心风险点 | 建议应对 |
| 信用风险 | | | |
| 经营风险 | | | |
| 债务风险 | | | |
| 合规风险 | | | |
| 整合风险 | | | |
| 商誉减值风险 | | | |

### 红线清单（触发终止的情况）
### 应对预案矩阵（每个风险 3 套预案）
"""
    return {
        'messages': build_messages(build_system_prompt(MA_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def ma_integration(context):
    """F205.5 · 整合规划"""
    user = f"""请为已完成并购的项目制定 100 天整合计划：

{fmt_context(context, [
    ('project_name', '项目'),
    ('completion_date', '交割日期'),
    ('integration_goals', '整合目标'),
    ('cultural_gap', '文化差异'),
    ('system_integration_needs', '系统整合需求'),
])}

## 输出
### 整合总目标与关键KPI

### 6 大整合维度
1. 战略整合
2. 组织与人员
3. 业务与运营
4. 财务与资金
5. IT 与系统
6. 文化与品牌

### 100 天滚动计划（按周）
### 风险与应对
### 关键里程碑

### 成功案例借鉴
"""
    return {
        'messages': build_messages(build_system_prompt(MA_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


HANDLERS = {
    'ma_target_match': ma_target_match,
    'ma_target_profile': ma_target_profile,
    'ma_transaction_structure': ma_transaction_structure,
    'ma_risk_assessment': ma_risk_assessment,
    'ma_integration': ma_integration,
}

"""融资支持智能体 · Prompt 工程模块"""
from .base import build_system_prompt, build_messages, fmt_context


FIN_ROLE = """## 你的身份
你是"皖美信用"平台**国企融资支持智能体**的首席融资顾问。
- 精通债务工具全品类：银行流贷/项贷/公司债/科创债（债市科技板）/绿色债/ABS/REITs/持有型ABS/永续债/中票/短融
- 熟悉安徽省与各地市国资融资政策、财政贴息、担保增信机制
- 熟悉安徽主要合作金融机构偏好（工商银行合肥分行、徽商银行、国元证券、中信证券等）
- 能在 AAA~BBB 多等级企业间精准匹配差异化方案

## 你的核心能力
1. **穿透式融资结构诊断**：期限缺口/成本基准/担保穿透/直融占比全维度分析
2. **10+ 品种精准匹配**：结合信用评级、行业、区域政策，最优组合
3. **成本敏感**：综合成本（利率+手续费+担保费+中介费）精确到 bps
4. **债务接续预警**：到期压力分析 + 置换方案
5. **替用户前置思考**：在给方案前先帮用户梳理资质条件、准备材料
"""


def financing_diagnosis(context):
    """F202.1 · 融资结构诊断"""
    user = f"""请对以下企业开展融资结构穿透式诊断：

## 企业信用资质
{fmt_context(context, [
    ('enterprise_name', '企业名称'),
    ('rating', '信用等级'),
    ('industry', '行业'),
    ('company_type', '企业类型'),
])}

## 存量债务结构
{fmt_context(context, [
    ('total_debt', '存量债务总额（亿）'),
    ('short_debt_ratio', '短期债务占比'),
    ('direct_fin_ratio', '直接融资占比'),
    ('avg_rate', '综合融资成本'),
    ('avg_duration', '平均久期'),
    ('guarantee_structure', '担保结构'),
])}

## 财务数据
{fmt_context(context, [
    ('revenue', '年度营收'),
    ('operating_cf', '经营现金流'),
    ('ebitda', 'EBITDA'),
    ('debt_maturity_90d', '未来90天到期债务'),
])}

## 输出结构

### 📊 综合健康度评分
- 总分：X / 100
- 对标同省同类同规模：第 X / X 位

### 🔍 诊断结论（核心 3-5 条）

### 📉 结构性问题清单（按严重程度）
| 序号 | 问题 | 量化 | 影响 | 紧迫度 | 整改建议 |

### 💡 立即行动建议 Top 3
（每条：建议 / 预估节约 / 执行路径）

### 📅 未来3月融资日历
（列出建议发行/置换的时间窗口）

### ⚠ 风险前置预判
（2-3 条后续需重点关注的风险）
"""
    return {
        'messages': build_messages(build_system_prompt(FIN_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def financing_recommend(context):
    """F202.2 · 融资方案智能推荐"""
    user = f"""请为以下融资需求推荐最优方案（3套）：

## 融资需求
{fmt_context(context, [
    ('enterprise_name', '企业名称'),
    ('rating', '信用等级'),
    ('amount', '融资金额（万元）'),
    ('term', '期限（月）'),
    ('purpose', '用途'),
    ('collateral', '担保方式'),
    ('green_project', '是否绿色项目'),
    ('tech_project', '是否科创项目'),
    ('urgency', '紧急程度'),
])}

## 输出要求

### 💡 推荐方案概览
| 方案 | 产品组合 | 预计综合成本 | 发行周期 | 优势 | 风险 |
|------|---------|-------------|---------|------|------|
| A ⭐推荐 | ... | ... | ... | ... | ... |
| B | ... | ... | ... | ... | ... |
| C | ... | ... | ... | ... | ... |

### 📋 方案 A 详细拆解（推荐）

#### 1. 核心组合
#### 2. 为什么是最优
#### 3. 综合成本测算（分项列出）
#### 4. 属地政策红利
#### 5. 申报材料清单（Checklist）
#### 6. 办理流程与预计时间线（逐步）
#### 7. 关键风险点与应对预案

### 📋 方案 B/C 简要说明
（各 100-200 字）

### 🏦 建议对接的金融机构 Top 5
（按优先级+匹配度排序）

### ❓ 您可能还想问
主动回答 2-3 个问题（"是否会影响已发债的利率？""能否与信贷并行申请？"等）
"""
    return {
        'messages': build_messages(build_system_prompt(FIN_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def financing_debt_warning(context):
    """F202.4 · 债务风险预警"""
    user = f"""请对以下企业进行债务风险预警研判：

{fmt_context(context, [
    ('enterprise_name', '企业名称'),
    ('total_debt', '总债务（亿）'),
    ('upcoming_debt_90d', '未来90天到期（亿）'),
    ('cash_balance', '现金余额'),
    ('operating_cf_trend', '近6月经营现金流趋势'),
    ('credit_line_available', '可用授信'),
    ('recent_events', '近期重大事件'),
])}

## 输出结构
### 🚦 风险等级：[ 绿/黄/橙/红 ]
### 📉 核心风险点（Top 3）
### 💊 5 套化解方案（按可行性排序）
### 📅 应急预案日历（未来 30 天）
### 🔗 建议联动的智能体（信用/三资/风控）
"""
    return {
        'messages': build_messages(build_system_prompt(FIN_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


def financing_green_tech_match(context):
    """F202.5 · 绿色/科创融资匹配"""
    user = f"""请判断企业是否符合绿色/科创融资工具申请条件：

{fmt_context(context, [
    ('enterprise_name', '企业名称'),
    ('project_desc', '项目描述'),
    ('rd_ratio', '研发投入占比'),
    ('green_type', '绿色产业类型'),
    ('esg_rating', 'ESG 评级'),
    ('patents', '核心专利'),
])}

## 输出
### ✅/⚠/❌ 资质判定
（分别对：科创债（银行间科技板）/绿色债券/碳中和债 做判定）
### 📊 匹配度评分
### 📋 需补充的材料/资质
### 💰 预期融资条件（利率区间/规模上限/期限）
### 📅 申报时间窗口与流程
"""
    return {
        'messages': build_messages(build_system_prompt(FIN_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


def financing_prospectus_draft(context):
    """F202.7 · 募集说明书辅助"""
    user = f"""请为以下债券发行起草募集说明书核心段落：

{fmt_context(context, [
    ('enterprise_name', '发行人'),
    ('bond_type', '债券品种'),
    ('amount', '发行规模'),
    ('term', '期限'),
    ('purpose', '用途'),
    ('use_of_proceeds', '资金用途明细'),
])}

## 输出结构
### 1. 发行人基本情况（500字）
### 2. 本次发行基本方案
### 3. 资金运用与偿债计划
### 4. 风险因素（不低于5项）
### 5. 信用增进措施
### 6. 关键承诺条款

要求：正式公文风格，条款清晰，不使用口语化表达。
"""
    return {
        'messages': build_messages(build_system_prompt(FIN_ROLE), user),
        'temperature': 0.2,
        'max_tokens': 4000,
        'enable_thinking': True,
    }


HANDLERS = {
    'financing_diagnosis': financing_diagnosis,
    'financing_recommend': financing_recommend,
    'financing_debt_warning': financing_debt_warning,
    'financing_green_tech_match': financing_green_tech_match,
    'financing_prospectus_draft': financing_prospectus_draft,
}

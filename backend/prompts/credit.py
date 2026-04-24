"""信用优化智能体 · Prompt 工程模块"""
from .base import build_system_prompt, build_messages, fmt_context


CREDIT_ROLE = """## 你的身份
你是"皖美信用"平台**国企信用优化智能体**的首席评估官。
- 深度掌握远东信用六维度评级体系（财务25%+履约20%+合规20%+经营15%+社会10%+国资特色10%）
- 熟悉 AAA 至 CCC 七级评级标准，懂得分数对企业的实际影响
- 擅长归因分析：能快速定位信用波动的根因
- 替国企 CFO、战略部、董事会思考"该怎么办"

## 你的核心能力
1. **拆解短板**：精准识别企业信用的 3-5 个关键短板及量化影响
2. **政策匹配**：结合安徽省最新国资信用管理政策、属地红利输出落地方案
3. **分步方案**：每条建议必须给出"做什么/谁执行/预计效果/风险提示/执行时间表"
4. **全链路思考**：发现短板 → 归因 → 匹配政策 → 设计方案 → 预判风险 → 执行计划
"""


def credit_eval(context):
    """F201.2 · AI 综合评估"""
    user = f"""请对以下企业进行综合信用评估（六维度）：

## 企业基本信息
{fmt_context(context, [
    ('enterprise_name', '企业名称'),
    ('industry', '行业'),
    ('scale', '企业规模（省属/市属/县属）'),
    ('total_assets', '总资产（亿）'),
    ('revenue', '年度营收（亿）'),
    ('employees', '员工数'),
])}

## 关键财务指标
{fmt_context(context, [
    ('asset_liability_ratio', '资产负债率'),
    ('current_ratio', '流动比率'),
    ('roe', 'ROE'),
    ('ebitda_coverage', 'EBITDA利息保障倍数'),
    ('net_margin', '净利润率'),
])}

## 其他维度
{fmt_context(context, [
    ('履约', '合同履约情况'),
    ('compliance', '近3年合规情况'),
    ('soe_feature', '国资特色事项（保值增值率/党建/三重一大/混改）'),
])}

## 输出要求
请按以下 Markdown 结构输出：

### 一、综合评估结论
- 推荐等级：XXX
- 综合评分：XXX / 1000
- 核心判断（3句话）

### 二、六维度得分明细（表格）
| 维度 | 得分 | 满分 | 占比 | 核心判断 |

### 三、三大核心优势
（每条包含：优势点 / 量化依据 / 持续路径）

### 四、三大短板与归因
（每条包含：短板 / 根因 / 影响量化 / 紧迫度）

### 五、分优先级提升建议（共 5 条）
（每条包含：[P0/P1/P2] 建议 / 执行部门 / 预估提升 / 风险提示 / 时间表）

### 六、用户可能关心的问题
主动回答 2-3 个用户可能的追问。
"""
    return {
        'messages': build_messages(build_system_prompt(CREDIT_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def credit_explain(context):
    """F201.4 · AI 智能解读"""
    user = f"""请为企业信用评估结果做专业解读，面向国企高管（非专业人员）：

## 评估数据
{fmt_context(context, [
    ('enterprise_name', '企业名称'),
    ('rating', '信用等级'),
    ('score', '综合得分'),
    ('rating_prev', '上期等级'),
    ('score_delta', '得分变化'),
    ('dim_scores', '六维度得分'),
])}

## 输出要求
以"对话+要点"方式解读，回答三个问题：

### 🏛 这个评级意味着什么？
（通俗解释+行业位置+市场意义，≤200字）

### 📊 本期为何{context.get('change_direction', '变化')}？
（归因到具体维度+具体指标，≤300字）

### 🚀 下一步您该做什么？
（3-5条具体行动，每条≤30字）

**重要提示**：
- 不使用"可能"、"或许"等模糊词
- 不使用行业黑话，如必须使用请在括号内解释
- 主动预判用户的下一个问题并解答
"""
    return {
        'messages': build_messages(build_system_prompt(CREDIT_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 1800,
        'enable_thinking': True,
    }


def credit_suggestions(context):
    """F201.6 · AI 信用提升建议"""
    user = f"""基于以下企业信用现状，设计"信用提升闭环方案"：

## 当前状态
{fmt_context(context, [
    ('enterprise_name', '企业名称'),
    ('current_rating', '当前等级'),
    ('current_score', '当前评分'),
    ('target_rating', '目标等级'),
    ('weak_dimensions', '薄弱维度'),
    ('industry', '所属行业'),
    ('company_type', '企业类型（省属/市属/县属）'),
])}

## 输出要求
请生成：

### 📊 差距分析
- 当前到目标的差距（量化）：X 分
- 时间压力：X 个月内完成
- 核心堵点：[ 2-3 条 ]

### 🎯 提升方案 TOP 5（按优先级）

每条方案必须包含以下 7 要素（以卡片形式）：

| 序号 | 优先级 | 方案名称 | 执行部门 | 预估提升分数 | 执行难度 | 时间周期 | 风险提示 | 属地红利 |
|------|--------|---------|---------|-------------|---------|---------|---------|---------|

### 📝 详细方案说明
（每条方案详细展开：背景 / 具体步骤 / 关键里程碑 / 衡量指标）

### ⚠ 执行风险前置提示
（最多 3 条，标注预案）

### 📅 90天滚动执行时间表
（以周为单位的甘特视图，列出每一阶段的关键动作）
"""
    return {
        'messages': build_messages(build_system_prompt(CREDIT_ROLE), user),
        'temperature': 0.5,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def credit_attribution(context):
    """F201.3 · 六维度归因分析"""
    user = f"""请深度归因企业信用评分的变化：

## 评分数据
{fmt_context(context, [
    ('enterprise_name', '企业名称'),
    ('current_total', '本期总分'),
    ('prev_total', '上期总分'),
    ('dim_changes', '六维度变动'),
    ('business_events', '本期重要业务事项'),
])}

## 输出要求
### 📉/📈 归因结论（核心变动因子 Top 3）
（每条含：维度 / 变动值 / 根因分析 / 对总分的贡献）

### 🔍 逐维度深度分析
（遍历六维度，每个给出 2-3 句分析）

### 💡 建议后续关注的指标
（3-5 条前瞻性指标）
"""
    return {
        'messages': build_messages(build_system_prompt(CREDIT_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


def credit_peer_compare(context):
    """F201.5 · 同业对标分析"""
    user = f"""请为企业做同业对标：

{fmt_context(context, [
    ('self', '本企业信息（含六维度得分）'),
    ('peers', '同业企业列表（含六维度得分）'),
    ('industry_avg', '行业均值'),
])}

## 输出
### 1. 整体位置
（头/中/尾部 + 百分位）

### 2. 逐维度差距分析（表格）

### 3. 标杆借鉴 Top 3
（每条含：标杆企业 / 标杆做法 / 可复制性 / 改造建议）

### 4. 差异化机会
（与同业差异化竞争的 2-3 个方向）
"""
    return {
        'messages': build_messages(build_system_prompt(CREDIT_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


def credit_dispute(context):
    """F201.8 · AI 异议处理"""
    user = f"""企业对信用评级提出异议，请协助给出官方答复草稿：

{fmt_context(context, [
    ('dispute_reason', '异议事由'),
    ('enterprise_claim', '企业主张'),
    ('rating_data', '评级支撑数据'),
    ('our_methodology', '我方评级方法依据'),
])}

## 输出
### 1. 异议要点定位（3 条以内）
### 2. 数据核实结果
### 3. 复核结论：[ 维持原判 / 部分调整 / 重新评估 ]
### 4. 答复草稿（正式公文风格，直接可用）
### 5. 后续跟进建议
"""
    return {
        'messages': build_messages(build_system_prompt(CREDIT_ROLE), user),
        'temperature': 0.2,
        'max_tokens': 2000,
        'enable_thinking': True,
    }


# 注册表
HANDLERS = {
    'credit_eval': credit_eval,
    'credit_explain': credit_explain,
    'credit_suggestions': credit_suggestions,
    'credit_attribution': credit_attribution,
    'credit_peer_compare': credit_peer_compare,
    'credit_dispute': credit_dispute,
}

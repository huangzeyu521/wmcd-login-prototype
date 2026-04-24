"""风险防控智能体 · Prompt 工程模块"""
from .base import build_system_prompt, build_messages, fmt_context


RISK_ROLE = """## 你的身份
你是"皖美信用"平台**风险防控智能体**的首席风控合规官。
- 对标中国电信翼支付"御风"穿透式监管平台经验
- 精通三穿透（主体/业务/数据）机制
- 熟悉国务院国资委 32/42号令、三重一大合规、担保圈识别
- 替国资委监管员、国企风控合规总监思考："风险在哪、怎么处置、如何闭环"

## 你的核心能力
1. **毫秒级监测**：七大风险类别实时监测
2. **三穿透**：主体穿透（股权到实控）/ 业务穿透（担保圈/资金池）/ 数据穿透（跨系统）
3. **案例驱动**：结合历史处置案例库给出最佳实践
4. **风险闭环**：识别 → 分级 → 处置 → 复盘
"""


def risk_alert_explain(context):
    """F207.1 · AI 风险预警解读"""
    user = f"""请对以下风险预警做专业解读：

{fmt_context(context, [
    ('enterprise_name', '企业'),
    ('risk_type', '风险类型'),
    ('risk_level', '风险等级'),
    ('trigger', '触发条件'),
    ('indicator_values', '指标值'),
    ('historical_similar', '历史类似事件'),
])}

## 输出
### 🚨 一句话结论
### 📊 风险程度客观评估
### 🔍 根因归因（Top 3）
### ⏱ 紧迫度分析（未来 7/30/90 天演化）
### 💊 建议处置方案（3 档：保守/激进/平衡）
### 🔗 建议联动的智能体
### 👤 建议处置责任人（含 On-Call 建议）
"""
    return {
        'messages': build_messages(build_system_prompt(RISK_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2800,
        'enable_thinking': True,
    }


def risk_penetration(context):
    """F207.2 · AI 三穿透分析"""
    user = f"""请对以下企业做三穿透深度分析：

{fmt_context(context, [
    ('enterprise_name', '企业'),
    ('equity_layers', '股权层级'),
    ('subsidiaries', '下属企业'),
    ('cross_transactions', '关联交易'),
    ('guarantee_relations', '担保关系'),
    ('cash_pool', '资金池情况'),
])}

## 输出

### 👤 主体穿透
- 实际控制人：
- 关键受益人：
- 股权链路（从集团到三级子公司）：
- 异常发现：

### 💼 业务穿透
- 关联交易链路：
- 担保圈识别：
- 资金池循环：
- 异常发现：

### 📊 数据穿透
- 跨系统数据一致性：
- 信息披露完整性：
- 异常发现：

### 🚨 综合结论
- 风险传染路径
- 关键阻断点
- 处置建议
"""
    return {
        'messages': build_messages(build_system_prompt(RISK_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def risk_disposal_plan(context):
    """F207.3 · 处置方案生成"""
    user = f"""请为以下风险事件生成闭环处置方案：

{fmt_context(context, [
    ('event_name', '事件'),
    ('risk_level', '风险等级'),
    ('affected_entities', '涉及主体'),
    ('financial_impact', '财务影响'),
    ('timeline_pressure', '时间压力'),
])}

## 输出
### 总体思路

### 分阶段方案
#### 紧急阶段（24h 内）
- 应急措施
- 责任人

#### 中期阶段（7天）
- 深度处置
- 协同机构

#### 长期阶段（30天）
- 根本解决
- 制度修复

### 处置资源需求
### 预期效果
### 预案Plan B
### 合规底线
"""
    return {
        'messages': build_messages(build_system_prompt(RISK_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def risk_guarantee_circle(context):
    """F207.4 · 担保圈识别"""
    user = f"""请识别并分析担保圈风险：

{fmt_context(context, [
    ('enterprise_group', '分析主体群'),
    ('guarantee_data', '担保关系数据'),
    ('financial_positions', '各方财务状况'),
])}

## 输出
### 🕸 担保圈图谱文字描述
### 核心节点（承担最多连带责任的主体）
### 风险传染路径（最可能的爆雷链条）
### 破圈建议
### 预防复发
"""
    return {
        'messages': build_messages(build_system_prompt(RISK_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def risk_compliance_check(context):
    """F207.5 · AI 合规审查"""
    user = f"""请对以下事项做合规审查：

{fmt_context(context, [
    ('event_type', '事项类型（重大投资/担保/关联交易/股权变动）'),
    ('amount', '涉及金额'),
    ('enterprise', '涉及主体'),
    ('approval_process', '已履行的决策程序'),
    ('related_documents', '相关文件'),
])}

## 输出
### ✅/⚠/❌ 合规判定
### 依据条款（引用 32号令 / 42号令 / 三重一大）
### 合规风险点
### 整改建议
### 审批路径建议
"""
    return {
        'messages': build_messages(build_system_prompt(RISK_ROLE), user),
        'temperature': 0.2,
        'max_tokens': 2800,
        'enable_thinking': True,
    }


def risk_supervision_report(context):
    """F207.6 · 监管报告生成"""
    user = f"""请生成监管报告：

{fmt_context(context, [
    ('report_period', '期间'),
    ('report_type', '类型（日/周/月/季/年）'),
    ('key_metrics', '核心指标'),
    ('risk_events', '风险事件'),
    ('achievements', '监管成效'),
])}

## 输出（正式公文风格）
### 1. 本期监管态势总览
### 2. 重点风险事件与处置
### 3. 典型案例分析
### 4. 存在的问题
### 5. 下一步工作建议
### 6. 附件清单

要求：严格公文格式，措辞准确，引用准确。
"""
    return {
        'messages': build_messages(build_system_prompt(RISK_ROLE), user),
        'temperature': 0.2,
        'max_tokens': 4000,
        'enable_thinking': True,
    }


def risk_supervise_draft(context):
    """F207.7 · 督办指令起草"""
    user = f"""请起草督办指令（国资委下发至国企）：

{fmt_context(context, [
    ('issue', '督办事由'),
    ('severity', '严重程度'),
    ('target_entity', '督办对象'),
    ('deadline', '期限'),
    ('expected_results', '期望反馈'),
])}

## 输出（正式公文格式）
### 督办标题
### 事实描述
### 督办要求（分条列出）
### 时限与反馈
### 违规后果
### 落款与签批

要求：简洁、严肃、明确。
"""
    return {
        'messages': build_messages(build_system_prompt(RISK_ROLE), user),
        'temperature': 0.2,
        'max_tokens': 2000,
        'enable_thinking': True,
    }


HANDLERS = {
    'risk_alert_explain': risk_alert_explain,
    'risk_penetration': risk_penetration,
    'risk_disposal_plan': risk_disposal_plan,
    'risk_guarantee_circle': risk_guarantee_circle,
    'risk_compliance_check': risk_compliance_check,
    'risk_supervision_report': risk_supervision_report,
    'risk_supervise_draft': risk_supervise_draft,
}

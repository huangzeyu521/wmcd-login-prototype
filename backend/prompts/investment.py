"""投资决策智能体 · Prompt 工程模块"""
from .base import build_system_prompt, build_messages, fmt_context


INV_ROLE = """## 你的身份
你是"皖美信用"平台**投资决策智能体**的首席投资分析师。
- 管理过百亿规模产业基金，熟悉一级市场全阶段（Pre-A 到 Pre-IPO 到并购）
- 精通 DCF / 相对估值 / 可比交易 / 实物期权多模型融合估值
- 深度理解安徽省产业引导基金、国资直投、科创板/创业板政策导向
- 替战略部/投委会思考："这笔投资该不该投/投多少/怎么退"

## 你的核心能力
1. **产业研究**：宏观赛道 → 细分赛道 → 区域机会 → 具体标的层层递进
2. **七大维度评估**：行业前景/商业模式/财务/团队/技术壁垒/信用资质/盈利预期
3. **三模型估值融合**：给出保守/中位/乐观三区间
4. **风险前置预判**：整合、商誉、政治、合规五维风险
5. **退出路径优化**：IPO / 并购 / 股转 / 回购 四选一建议
"""


def investment_industry_research(context):
    """F203.1 · AI 产业研究"""
    user = f"""请对以下产业赛道进行深度研究：

{fmt_context(context, [
    ('industry', '目标行业'),
    ('sub_sector', '细分赛道'),
    ('region_focus', '区域重点（默认安徽）'),
    ('investment_horizon', '投资期限（1-3/3-5/5-10年）'),
])}

## 输出

### 🌍 宏观研判
1. 行业全球与国内发展阶段（导入期/成长期/成熟期/衰退期）
2. 市场规模（现状+3年/5年预测）
3. CAGR 与利润率趋势
4. 关键驱动因素 Top 3

### 🏭 竞争格局
- 龙头企业 / 腰部玩家 / 初创
- 护城河类型（品牌/技术/资本/渠道/政策）
- 格局演变预测

### 📜 政策环境
- 国家政策（"十四五"/"十五五"/产业目录）
- 安徽省政策（十一大产业/三地一区）
- 属地配套（财政/税收/基金）

### 🧭 投资机会 Top 3
每条：
- 机会类型（风险投资/PE/并购/产业孵化）
- 预期回报率
- 最佳入场时机
- 关键风险

### ⚠ 风险警示
（政策/周期/技术替代/地缘）

### 🎯 对安徽国资的建议
（结合皖能/江汽/海螺等存量布局）
"""
    return {
        'messages': build_messages(build_system_prompt(INV_ROLE), user),
        'temperature': 0.5,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def investment_target_profile(context):
    """F203.2 · 标的企业画像"""
    user = f"""请为以下标的企业生成多维度投资画像：

{fmt_context(context, [
    ('target_name', '标的名称'),
    ('industry', '行业'),
    ('founding_year', '成立年份'),
    ('stage', '发展阶段'),
    ('core_product', '核心产品/服务'),
    ('revenue', '近年营收'),
    ('growth_rate', '增长率'),
    ('team', '核心团队'),
    ('tech_moat', '技术护城河'),
    ('shareholders', '主要股东'),
])}

## 输出结构
### 📷 企业画像（一句话概括）

### 🏢 基本情况
### 💰 财务画像
### 👥 团队画像
### 🏭 业务画像
### 📈 成长画像
### 🛡 风险画像
### 🔗 关联画像（股权穿透/实控人）

### 🎯 投资者视角结论
- 值不值得深入尽调：Yes / No
- 核心看点 Top 3
- 核心疑点 Top 3
"""
    return {
        'messages': build_messages(build_system_prompt(INV_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def investment_dd_checklist(context):
    """F203.3 · AI 尽调清单生成"""
    user = f"""请为以下拟投项目生成个性化尽调清单：

{fmt_context(context, [
    ('target_name', '标的名称'),
    ('industry', '行业'),
    ('deal_size', '交易规模'),
    ('investor_type', '投资人类型（产业/财务）'),
    ('risk_concerns', '已识别的风险关注点'),
])}

## 输出
### 📋 四大尽调方向 × 具体任务清单

#### 🧾 财务尽调（10+ 任务）
| 序号 | 任务 | 紧迫度 | 执行部门 | 预计耗时 |

#### 📜 法律尽调（10+ 任务）
#### 🏢 业务尽调（10+ 任务）
#### 🔬 技术尽调（6+ 任务）

### ⏱ 尽调总时长预估
### 👥 建议尽调团队组成
### 📅 甘特时间表（按天）
"""
    return {
        'messages': build_messages(build_system_prompt(INV_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3000,
        'enable_thinking': True,
    }


def investment_valuation(context):
    """F203.4 · AI 估值报告"""
    user = f"""请为标的企业做三模型融合估值：

{fmt_context(context, [
    ('target_name', '标的名称'),
    ('revenue_5y', '近5年营收'),
    ('net_profit_5y', '近5年净利'),
    ('fcf_5y', '近5年自由现金流'),
    ('peer_companies', '对标上市公司'),
    ('comparable_deals', '近2年可比交易'),
    ('discount_rate', '建议折现率'),
])}

## 输出结构

### 📊 估值区间综合结论
- 保守：X 亿
- 中位：X 亿 ⭐
- 乐观：X 亿
- 建议交易估值：X 亿（含对赌条款）

### 模型 1：DCF
（关键假设 + 计算表 + 敏感性分析）

### 模型 2：相对估值（PE / PB / EV/EBITDA）
（对标表 + 修正系数 + 结论）

### 模型 3：可比交易
（近2年可比交易列表 + 中位乘数 + 结论）

### 三模型加权
（权重依据 + 加权计算）

### 💡 估值敏感性分析
（对关键假设的敏感性）

### ⚠ 估值风险提示
（3-5条）
"""
    return {
        'messages': build_messages(build_system_prompt(INV_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 3500,
        'enable_thinking': True,
    }


def investment_ic_package(context):
    """F203.5 · 投委会决策包"""
    user = f"""请生成投委会 Pre-IC 决策包：

{fmt_context(context, [
    ('project_name', '项目名称'),
    ('target_name', '标的'),
    ('deal_size', '拟投金额'),
    ('equity_pct', '拟持股%'),
    ('valuation', '估值'),
    ('exit_plan', '退出计划'),
    ('strategic_fit', '与母公司战略契合'),
])}

## 输出（一份可直接提交投委会的材料）
### 一、项目摘要（Executive Summary，1页）
### 二、投资逻辑
### 三、标的画像（核心版）
### 四、估值依据
### 五、风险矩阵
### 六、退出路径
### 七、交易结构
### 八、投委会审议要点（3-5 条）
### 九、建议决议
- 推荐决议：[ 同意投资 / 条件性同意 / 暂缓 / 不予投资 ]
- 关键条件：...
"""
    return {
        'messages': build_messages(build_system_prompt(INV_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 4000,
        'enable_thinking': True,
    }


def investment_post_monitor(context):
    """F203.6 · AI 投后监测解读"""
    user = f"""请对已投项目做投后专业解读：

{fmt_context(context, [
    ('project_name', '项目'),
    ('milestone_status', '里程碑达成'),
    ('financial_performance', '财务表现'),
    ('performance_commitment', '业绩承诺'),
    ('anomalies', '异常信号'),
])}

## 输出
### 🎯 综合状态：[ 正常/关注/预警/危险 ]
### 📊 关键指标扫描
### ⚠ 异常归因（3条以内）
### 🚑 建议干预措施（分3档）
### 🔗 建议联动的智能体
### 🎬 未来30天动作清单
"""
    return {
        'messages': build_messages(build_system_prompt(INV_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2500,
        'enable_thinking': True,
    }


def investment_exit(context):
    """F203.7 · 退出路径规划"""
    user = f"""请为以下已投项目设计最优退出路径：

{fmt_context(context, [
    ('project_name', '项目'),
    ('holding_period', '持有期'),
    ('cost_basis', '成本基数'),
    ('current_valuation', '当前估值'),
    ('market_condition', '当前市场环境'),
    ('target_status', '标的发展阶段'),
])}

## 输出
### 🏆 推荐退出路径：[ IPO / 并购 / 股转 / 回购 ]

### 四路径横向对比（表格）
| 路径 | 预计时间 | 预期回报倍数 | 难度 | 税负 | 风险 |

### 推荐方案详细拆解
### 替代方案（次优）
### 触发二次评估的事件（动态监控）
"""
    return {
        'messages': build_messages(build_system_prompt(INV_ROLE), user),
        'temperature': 0.3,
        'max_tokens': 2800,
        'enable_thinking': True,
    }


HANDLERS = {
    'investment_industry_research': investment_industry_research,
    'investment_target_profile': investment_target_profile,
    'investment_dd_checklist': investment_dd_checklist,
    'investment_valuation': investment_valuation,
    'investment_ic_package': investment_ic_package,
    'investment_post_monitor': investment_post_monitor,
    'investment_exit': investment_exit,
}

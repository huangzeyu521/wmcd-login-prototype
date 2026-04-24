"""公共能力（AI 助手 / 搜索 / 推荐）· Prompt 工程模块"""
from .base import build_system_prompt, build_messages


COMMON_ROLE = """## 你的身份
你是"皖美信用"平台的全局 AI 助手，面向所有角色提供智能化支持。
- 能识别用户意图，必要时建议跳转到对应智能体
- 面向 7 类角色差异化回答
- 熟悉平台所有功能入口
- 回答简洁、专业、友好

## 你的核心能力
- 自然语言问答
- 平台功能导览
- 业务快速咨询
- 跨智能体协同建议
"""


def assistant_chat(context):
    """全局 AI 助手对话"""
    msg = context.get('message', '')
    history = context.get('history', [])
    role = context.get('user_role', 'user')

    system = build_system_prompt(COMMON_ROLE, f"""
## 当前用户角色
{role}

## 回答原则
1. 先简短直接回答问题（3 句话内）
2. 然后给出结构化展开（如有必要）
3. 最后主动推荐相关功能入口（如"您可以点击'融资支持智能体 → 新建融资需求'快速办理"）
4. 如遇超纲问题，明确告知并引导到正确入口
""")

    return {
        'messages': build_messages(system, msg, history=history),
        'temperature': 0.6,
        'max_tokens': 1800,
        'enable_thinking': True,
    }


def workbench_recommend(context):
    """AI 工作台个性化推荐"""
    role = context.get('user_role', '')
    recent = context.get('recent_activities', [])

    user = f"""基于用户角色和近期行为，推荐今日 3-5 条个性化行动建议：

## 用户画像
- 角色：{role}
- 所属机构：{context.get('org', '')}
- 近期关注：{context.get('focus', '')}

## 近期行为
{chr(10).join(f'- {a}' for a in recent) if recent else '（无）'}

## 输出
每条建议用 1-2 行描述，并提供行动按钮。
"""
    return {
        'messages': build_messages(build_system_prompt(COMMON_ROLE), user),
        'temperature': 0.5,
        'max_tokens': 1500,
        'enable_thinking': False,
    }


def search_nl(context):
    """自然语言搜索"""
    query = context.get('query', '')
    user = f"""用户的自然语言查询："{query}"

## 输出
### 查询意图识别
（这是一个什么样的查询：企业查询 / 数据查询 / 政策问询 / 操作指引 / 其他）

### 结构化答案

### 推荐功能入口（Top 3）
每个入口配：名称 / URL / 简介
"""
    return {
        'messages': build_messages(build_system_prompt(COMMON_ROLE), user),
        'temperature': 0.4,
        'max_tokens': 1500,
        'enable_thinking': False,
    }


HANDLERS = {
    'assistant_chat': assistant_chat,
    'workbench_recommend': workbench_recommend,
    'search_nl': search_nl,
}

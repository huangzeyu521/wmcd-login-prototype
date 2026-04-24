"""Prompt 注册中心 · 统一入口"""
from . import credit, financing, investment, assets, ma, supply, risk, common

# agent_id → handlers dict
AGENT_REGISTRY = {
    'credit': credit.HANDLERS,
    'financing': financing.HANDLERS,
    'investment': investment.HANDLERS,
    'assets': assets.HANDLERS,
    'ma': ma.HANDLERS,
    'supply': supply.HANDLERS,
    'risk': risk.HANDLERS,
    'common': common.HANDLERS,
}


def get_prompt(agent_id: str, function: str, context: dict) -> dict:
    """
    根据 agent_id 和 function 返回渲染后的 prompt 规格。

    返回: {
        'messages': [{role, content}, ...],
        'temperature': float,
        'max_tokens': int,
        'enable_thinking': bool,
    }
    """
    agent = AGENT_REGISTRY.get(agent_id)
    if not agent:
        raise KeyError(f'Unknown agent: {agent_id}')
    handler = agent.get(function)
    if not handler:
        raise KeyError(f'Unknown function for {agent_id}: {function}')
    return handler(context or {})


def list_all_functions():
    """列出所有已注册的功能（用于测试与文档）"""
    out = {}
    for aid, handlers in AGENT_REGISTRY.items():
        out[aid] = list(handlers.keys())
    return out

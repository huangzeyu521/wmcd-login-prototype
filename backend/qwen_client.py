"""Qwen3-Max-Preview 客户端
--------------------------------------------------------------
核心能力：
- OpenAI 兼容模式（DashScope Compatible API）
- SSE 流式输出
- 思考链（enable_thinking）支持
- 自动重试 + 超时控制
- 无 API Key 时 Mock 降级（开发/演示）
- 所有异常友好化为 AIError
"""
import json
import time
import uuid
import requests
from typing import Generator, List, Dict, Optional

from config import Config
from audit import log, audit_ai_call


class AIError(Exception):
    """友好化异常：面向用户"""

    def __init__(self, user_message: str, code: str = 'ai_error',
                 http_status: int = 500, raw: str = ''):
        super().__init__(user_message)
        self.user_message = user_message
        self.code = code
        self.http_status = http_status
        self.raw = raw


# ============== 事件类型 ==============
# event: step       步骤进度（步骤号/名称/状态）
# event: thinking   思考链片段
# event: content    最终内容片段
# event: token      token 统计
# event: done       完成
# event: error      错误


class QwenClient:
    """Qwen 调用封装"""

    def __init__(self):
        self.base_url = Config.QWEN_BASE_URL.rstrip('/')
        self.model = Config.QWEN_MODEL
        self.timeout = Config.QWEN_TIMEOUT
        self.max_retries = Config.QWEN_MAX_RETRIES

    def chat_stream(self,
                    messages: List[Dict],
                    *,
                    agent: str = 'unknown',
                    function: str = 'unknown',
                    user_id: Optional[str] = None,
                    enterprise_id: Optional[str] = None,
                    temperature: Optional[float] = None,
                    max_tokens: Optional[int] = None,
                    enable_thinking: Optional[bool] = None,
                    trace_id: Optional[str] = None,
                    ) -> Generator[Dict, None, None]:
        """
        流式对话。yield 事件字典 {'event': ..., 'data': ...}

        事件顺序：
          step(parsing) -> step(matching) -> step(reasoning) -> thinking(...) ->
          step(generating) -> content(...) -> step(compliance) -> done
        """
        trace_id = trace_id or uuid.uuid4().hex[:16]
        started = time.time()

        log('INFO', 'AI call start', trace_id=trace_id, agent=agent, function=function)

        input_summary = ''
        for m in messages:
            c = m.get('content', '')
            if isinstance(c, str):
                input_summary += c[:200] + ' | '

        # 启动信号：用户端立即看到"开始处理"
        yield {'event': 'step', 'data': {
            'step': 1, 'total': 6, 'name': '数据解析',
            'status': 'running', 'msg': '正在解析您的输入与业务上下文…',
        }}

        # 预判：是否可以调用真实 API
        if not Config.has_api_key():
            if Config.ENABLE_MOCK_FALLBACK:
                log('WARN', 'API key not configured, using MOCK mode', trace_id=trace_id)
                yield from self._mock_stream(
                    messages, trace_id=trace_id, agent=agent, function=function
                )
                audit_ai_call(
                    agent=agent, function=function,
                    user_id=user_id, enterprise_id=enterprise_id,
                    input_summary=input_summary,
                    duration_ms=int((time.time() - started) * 1000),
                    trace_id=trace_id, status='mock',
                )
                return
            else:
                err = AIError(
                    '大模型服务未配置。管理员请设置 QWEN36_MAX_API_KEY。',
                    code='missing_api_key', http_status=503,
                )
                yield {'event': 'error', 'data': {'code': err.code, 'message': err.user_message}}
                audit_ai_call(
                    agent=agent, function=function,
                    user_id=user_id, enterprise_id=enterprise_id,
                    input_summary=input_summary, error=err.user_message,
                    duration_ms=int((time.time() - started) * 1000),
                    trace_id=trace_id, status='error',
                )
                return

        # ============== 真实 API 调用 ==============
        yield {'event': 'step', 'data': {
            'step': 2, 'total': 6, 'name': '规则匹配',
            'status': 'running', 'msg': '正在匹配国资专属知识库与属地政策…',
        }}

        url = self.base_url + '/chat/completions'
        headers = {
            'Authorization': f'Bearer {Config.QWEN_API_KEY}',
            'Content-Type': 'application/json',
        }
        payload = {
            'model': self.model,
            'messages': messages,
            'stream': True,
            'temperature': temperature if temperature is not None else Config.QWEN_TEMPERATURE,
            'max_tokens': max_tokens or Config.QWEN_MAX_TOKENS,
            # DashScope: 显式流式增量（delta 模式）
            'stream_options': {'include_usage': True},
        }
        # qwen3 系列思考模式
        if (enable_thinking if enable_thinking is not None else Config.QWEN_ENABLE_THINKING):
            payload['enable_thinking'] = True
            payload['thinking_budget'] = Config.QWEN_THINKING_BUDGET

        last_err = None
        for attempt in range(self.max_retries + 1):
            try:
                yield {'event': 'step', 'data': {
                    'step': 3, 'total': 6, 'name': '深度推理',
                    'status': 'running', 'msg': '大模型正在深度推理…' + (
                        f'（第 {attempt + 1} 次尝试）' if attempt > 0 else ''
                    ),
                }}

                resp = requests.post(
                    url, headers=headers, json=payload, stream=True,
                    timeout=self.timeout,
                )
                if resp.status_code == 401:
                    raise AIError(
                        '大模型服务认证失败，请检查 API Key 是否正确。',
                        code='unauthorized', http_status=401,
                    )
                if resp.status_code == 429:
                    raise AIError(
                        '当前调用人数较多，正在为您重试…',
                        code='rate_limited', http_status=429,
                    )
                if resp.status_code >= 500:
                    raise AIError(
                        '大模型服务暂时不可用，请稍后重试',
                        code='service_unavailable', http_status=resp.status_code,
                    )
                if resp.status_code != 200:
                    raise AIError(
                        f'大模型服务异常（{resp.status_code}）',
                        code='http_error', http_status=resp.status_code,
                        raw=resp.text[:500],
                    )

                yield from self._parse_sse(resp, trace_id=trace_id)

                # 成功
                duration = int((time.time() - started) * 1000)
                audit_ai_call(
                    agent=agent, function=function,
                    user_id=user_id, enterprise_id=enterprise_id,
                    input_summary=input_summary,
                    duration_ms=duration, trace_id=trace_id, status='ok',
                )
                return

            except (requests.Timeout, requests.ConnectionError) as e:
                last_err = e
                log('WARN', f'API call failed, retry {attempt}/{self.max_retries}',
                    trace_id=trace_id, error=str(e))
                if attempt < self.max_retries:
                    # 退避重试
                    wait_s = 1.5 ** attempt
                    yield {'event': 'step', 'data': {
                        'step': 3, 'total': 6, 'name': '网络重试',
                        'status': 'warning',
                        'msg': f'网络抖动，{wait_s:.1f}秒后自动重试…',
                    }}
                    time.sleep(wait_s)
                    continue
                else:
                    err = AIError(
                        '网络连接大模型服务超时，请稍后重试。您的输入已保留。',
                        code='timeout', http_status=504,
                    )
                    yield {'event': 'error', 'data': {
                        'code': err.code, 'message': err.user_message,
                    }}
                    audit_ai_call(
                        agent=agent, function=function,
                        user_id=user_id, enterprise_id=enterprise_id,
                        input_summary=input_summary,
                        error=str(e),
                        duration_ms=int((time.time() - started) * 1000),
                        trace_id=trace_id, status='error',
                    )
                    return
            except AIError as e:
                if e.code == 'rate_limited' and attempt < self.max_retries:
                    time.sleep(2 ** attempt)
                    continue
                yield {'event': 'error', 'data': {
                    'code': e.code, 'message': e.user_message,
                }}
                audit_ai_call(
                    agent=agent, function=function,
                    user_id=user_id, enterprise_id=enterprise_id,
                    input_summary=input_summary,
                    error=e.user_message,
                    duration_ms=int((time.time() - started) * 1000),
                    trace_id=trace_id, status='error',
                )
                return
            except Exception as e:
                last_err = e
                log('ERROR', f'Unexpected error: {e}', trace_id=trace_id)
                yield {'event': 'error', 'data': {
                    'code': 'unknown', 'message': '大模型调用异常，请稍后重试',
                }}
                audit_ai_call(
                    agent=agent, function=function,
                    user_id=user_id, enterprise_id=enterprise_id,
                    input_summary=input_summary,
                    error=str(e),
                    duration_ms=int((time.time() - started) * 1000),
                    trace_id=trace_id, status='error',
                )
                return

    def _parse_sse(self, resp, trace_id: str) -> Generator[Dict, None, None]:
        """解析 OpenAI 兼容的 SSE 流"""
        total_content = []
        total_thinking = []
        step_3_announced = False

        for line in resp.iter_lines(decode_unicode=True):
            if not line:
                continue
            if not line.startswith('data:'):
                continue
            data = line[5:].strip()
            if data == '[DONE]':
                break
            try:
                chunk = json.loads(data)
            except Exception:
                continue

            choices = chunk.get('choices') or []
            if not choices:
                # usage-only chunk
                usage = chunk.get('usage')
                if usage:
                    yield {'event': 'token', 'data': usage}
                continue

            delta = choices[0].get('delta', {}) or {}

            # 思考链片段
            reasoning = delta.get('reasoning_content', '') or delta.get('thinking', '')
            if reasoning:
                total_thinking.append(reasoning)
                yield {'event': 'thinking', 'data': reasoning}

            # 正式内容片段
            content = delta.get('content', '')
            if content:
                if not step_3_announced:
                    yield {'event': 'step', 'data': {
                        'step': 4, 'total': 6, 'name': '方案生成',
                        'status': 'running', 'msg': '正在组织专业答复…',
                    }}
                    step_3_announced = True
                total_content.append(content)
                yield {'event': 'content', 'data': content}

        # 合规校验（简单内容过滤）
        yield {'event': 'step', 'data': {
            'step': 5, 'total': 6, 'name': '合规校验',
            'status': 'running', 'msg': '正在进行内容合规审查…',
        }}
        full = ''.join(total_content)
        violations = self._content_filter(full)
        if violations:
            yield {'event': 'step', 'data': {
                'step': 5, 'total': 6, 'name': '合规校验',
                'status': 'warning',
                'msg': f'检测到 {len(violations)} 处合规提示，已标注',
            }}

        yield {'event': 'step', 'data': {
            'step': 6, 'total': 6, 'name': '结果输出',
            'status': 'done', 'msg': '生成完成',
        }}
        yield {'event': 'done', 'data': {'total_chars': len(full)}}

    def _content_filter(self, text: str) -> list:
        """简单内容过滤，返回触发词列表"""
        if not Config.CONTENT_FILTER_ENABLED or not text:
            return []
        hits = []
        for kw in Config.CONTENT_FORBID_KEYWORDS:
            if kw.lower() in text.lower():
                hits.append(kw)
        return hits

    def _mock_stream(self, messages, *, trace_id, agent, function) -> Generator[Dict, None, None]:
        """未配置 API Key 时的 Mock 模式，用于本地演示。
        生成符合业务场景的模拟响应，所有步骤/思考链/内容事件都完整。
        """
        from prompts.mock_responses import mock_response_for
        import random

        user_msg = ''
        for m in messages:
            if m.get('role') == 'user':
                user_msg = m.get('content', '')
                break

        mock = mock_response_for(agent, function, user_msg)

        # 模拟步骤
        steps = [
            ('规则匹配', '正在匹配国资专属知识库与属地政策…'),
            ('深度推理', '大模型正在深度推理…'),
            ('方案生成', '正在组织专业答复…'),
        ]
        for i, (name, msg) in enumerate(steps):
            yield {'event': 'step', 'data': {
                'step': i + 2, 'total': 6, 'name': name,
                'status': 'running', 'msg': msg,
            }}
            time.sleep(0.3)

        # 思考链
        for seg in mock.get('thinking', []):
            yield {'event': 'thinking', 'data': seg}
            time.sleep(0.08)

        yield {'event': 'step', 'data': {
            'step': 4, 'total': 6, 'name': '方案生成',
            'status': 'running', 'msg': '正在组织专业答复…',
        }}

        # 内容流式
        content = mock.get('content', '')
        # 按字符段切片模拟流式
        chunk_size = 8
        for i in range(0, len(content), chunk_size):
            seg = content[i:i + chunk_size]
            yield {'event': 'content', 'data': seg}
            time.sleep(0.025)

        yield {'event': 'step', 'data': {
            'step': 5, 'total': 6, 'name': '合规校验',
            'status': 'running', 'msg': '正在进行内容合规审查…',
        }}
        time.sleep(0.2)
        yield {'event': 'step', 'data': {
            'step': 6, 'total': 6, 'name': '结果输出',
            'status': 'done', 'msg': '生成完成（Mock 模式）',
        }}
        yield {'event': 'done', 'data': {
            'total_chars': len(content), 'mock': True,
        }}


# 全局单例
_client = None


def get_client() -> QwenClient:
    global _client
    if _client is None:
        _client = QwenClient()
    return _client

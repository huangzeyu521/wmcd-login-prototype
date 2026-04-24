"""皖美信用 · 后端主应用（Flask + SSE）
--------------------------------------------------------------
路由：
  GET  /api/health                    健康检查
  GET  /api/config/public             公开配置（不含密钥）
  POST /api/ai/chat/stream            通用流式对话（SSE）
  POST /api/ai/agent/<agent>/stream   七大智能体专属端点（SSE）
  POST /api/ai/assistant/stream       全局 AI 助手（SSE）
  GET  /api/audit/recent              最近审计记录（演示）
"""
import json
import time
import uuid
from collections import defaultdict, deque
from threading import Lock
from flask import Flask, request, Response, jsonify
from flask_cors import CORS

from config import Config
from audit import log, audit
from qwen_client import get_client, AIError
from prompts import registry as prompt_registry

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}},
     supports_credentials=False)

# ============== 速率限制（简易） ==============
_rate_store = defaultdict(deque)  # ip -> deque[timestamps]
_rate_lock = Lock()


def _rate_ok(key: str) -> bool:
    now = time.time()
    with _rate_lock:
        q = _rate_store[key]
        # 清理 60s 外的
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= Config.RATE_LIMIT_PER_MIN:
            return False
        q.append(now)
        return True


def _client_ip():
    return request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown').split(',')[0].strip()


# ============== 健康检查 / 配置 ==============
@app.get('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'service': 'wm-ai-backend',
        'version': 'v1.0',
        'ts': int(time.time() * 1000),
    })


@app.get('/api/config/public')
def public_config():
    """返回脱敏后的公开配置"""
    return jsonify(Config.as_dict_safe())


# ============== SSE 格式化 ==============
def _sse(event: str, data) -> str:
    body = json.dumps(data, ensure_ascii=False) if not isinstance(data, str) else data
    return f'event: {event}\ndata: {body}\n\n'


def _sse_keepalive() -> str:
    """SSE心跳（Nginx 代理防断）"""
    return ': ping\n\n'


def _stream_response(generator_fn):
    """SSE Response 包装器"""
    def gen():
        try:
            for evt in generator_fn():
                yield _sse(evt['event'], evt['data'])
                # DONE 后结束
                if evt['event'] == 'done' or evt['event'] == 'error':
                    return
        except Exception as e:
            log('ERROR', f'stream error: {e}')
            yield _sse('error', {
                'code': 'stream_error',
                'message': '响应流异常，请刷新后重试',
            })

    return Response(
        gen(), mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',  # Nginx 禁止缓冲
            'Connection': 'keep-alive',
        }
    )


def _validate_input(body):
    if not body or not isinstance(body, dict):
        raise AIError('请求参数为空', code='bad_request', http_status=400)

    ctx = body.get('context') or {}
    user_input = body.get('input') or body.get('message') or ''
    if isinstance(user_input, str) and len(user_input) > Config.MAX_INPUT_LENGTH:
        raise AIError(
            f'输入内容过长（≤{Config.MAX_INPUT_LENGTH}字符）',
            code='input_too_long', http_status=400,
        )
    return user_input, ctx


# ============== 通用流式对话 ==============
@app.post('/api/ai/chat/stream')
def ai_chat_stream():
    ip = _client_ip()
    if not _rate_ok(ip):
        return jsonify({
            'code': 'rate_limited',
            'message': '请求过于频繁，请稍后再试',
        }), 429
    try:
        body = request.get_json(silent=True) or {}
        user_input, context = _validate_input(body)
        user_id = body.get('user_id') or 'anonymous'
        enterprise_id = body.get('enterprise_id')
        trace_id = uuid.uuid4().hex[:16]

        messages = [
            {'role': 'system', 'content': '你是安徽国资国企"皖美信用"平台的 AI 助手，请以专业、友好的语气回答。'},
            {'role': 'user', 'content': user_input},
        ]

        def gen():
            client = get_client()
            for evt in client.chat_stream(
                messages,
                agent='general', function='chat',
                user_id=user_id, enterprise_id=enterprise_id,
                trace_id=trace_id,
            ):
                yield evt

        return _stream_response(gen)

    except AIError as e:
        return jsonify({'code': e.code, 'message': e.user_message}), e.http_status
    except Exception as e:
        log('ERROR', f'chat_stream: {e}')
        return jsonify({'code': 'internal_error', 'message': '服务异常'}), 500


# ============== 七大智能体专属端点 ==============
@app.post('/api/ai/agent/<agent>/stream')
def ai_agent_stream(agent):
    """智能体专属调用
    body: {
      "function": "credit_eval"|"credit_explain"|...,
      "context": { ... 业务上下文 ... },
      "user_id": "U003",
      "enterprise_id": "E001"
    }
    """
    ip = _client_ip()
    if not _rate_ok(ip):
        return jsonify({
            'code': 'rate_limited', 'message': '请求过于频繁，请稍后再试',
        }), 429

    try:
        body = request.get_json(silent=True) or {}
        function = body.get('function') or ''
        context = body.get('context') or {}
        user_id = body.get('user_id') or 'anonymous'
        enterprise_id = body.get('enterprise_id')
        trace_id = uuid.uuid4().hex[:16]

        # 校验 agent 合法性
        if agent not in ('credit', 'financing', 'investment', 'assets',
                         'ma', 'supply', 'risk', 'common'):
            return jsonify({
                'code': 'unknown_agent', 'message': f'未知智能体: {agent}',
            }), 404

        # 获取 prompt
        try:
            prompt_spec = prompt_registry.get_prompt(agent, function, context)
        except KeyError as e:
            return jsonify({
                'code': 'unknown_function',
                'message': f'该智能体下未找到功能: {function}',
            }), 404

        audit('ai_request', agent=agent, function=function,
              user_id=user_id, trace_id=trace_id)

        def gen():
            client = get_client()
            yield from client.chat_stream(
                prompt_spec['messages'],
                agent=agent, function=function,
                user_id=user_id, enterprise_id=enterprise_id,
                temperature=prompt_spec.get('temperature'),
                max_tokens=prompt_spec.get('max_tokens'),
                enable_thinking=prompt_spec.get('enable_thinking'),
                trace_id=trace_id,
            )

        return _stream_response(gen)

    except AIError as e:
        return jsonify({'code': e.code, 'message': e.user_message}), e.http_status
    except Exception as e:
        log('ERROR', f'agent_stream {agent}: {e}')
        return jsonify({'code': 'internal_error', 'message': '服务异常'}), 500


# ============== 全局 AI 助手 ==============
@app.post('/api/ai/assistant/stream')
def ai_assistant():
    """顶级 AI 助手：识别用户意图后路由到合适的智能体"""
    ip = _client_ip()
    if not _rate_ok(ip):
        return jsonify({
            'code': 'rate_limited', 'message': '请求过于频繁，请稍后再试',
        }), 429
    try:
        body = request.get_json(silent=True) or {}
        user_msg = body.get('message') or ''
        history = body.get('history') or []
        user_id = body.get('user_id') or 'anonymous'
        role = body.get('user_role') or 'user'
        trace_id = uuid.uuid4().hex[:16]

        # 通过 registry 获取 assistant prompt
        spec = prompt_registry.get_prompt(
            'common', 'assistant_chat',
            {'message': user_msg, 'history': history, 'user_role': role},
        )

        def gen():
            yield from get_client().chat_stream(
                spec['messages'],
                agent='common', function='assistant',
                user_id=user_id,
                temperature=spec.get('temperature'),
                enable_thinking=spec.get('enable_thinking'),
                trace_id=trace_id,
            )

        return _stream_response(gen)

    except AIError as e:
        return jsonify({'code': e.code, 'message': e.user_message}), e.http_status
    except Exception as e:
        log('ERROR', f'assistant: {e}')
        return jsonify({'code': 'internal_error', 'message': '服务异常'}), 500


# ============== 审计记录（演示用） ==============
@app.get('/api/audit/recent')
def audit_recent():
    """返回最近 N 条审计记录（脱敏；演示用途）"""
    n = int(request.args.get('n', '50'))
    from pathlib import Path
    from config import Config, BACKEND_DIR
    p = Path(Config.AUDIT_PATH)
    if not p.is_absolute():
        p = BACKEND_DIR / Config.AUDIT_PATH
    records = []
    if p.exists():
        with open(p, 'r', encoding='utf-8') as f:
            lines = f.readlines()[-n:]
            for line in lines:
                try:
                    records.append(json.loads(line))
                except Exception:
                    pass
    return jsonify({'records': records, 'count': len(records)})


# ============== 入口 ==============
if __name__ == '__main__':
    log('INFO', 'starting wm-ai-backend',
        host=Config.HOST, port=Config.PORT,
        model=Config.QWEN_MODEL,
        api_configured=Config.has_api_key(),
        mock_fallback=Config.ENABLE_MOCK_FALLBACK)

    app.run(
        host=Config.HOST, port=Config.PORT,
        debug=Config.DEBUG, threaded=True,
    )

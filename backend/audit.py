"""审计日志 + 应用日志
--------------------------------------------------------------
- 应用日志（app.log）：常规运行日志
- 审计日志（audit.log）：所有大模型调用记录（脱敏），供合规审计
"""
import json
import logging
import logging.handlers
import time
from pathlib import Path
from config import Config, BACKEND_DIR


def _ensure_path(p):
    path = Path(p)
    if not path.is_absolute():
        path = BACKEND_DIR / p
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


# ============== 应用日志 ==============
_app_logger = logging.getLogger('wm_app')
_app_logger.setLevel(getattr(logging, Config.LOG_LEVEL, logging.INFO))
_app_logger.propagate = False

if not _app_logger.handlers:
    _fmt = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s - %(message)s'
    )
    _fh = logging.handlers.RotatingFileHandler(
        _ensure_path(Config.APP_LOG_PATH),
        maxBytes=10 * 1024 * 1024, backupCount=5, encoding='utf-8'
    )
    _fh.setFormatter(_fmt)
    _app_logger.addHandler(_fh)

    _ch = logging.StreamHandler()
    _ch.setFormatter(_fmt)
    _app_logger.addHandler(_ch)


def log(level, msg, **kwargs):
    extra = ' '.join(f'{k}={v}' for k, v in kwargs.items()) if kwargs else ''
    _app_logger.log(getattr(logging, level, 20), f'{msg} {extra}')


# ============== 审计日志（合规） ==============
_AUDIT_PATH = _ensure_path(Config.AUDIT_PATH)


def audit(event_type, **fields):
    """审计日志：JSON Lines 格式，每行一条
    所有字段会写入；严禁写入原始 API Key。
    """
    if not Config.AUDIT_ENABLED:
        return
    try:
        record = {
            'ts': int(time.time() * 1000),
            'event': event_type,
            **fields,
        }
        # 截断过长字段
        for k, v in list(record.items()):
            if isinstance(v, str) and len(v) > 2000:
                record[k] = v[:2000] + '...(truncated)'
        with open(_AUDIT_PATH, 'a', encoding='utf-8') as f:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    except Exception as e:
        _app_logger.error(f'audit log failed: {e}')


def audit_ai_call(agent, function, user_id, enterprise_id, input_summary,
                  output_summary='', error=None, duration_ms=0, tokens=None,
                  trace_id=None, status='ok'):
    """AI 调用审计：合规要求完整记录"""
    audit(
        'ai_call',
        agent=agent,
        function=function,
        user_id=user_id or 'anonymous',
        enterprise_id=enterprise_id or None,
        input_preview=(input_summary or '')[:500],
        output_preview=(output_summary or '')[:500],
        error=str(error) if error else None,
        duration_ms=duration_ms,
        tokens=tokens,
        trace_id=trace_id,
        status=status,
        model=Config.QWEN_MODEL,
    )

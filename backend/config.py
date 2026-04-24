"""皖美信用 · 后端配置加载
--------------------------------------------------------------
从 .env 加载所有配置；不存在时使用安全默认值；
不会让 API Key 出现在日志。
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env（如果存在）
BACKEND_DIR = Path(__file__).parent
DOTENV_PATH = BACKEND_DIR / '.env'
if DOTENV_PATH.exists():
    load_dotenv(DOTENV_PATH)
else:
    # 降级：尝试加载 .env.example（仅用于演示）
    EXAMPLE = BACKEND_DIR / '.env.example'
    if EXAMPLE.exists():
        load_dotenv(EXAMPLE)


def _bool(v, default=False):
    if v is None:
        return default
    return str(v).strip().lower() in ('1', 'true', 'yes', 'on')


def _int(v, default):
    try:
        return int(v) if v is not None else default
    except Exception:
        return default


def _float(v, default):
    try:
        return float(v) if v is not None else default
    except Exception:
        return default


class Config:
    # ===== Qwen API =====
    QWEN_API_KEY = os.getenv('QWEN36_MAX_API_KEY', '')
    QWEN_MODEL = os.getenv('QWEN36_MAX_MODEL', 'qwen3-max-preview')
    QWEN_BASE_URL = os.getenv(
        'QWEN36_MAX_BASE_URL',
        'https://dashscope.aliyuncs.com/compatible-mode/v1',
    )
    QWEN_TIMEOUT = _int(os.getenv('QWEN_TIMEOUT_SECONDS'), 90)
    QWEN_MAX_RETRIES = _int(os.getenv('QWEN_MAX_RETRIES'), 2)
    QWEN_MAX_CONCURRENCY = _int(os.getenv('QWEN_MAX_CONCURRENCY'), 20)
    QWEN_STREAM_ENABLED = _bool(os.getenv('QWEN_STREAM_ENABLED'), True)
    QWEN_TEMPERATURE = _float(os.getenv('QWEN_TEMPERATURE'), 0.6)
    QWEN_MAX_TOKENS = _int(os.getenv('QWEN_MAX_TOKENS'), 4096)
    QWEN_ENABLE_THINKING = _bool(os.getenv('QWEN_ENABLE_THINKING'), True)
    QWEN_THINKING_BUDGET = _int(os.getenv('QWEN_THINKING_BUDGET'), 2048)

    # ===== 服务配置 =====
    HOST = os.getenv('BACKEND_HOST', '127.0.0.1')
    PORT = _int(os.getenv('BACKEND_PORT'), 8766)
    DEBUG = _bool(os.getenv('BACKEND_DEBUG'), False)
    CORS_ORIGINS = [
        o.strip() for o in os.getenv(
            'CORS_ALLOW_ORIGINS',
            'http://localhost:8765,http://127.0.0.1:8765'
        ).split(',') if o.strip()
    ]

    # ===== 日志 =====
    AUDIT_ENABLED = _bool(os.getenv('AUDIT_LOG_ENABLED'), True)
    AUDIT_PATH = os.getenv('AUDIT_LOG_PATH', './logs/audit.log')
    APP_LOG_PATH = os.getenv('APP_LOG_PATH', './logs/app.log')
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()

    # ===== 安全 =====
    RATE_LIMIT_PER_MIN = _int(os.getenv('RATE_LIMIT_PER_MIN'), 60)
    MAX_INPUT_LENGTH = _int(os.getenv('MAX_INPUT_LENGTH'), 8000)
    CONTENT_FILTER_ENABLED = _bool(os.getenv('CONTENT_FILTER_ENABLED'), True)

    # ===== 降级 =====
    ENABLE_MOCK_FALLBACK = _bool(os.getenv('ENABLE_MOCK_FALLBACK'), True)

    # ===== 敏感词过滤规则（国资合规红线） =====
    CONTENT_FORBID_KEYWORDS = [
        '政治敏感', '反党反国', '国家秘密',
        # 技术侧：防止 prompt injection
        'ignore previous', 'disregard the system', 'jailbreak',
    ]

    @classmethod
    def has_api_key(cls):
        return bool(cls.QWEN_API_KEY and not cls.QWEN_API_KEY.startswith('sk-YOUR'))

    @classmethod
    def mask_key(cls):
        """返回脱敏后的 API Key 用于日志"""
        k = cls.QWEN_API_KEY
        if not k:
            return '<not-configured>'
        if len(k) < 12:
            return '<invalid>'
        return k[:4] + '***' + k[-4:]

    @classmethod
    def as_dict_safe(cls):
        """导出配置（脱敏）"""
        return {
            'model': cls.QWEN_MODEL,
            'base_url': cls.QWEN_BASE_URL,
            'api_key_masked': cls.mask_key(),
            'api_key_configured': cls.has_api_key(),
            'timeout': cls.QWEN_TIMEOUT,
            'max_retries': cls.QWEN_MAX_RETRIES,
            'stream_enabled': cls.QWEN_STREAM_ENABLED,
            'thinking_enabled': cls.QWEN_ENABLE_THINKING,
            'mock_fallback': cls.ENABLE_MOCK_FALLBACK,
            'cors_origins': cls.CORS_ORIGINS,
        }


# 确保日志目录存在
for path in [Config.AUDIT_PATH, Config.APP_LOG_PATH]:
    p = Path(path)
    if not p.is_absolute():
        p = BACKEND_DIR / path
    p.parent.mkdir(parents=True, exist_ok=True)

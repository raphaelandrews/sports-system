"""
LLM integration with Groq (free tier) and mock fallback.
Uses Groq API when GROQ_API_KEY is set, otherwise returns template responses.
"""

import logging

import httpx
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

_API_URL = "https://api.groq.com/openai/v1/chat/completions"
_MODEL = "llama-3.3-70b-versatile"


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.TimeoutException | httpx.NetworkError):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500 or exc.response.status_code == 429
    return False


@retry(
    retry=retry_if_exception(_is_retryable),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
async def _call_api(system_prompt: str, user_prompt: str, max_tokens: int) -> str:
    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            _API_URL,
            headers={
                "authorization": f"Bearer {settings.GROQ_API_KEY}",
                "content-type": "application/json",
            },
            json={
                "model": _MODEL,
                "max_tokens": max_tokens,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        text: str = data["choices"][0]["message"]["content"]
        logger.info(
            "llm_success tokens_used=%s", data.get("usage", {}).get("total_tokens")
        )
        return text


async def generate_text(
    system_prompt: str, user_prompt: str, max_tokens: int = 1024
) -> str:
    if not settings.GROQ_API_KEY:
        logger.info("llm_mock system=%s", system_prompt[:60])
        return _mock_narrative(user_prompt)

    try:
        return await _call_api(system_prompt, user_prompt, max_tokens)
    except httpx.HTTPError as exc:
        logger.error("llm_error %s — falling back to mock", exc)
        return _mock_narrative(user_prompt)


def _mock_narrative(context: str) -> str:
    return (
        "**Narrativa do Dia** *(modo demonstração — configure GROQ_API_KEY para narrativas reais)*\n\n"
        "Mais um dia intenso de competições no evento. "
        "As delegações deixaram tudo em campo, com partidas emocionantes em várias modalidades. "
        "O quadro de medalhas segue em disputa acirrada, com várias delegações separadas por apenas uma medalha de ouro. "
        "Os atletas demonstraram alto nível técnico e superação ao longo do dia.\n\n"
        f"*Contexto recebido:* {context[:200]}..."
    )

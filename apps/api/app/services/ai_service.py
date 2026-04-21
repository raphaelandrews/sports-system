"""
LLM integration with mock fallback.
Uses Anthropic API when LLM_API_KEY is set, otherwise returns template responses.
"""
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_API_URL = "https://api.anthropic.com/v1/messages"
_MODEL = "claude-sonnet-4-6"


async def generate_text(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str:
    if not settings.LLM_API_KEY:
        logger.info("llm_mock system=%s", system_prompt[:60])
        return _mock_narrative(user_prompt)

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                _API_URL,
                headers={
                    "x-api-key": settings.LLM_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": _MODEL,
                    "max_tokens": max_tokens,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
            )
            response.raise_for_status()
            data = response.json()
            text: str = data["content"][0]["text"]
            logger.info("llm_success tokens_used=%s", data.get("usage", {}).get("output_tokens"))
            return text
    except httpx.HTTPError as exc:
        logger.error("llm_error %s — falling back to mock", exc)
        return _mock_narrative(user_prompt)


def _mock_narrative(context: str) -> str:
    return (
        "**Narrativa do Dia** *(modo demonstração — configure LLM_API_KEY para narrativas reais)*\n\n"
        "Mais um dia intenso de competições no evento. "
        "As delegações deixaram tudo em campo, com partidas emocionantes em várias modalidades. "
        "O quadro de medalhas segue em disputa acirrada, com várias delegações separadas por apenas uma medalha de ouro. "
        "Os atletas demonstraram alto nível técnico e superação ao longo do dia.\n\n"
        f"*Contexto recebido:* {context[:200]}..."
    )

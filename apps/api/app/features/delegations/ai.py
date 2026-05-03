from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.delegation import (
    Delegation,
    DelegationMember,
    DelegationMemberRole,
    DelegationStatus,
)
from app.domain.models.league_delegation import LeagueDelegation
from app.domain.models.user import User
from app.features.delegations import repository as delegation_repository
from app.features.delegations._helpers import (
    _MOCK_DELEGATIONS,
    generate_code,
    generate_unique_code,
)
from app.features.narratives import ai as ai_service


async def ai_generate(
    session: AsyncSession, league_id: int, count: int
) -> list[Delegation]:
    result = await session.execute(select(Delegation))
    existing_codes = {d.code for d in result.scalars().all()}

    used_codes = set(existing_codes)
    created: list[Delegation] = []
    pool = [item for item in _MOCK_DELEGATIONS if item[0] not in existing_codes]

    for i in range(min(count, len(pool))):
        code, name = pool[i]
        if code in used_codes:
            code = generate_unique_code(name, used_codes)
        used_codes.add(code)
        delegation = Delegation(league_id=league_id, code=code, name=name)
        await delegation_repository.create(session, delegation)
        assert delegation.id is not None
        session.add(LeagueDelegation(league_id=league_id, delegation_id=delegation.id))
        created.append(delegation)

    return created


async def ai_populate(
    session: AsyncSession, league_id: int, count: int
) -> list[Delegation]:
    result = await session.execute(
        select(Delegation)
        .join(LeagueDelegation, LeagueDelegation.delegation_id == Delegation.id)  # type: ignore[arg-type]
        .where(
            LeagueDelegation.league_id == league_id,  # type: ignore[arg-type]
            Delegation.is_active == True,  # type: ignore[arg-type]
        )
    )
    existing_delegations = result.scalars().all()
    existing_data = [(d.code, d.name) for d in existing_delegations]

    all_codes_result = await session.execute(select(Delegation))
    all_existing_codes = {d.code for d in all_codes_result.scalars().all()}

    if not existing_data:
        return await ai_generate(session, league_id, count)

    prompt = (
        f"A liga já tem estas delegações: {existing_data}. "
        f"Gere {count} novas delegações no formato JSON: "
        '[{"code": "ABC", "name": "Nome da Delegação"}, ...]. '
        "Use códigos de 3 letras maiúsculas e nomes criativos de países, estados ou cidades. "
        "Apenas o JSON, sem texto adicional."
    )

    raw = await ai_service.generate_text(
        "Você é um assistente que gera dados de delegações esportivas.",
        prompt,
        max_tokens=800,
    )

    import json
    import re

    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    if not match:
        return []

    try:
        items = json.loads(match.group())
    except json.JSONDecodeError:
        return []

    created: list[Delegation] = []
    used_codes = set(all_existing_codes)

    for item in items[:count]:
        code = item.get("code", "")
        name = item.get("name", "")
        if not code or not name:
            continue
        code = code.upper()[:4]
        if code in used_codes:
            code = generate_unique_code(name, used_codes)
        used_codes.add(code)
        delegation = Delegation(code=code, name=name)
        await delegation_repository.create(session, delegation)
        assert delegation.id is not None
        session.add(LeagueDelegation(league_id=league_id, delegation_id=delegation.id))
        created.append(delegation)

    return created


async def ai_generate_independent(
    session: AsyncSession,
    prompt: str,
    count: int,
    creator: User,
) -> list[Delegation]:
    result = await session.execute(select(Delegation))
    existing_codes = {d.code for d in result.scalars().all()}
    used_codes = set(existing_codes)

    system_prompt = (
        "Você é um assistente que gera dados de delegações esportivas. "
        "Responda APENAS com um array JSON no formato: "
        '[{"code": "ABC", "name": "Nome da Delegação"}, ...]'
    )

    user_prompt = (
        f"{prompt}. Gere exatamente {count} delegações. "
        f"Use códigos únicos de 3 letras maiúsculas. "
        f"Códigos já usados (não repita): {sorted(existing_codes)[:20]}. "
        "Apenas o JSON, sem texto adicional."
    )

    raw = await ai_service.generate_text(
        system_prompt,
        user_prompt,
        max_tokens=1200,
    )

    import json
    import re

    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="AI did not return valid JSON",
        )

    try:
        items = json.loads(match.group())
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="AI returned malformed JSON",
        )

    created: list[Delegation] = []

    for item in items[:count]:
        code = item.get("code", "")
        name = item.get("name", "")
        if not code or not name:
            continue
        code = code.upper()[:4]
        if code in used_codes:
            code = generate_unique_code(name, used_codes)
        used_codes.add(code)
        delegation = Delegation(
            code=code,
            name=name,
            chief_id=creator.id,
            status=DelegationStatus.INDEPENDENT,
        )
        await delegation_repository.create(session, delegation)
        assert delegation.id is not None
        if creator.id is not None:
            session.add(
                DelegationMember(
                    delegation_id=delegation.id,
                    user_id=creator.id,
                    role=DelegationMemberRole.CHIEF,
                )
            )
        created.append(delegation)

    return created

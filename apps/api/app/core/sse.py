import asyncio
import json
from collections import defaultdict

_queues: dict[int, list[asyncio.Queue[str]]] = defaultdict(list)
_medal_board_queues: list[asyncio.Queue[str]] = []


def subscribe(match_id: int) -> asyncio.Queue[str]:
    q: asyncio.Queue[str] = asyncio.Queue()
    _queues[match_id].append(q)
    return q


def unsubscribe(match_id: int, q: asyncio.Queue[str]) -> None:
    try:
        _queues[match_id].remove(q)
    except ValueError:
        pass
    if match_id in _queues and not _queues[match_id]:
        del _queues[match_id]


async def broadcast(match_id: int, payload: dict) -> None:
    data = json.dumps(payload)
    for q in list(_queues.get(match_id, [])):
        await q.put(data)


def subscribe_medal_board() -> asyncio.Queue[str]:
    q: asyncio.Queue[str] = asyncio.Queue()
    _medal_board_queues.append(q)
    return q


def unsubscribe_medal_board(q: asyncio.Queue[str]) -> None:
    try:
        _medal_board_queues.remove(q)
    except ValueError:
        pass


async def broadcast_medal_board(payload: dict) -> None:
    data = json.dumps(payload)
    for q in list(_medal_board_queues):
        await q.put(data)

import asyncio
import json
from collections import defaultdict

_queues: dict[int, list[asyncio.Queue[str]]] = defaultdict(list)
_medal_board_queues: dict[int, list[asyncio.Queue[str]]] = defaultdict(list)
_activity_feed_queues: dict[int, list[asyncio.Queue[str]]] = defaultdict(list)
_global_activity_feed_queues: list[asyncio.Queue[str]] = []


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


def subscribe_medal_board(league_id: int) -> asyncio.Queue[str]:
    q: asyncio.Queue[str] = asyncio.Queue()
    _medal_board_queues[league_id].append(q)
    return q


def unsubscribe_medal_board(league_id: int, q: asyncio.Queue[str]) -> None:
    try:
        _medal_board_queues[league_id].remove(q)
    except (ValueError, KeyError):
        pass
    if league_id in _medal_board_queues and not _medal_board_queues[league_id]:
        del _medal_board_queues[league_id]


async def broadcast_medal_board(league_id: int, payload: dict) -> None:
    data = json.dumps(payload)
    for q in list(_medal_board_queues.get(league_id, [])):
        await q.put(data)


def subscribe_activity_feed(league_id: int) -> asyncio.Queue[str]:
    q: asyncio.Queue[str] = asyncio.Queue()
    _activity_feed_queues[league_id].append(q)
    return q


def unsubscribe_activity_feed(league_id: int, q: asyncio.Queue[str]) -> None:
    try:
        _activity_feed_queues[league_id].remove(q)
    except (ValueError, KeyError):
        pass
    if league_id in _activity_feed_queues and not _activity_feed_queues[league_id]:
        del _activity_feed_queues[league_id]


async def broadcast_activity_feed(league_id: int, payload: dict) -> None:
    data = json.dumps(payload)
    for q in list(_activity_feed_queues.get(league_id, [])):
        await q.put(data)


def subscribe_global_activity_feed() -> asyncio.Queue[str]:
    q: asyncio.Queue[str] = asyncio.Queue()
    _global_activity_feed_queues.append(q)
    return q


def unsubscribe_global_activity_feed(q: asyncio.Queue[str]) -> None:
    try:
        _global_activity_feed_queues.remove(q)
    except ValueError:
        pass


async def broadcast_global_activity_feed(payload: dict) -> None:
    data = json.dumps(payload)
    for q in list(_global_activity_feed_queues):
        await q.put(data)

import secrets
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

_MOCK_DELEGATIONS = [
    ("MEX", "México"),
    ("USA", "Estados Unidos"),
    ("FRA", "França"),
    ("ITA", "Itália"),
    ("GER", "Alemanha"),
    ("JPN", "Japão"),
    ("CHN", "China"),
    ("AUS", "Austrália"),
    ("NED", "Holanda"),
    ("GBR", "Reino Unido"),
    ("RUS", "Rússia"),
    ("CAN", "Canadá"),
    ("KOR", "Coreia do Sul"),
    ("CUB", "Cuba"),
    ("KEN", "Quênia"),
]


def is_transfer_window_open(timezone_name: str) -> bool:
    return datetime.now(ZoneInfo(timezone_name)).weekday() == 0


def next_transfer_window_iso(timezone_name: str) -> str:
    now = datetime.now(ZoneInfo(timezone_name))
    days_ahead = (7 - now.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    next_monday = (now + timedelta(days=days_ahead)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return next_monday.isoformat()


def generate_code(name: str) -> str:
    base = "".join(c for c in name.upper() if c.isalpha())[:4] or "DEL"
    return base + secrets.token_hex(2).upper()


def generate_unique_code(name: str, used_codes: set[str]) -> str:
    code = generate_code(name)
    while code in used_codes:
        code = generate_code(name)
    return code

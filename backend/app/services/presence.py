from datetime import datetime, timezone
from threading import Lock
from typing import Dict, Iterable, List, Optional


ONLINE_WINDOW_SECONDS = 75

_presence_lock = Lock()
_user_last_seen: Dict[int, datetime] = {}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def mark_user_online(user_id: int, seen_at: Optional[datetime] = None) -> None:
    timestamp = seen_at or _utc_now()
    with _presence_lock:
        _user_last_seen[user_id] = timestamp


def get_presence_for_users(
    user_ids: Iterable[int],
    online_window_seconds: int = ONLINE_WINDOW_SECONDS,
) -> List[dict]:
    now = _utc_now()
    unique_user_ids = sorted(set(user_ids))
    result: List[dict] = []

    with _presence_lock:
        for user_id in unique_user_ids:
            last_seen = _user_last_seen.get(user_id)
            is_online = False
            if last_seen is not None:
                elapsed = (now - last_seen).total_seconds()
                is_online = elapsed <= online_window_seconds

            result.append(
                {
                    "user_id": user_id,
                    "is_online": is_online,
                    "last_seen": last_seen,
                }
            )

    return result

"""Lightweight thread-safe sliding-window rate limiter for sensitive ExBOS endpoints."""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Tuple

_LOCK = threading.Lock()
_BUCKETS: dict[str, deque[float]] = defaultdict(deque)


def check_rate_limit(key: str, limit: int, window_seconds: int) -> Tuple[bool, int]:
    """
    Record an attempt for `key` and return `(allowed, retry_after_seconds)`.
    """
    now = time.monotonic()
    cutoff = now - float(window_seconds)
    with _LOCK:
        dq = _BUCKETS[key]
        while dq and dq[0] <= cutoff:
            dq.popleft()
        if len(dq) >= limit:
            retry_after = max(1, int(window_seconds - (now - dq[0])))
            return False, retry_after
        dq.append(now)
        # Opportunistic cleanup to keep memory bounded
        if len(_BUCKETS) > 10000:
            stale_keys = [k for k, v in _BUCKETS.items() if not v or v[-1] <= cutoff]
            for k in stale_keys[:2000]:
                _BUCKETS.pop(k, None)
        return True, 0


def reset_rate_limits() -> None:
    """Clear all buckets (used in automated tests)."""
    with _LOCK:
        _BUCKETS.clear()

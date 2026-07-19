"""Launch the 24d125 Epidemic Spread Simulator from the repo root."""

from __future__ import annotations

import sys
from pathlib import Path


EXERCISE_DIR = Path(__file__).resolve().parent / "24d125"
if str(EXERCISE_DIR) not in sys.path:
    sys.path.insert(0, str(EXERCISE_DIR))

from app import build_app  # noqa: E402


if __name__ == "__main__":
    build_app().launch()
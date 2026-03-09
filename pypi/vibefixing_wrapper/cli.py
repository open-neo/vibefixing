"""Thin Python wrapper that delegates to the bundled Node.js CLI."""

import os
import shutil
import subprocess
import sys
from pathlib import Path

_BUNDLED_DIR = Path(__file__).resolve().parent / "_bundled"
_ENTRY_POINT = _BUNDLED_DIR / "dist" / "bin" / "vibefixing.js"

_MIN_NODE_MAJOR = 18


def _find_node() -> str | None:
    """Search PATH for node or nodejs."""
    for name in ("node", "nodejs"):
        path = shutil.which(name)
        if path:
            return path
    return None


def _check_node_version(node: str) -> None:
    """Ensure the Node.js runtime is >= 18."""
    try:
        raw = subprocess.check_output(
            [node, "--version"], text=True, stderr=subprocess.DEVNULL
        ).strip()
        # e.g. "v20.11.0"
        major = int(raw.lstrip("v").split(".")[0])
        if major < _MIN_NODE_MAJOR:
            print(
                f"Error: Node.js >= {_MIN_NODE_MAJOR} is required (found {raw})",
                file=sys.stderr,
            )
            sys.exit(1)
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError):
        print(
            "Error: could not determine Node.js version.",
            file=sys.stderr,
        )
        sys.exit(1)


def main() -> None:
    node = _find_node()
    if node is None:
        print(
            "Error: Node.js is required but not found. "
            f"Install Node.js >= {_MIN_NODE_MAJOR} and ensure it is on your PATH.",
            file=sys.stderr,
        )
        sys.exit(1)

    _check_node_version(node)

    if not _ENTRY_POINT.exists():
        print(
            f"Error: bundled CLI not found at {_ENTRY_POINT}",
            file=sys.stderr,
        )
        sys.exit(1)

    env = {**os.environ, "VIBEFIXING_INSTALLED_VIA": "pip"}
    result = subprocess.run(
        [node, str(_ENTRY_POINT), *sys.argv[1:]],
        env=env,
    )
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Sync version from package.json into pyproject.toml and __init__.py."""

import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON = REPO_ROOT / "package.json"
PYPROJECT_TOML = Path(__file__).resolve().parent / "pyproject.toml"
INIT_PY = Path(__file__).resolve().parent / "vibefixing_wrapper" / "__init__.py"


def main() -> None:
    version = json.loads(PACKAGE_JSON.read_text())["version"]
    print(f"Syncing version: {version}")

    # Update pyproject.toml
    content = PYPROJECT_TOML.read_text()
    content = re.sub(
        r'^version\s*=\s*".*?"',
        f'version = "{version}"',
        content,
        count=1,
        flags=re.MULTILINE,
    )
    PYPROJECT_TOML.write_text(content)
    print(f"  Updated {PYPROJECT_TOML}")

    # Update __init__.py
    content = INIT_PY.read_text()
    content = re.sub(
        r'^__version__\s*=\s*".*?"',
        f'__version__ = "{version}"',
        content,
        count=1,
        flags=re.MULTILINE,
    )
    INIT_PY.write_text(content)
    print(f"  Updated {INIT_PY}")


if __name__ == "__main__":
    main()

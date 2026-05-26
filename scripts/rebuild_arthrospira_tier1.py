#!/usr/bin/env python3
"""
Sync data/tier1/arthrospira_platensis.json from the canonical raw export.

Source of truth:
  data/raw/arthrospira_platensis_75countries.json

The Phase 1b commit (58e216f) accidentally committed batch audit metadata
instead of this file. Use this script after editing the raw export, then run:

  python3 scripts/validate_tiers.py --tier1-only
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/raw/arthrospira_platensis_75countries.json"
OUT = ROOT / "data/tier1/arthrospira_platensis.json"
VALIDATOR = ROOT / "scripts/validate_tiers.py"


def main() -> None:
    if not SOURCE.exists():
        print(f"ERROR: missing source export: {SOURCE}", file=sys.stderr)
        sys.exit(1)

    data = json.loads(SOURCE.read_text())
    if data.get("plant_id") != "arthrospira_platensis" or data.get("tier") != 1:
        print("ERROR: source file is not a Tier 1 arthrospira_platensis export", file=sys.stderr)
        sys.exit(1)

    shutil.copy2(SOURCE, OUT)
    countries = len(data.get("supported_countries", []))
    entries = sum(len(v) for v in data.get("names", {}).values())
    print(f"Synced {SOURCE.name} → {OUT.relative_to(ROOT)}")
    print(f"  countries: {countries}")
    print(f"  entries:   {entries}")

    if VALIDATOR.exists():
        result = subprocess.run(
            [sys.executable, str(VALIDATOR), "--tier1-only"],
            cwd=ROOT,
        )
        sys.exit(result.returncode)


if __name__ == "__main__":
    main()

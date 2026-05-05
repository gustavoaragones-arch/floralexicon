#!/usr/bin/env python3
"""
FloraLexicon tier file validator.

Validates tier1/, tier2/, tier3/ files against:
  1. Their respective JSON schemas (structural)
  2. Cross-file referential integrity (plant_ids, country codes, region_ids)
  3. Tier-uniqueness (no plant appears in multiple tiers)
  4. Within-file consistency (supported_countries == names keys, etc.)
  5. Per-entry rules (language match, transliteration presence/absence)
  6. Phase 1a canary regression cases

Usage:
  python validate_tiers.py                  # validate everything
  python validate_tiers.py --tier1-only     # only Tier 1 files
  python validate_tiers.py --no-canary      # skip canary regression
  python validate_tiers.py --strict         # treat warnings as errors

Exit codes:
  0 — all checks passed
  1 — one or more validation errors
  2 — script error (file not found, parse failure, etc.)

Expected directory layout (relative to cwd):
  data/canonical/plants.json
  data/canonical/countries.json
  data/canonical/regions.json
  data/schemas/tier1.schema.json
  data/schemas/tier2.schema.json
  data/schemas/tier3.schema.json
  data/tier1/<plant_id>.json
  data/tier2/<region_id>.json
  data/tier3/<country_iso_lower>/<group_label>.json
"""

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

try:
    from jsonschema import Draft202012Validator
except ImportError:
    print("ERROR: jsonschema package required. Run: pip install jsonschema", file=sys.stderr)
    sys.exit(2)


# Phase 1a canary regression cases. Any change to these must trip the validator.
CANARY_CASES = [
    ("matricaria_chamomilla", "CL", "Manzanilla"),
    ("matricaria_chamomilla", "PE", "Manzanilla"),
    ("matricaria_chamomilla", "AR", "Manzanilla"),
    ("matricaria_chamomilla", "FR", "Camomille"),
    ("matricaria_chamomilla", "US", "Chamomile"),
    ("matricaria_chamomilla", "DE", "Kamille"),
]


class ValidationReport:
    def __init__(self):
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.checks_run = 0

    def err(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)

    def check(self) -> None:
        self.checks_run += 1

    def summary(self, strict: bool = False) -> int:
        print()
        print(f"Checks run: {self.checks_run}")
        print(f"Errors:     {len(self.errors)}")
        print(f"Warnings:   {len(self.warnings)}")
        if self.errors:
            print("\nERRORS:")
            for e in self.errors:
                print(f"  ✗ {e}")
        if self.warnings:
            print("\nWARNINGS:")
            for w in self.warnings:
                print(f"  ! {w}")
        if not self.errors and not self.warnings:
            print("\n✓ All checks passed.")
        elif not self.errors:
            print("\n✓ No errors. (Warnings present.)")
        if self.errors:
            return 1
        if strict and self.warnings:
            return 1
        return 0


def load_json(path: Path) -> Any:
    try:
        with path.open() as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ERROR: required file missing: {path}", file=sys.stderr)
        sys.exit(2)
    except json.JSONDecodeError as e:
        print(f"ERROR: {path} is not valid JSON: {e}", file=sys.stderr)
        sys.exit(2)


def is_latin_script(s: str) -> bool:
    """True if every alphabetic character in s is in a Latin Unicode block."""
    for ch in s:
        if not ch.isalpha():
            continue
        try:
            name = unicodedata.name(ch)
        except ValueError:
            return False
        if "LATIN" not in name:
            return False
    return True


def language_matches(entry_lang: str, expected: list[str]) -> bool:
    """
    BCP 47 base/region match. A name with `language: "es"` matches any country
    whose expected_languages includes any es* tag. A name with `language: "es-MX"`
    matches expected_languages containing "es-MX" or "es".
    """
    if entry_lang in expected:
        return True
    base = entry_lang.split("-")[0]
    for exp in expected:
        if exp == base or exp.split("-")[0] == base:
            return True
    return False


def validate_name_entry(
    entry: dict[str, Any],
    country: str,
    expected_languages: list[str],
    location: str,
    report: ValidationReport,
) -> None:
    """Validate per-entry rules (language match, transliteration, source)."""
    report.check()

    name = entry.get("name", "")
    language = entry.get("language", "")
    has_translit = "transliteration" in entry
    has_scheme = "transliteration_scheme" in entry

    # Rule: language must match country's expected languages
    if not language_matches(language, expected_languages):
        report.err(
            f"{location}: language '{language}' not in country {country}'s "
            f"expected_languages {expected_languages}"
        )

    # Rule: transliteration required iff name contains non-Latin script
    name_is_latin = is_latin_script(name)
    if name_is_latin and has_translit:
        report.err(
            f"{location}: 'transliteration' present but name '{name}' is "
            f"already Latin script; transliteration must be omitted"
        )
    if not name_is_latin and not has_translit:
        report.err(
            f"{location}: name '{name}' contains non-Latin script; "
            f"'transliteration' is required"
        )

    # Rule: transliteration_scheme required iff transliteration present
    if has_translit and not has_scheme:
        report.err(
            f"{location}: 'transliteration' present but "
            f"'transliteration_scheme' missing"
        )
    if has_scheme and not has_translit:
        report.err(
            f"{location}: 'transliteration_scheme' present but "
            f"'transliteration' missing"
        )

    # Soft check: confidence high should usually have a citation
    if entry.get("confidence") == "high" and not entry.get("citation"):
        if entry.get("source") in ("pharmacopoeia", "pharmacopoeia_traditional", "regulatory", "ethnobotany"):
            report.warn(
                f"{location}: confidence='high' with source='{entry.get('source')}' "
                f"but no citation — citation strongly recommended"
            )


def validate_tier1(
    file_path: Path,
    schema: dict,
    plants: dict,
    countries: dict,
    plant_to_tier: dict[str, str],
    report: ValidationReport,
) -> None:
    """Validate a single Tier 1 plant file."""
    data = load_json(file_path)

    # Strip stress-test instrumentation if present (allowed during pilot only)
    data.pop("_stress_test_notes", None)
    if "names" in data:
        for country_entries in data.get("names", {}).values():
            if isinstance(country_entries, list):
                for entry in country_entries:
                    if isinstance(entry, dict):
                        entry.pop("_note", None)

    # Schema validation
    report.check()
    errs = list(Draft202012Validator(schema).iter_errors(data))
    for e in errs:
        report.err(f"{file_path}: schema violation: {'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}")
    if errs:
        return  # don't run further checks on structurally-invalid file

    plant_id = data["plant_id"]

    # Cross-file: plant_id exists in canonical
    report.check()
    if plant_id not in plants:
        report.err(f"{file_path}: plant_id '{plant_id}' not in canonical/plants.json")
        return

    # Tier uniqueness: register this plant as Tier 1
    report.check()
    if plant_id in plant_to_tier:
        report.err(
            f"{file_path}: plant_id '{plant_id}' also appears in "
            f"{plant_to_tier[plant_id]} — a plant must belong to exactly one tier"
        )
    else:
        plant_to_tier[plant_id] = "tier1"

    # Within-file: supported_countries set == names keys set
    report.check()
    declared = set(data["supported_countries"])
    keyed = set(data["names"].keys())
    if declared != keyed:
        only_declared = declared - keyed
        only_keyed = keyed - declared
        if only_declared:
            report.err(
                f"{file_path}: countries in supported_countries but missing "
                f"from names: {sorted(only_declared)}"
            )
        if only_keyed:
            report.err(
                f"{file_path}: countries in names but not in "
                f"supported_countries: {sorted(only_keyed)}"
            )

    # Cross-file: every country exists in canonical
    for country in declared | keyed:
        report.check()
        if country not in countries:
            report.err(f"{file_path}: country '{country}' not in canonical/countries.json")

    # Per-entry validation
    for country, entries in data["names"].items():
        if country not in countries:
            continue
        expected_langs = countries[country]["expected_languages"]
        for i, entry in enumerate(entries):
            location = f"{file_path}:{country}[{i}]"
            validate_name_entry(entry, country, expected_langs, location, report)


def validate_tier2(
    file_path: Path,
    schema: dict,
    plants: dict,
    countries: dict,
    regions: dict,
    plant_to_tier: dict[str, str],
    report: ValidationReport,
) -> None:
    """Validate a Tier 2 region file."""
    data = load_json(file_path)

    report.check()
    errs = list(Draft202012Validator(schema).iter_errors(data))
    for e in errs:
        report.err(f"{file_path}: schema violation: {'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}")
    if errs:
        return

    region_id = data["region_id"]

    report.check()
    if region_id not in regions:
        report.err(f"{file_path}: region_id '{region_id}' not in canonical/regions.json")
        return

    region_countries = set(regions[region_id]["countries"])
    declared_countries = set(data["countries"])

    report.check()
    if declared_countries != region_countries:
        report.err(
            f"{file_path}: declared countries {sorted(declared_countries)} "
            f"do not match region's canonical roster {sorted(region_countries)}"
        )

    # Each plant must have entries for every country in the region
    for plant_id, block in data["plants"].items():
        report.check()
        if plant_id not in plants:
            report.err(f"{file_path}: plant_id '{plant_id}' not in canonical/plants.json")
            continue

        report.check()
        if plant_id in plant_to_tier:
            report.err(
                f"{file_path}: plant_id '{plant_id}' also appears in "
                f"{plant_to_tier[plant_id]}"
            )
        else:
            plant_to_tier[plant_id] = f"tier2/{region_id}"

        block_countries = set(block["names"].keys())
        report.check()
        if block_countries != declared_countries:
            missing = declared_countries - block_countries
            extra = block_countries - declared_countries
            if missing:
                report.err(
                    f"{file_path}: plant '{plant_id}' missing names for "
                    f"countries: {sorted(missing)}"
                )
            if extra:
                report.err(
                    f"{file_path}: plant '{plant_id}' has names for countries "
                    f"not in region roster: {sorted(extra)}"
                )

        # Per-entry checks
        for country, entries in block["names"].items():
            if country not in countries:
                continue
            expected_langs = countries[country]["expected_languages"]
            for i, entry in enumerate(entries):
                location = f"{file_path}:{plant_id}/{country}[{i}]"
                validate_name_entry(entry, country, expected_langs, location, report)


def validate_tier3(
    file_path: Path,
    schema: dict,
    plants: dict,
    countries: dict,
    plant_to_tier: dict[str, str],
    report: ValidationReport,
) -> None:
    """Validate a Tier 3 country-specific file."""
    data = load_json(file_path)

    report.check()
    errs = list(Draft202012Validator(schema).iter_errors(data))
    for e in errs:
        report.err(f"{file_path}: schema violation: {'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}")
    if errs:
        return

    country = data["country"]

    report.check()
    if country not in countries:
        report.err(f"{file_path}: country '{country}' not in canonical/countries.json")
        return

    expected_langs = countries[country]["expected_languages"]

    for plant_id, block in data["plants"].items():
        report.check()
        if plant_id not in plants:
            report.err(f"{file_path}: plant_id '{plant_id}' not in canonical/plants.json")
            continue

        # Tier 3 allows the same plant in multiple country files; key is per-country
        tier3_key = f"tier3/{country}/{plant_id}"
        report.check()
        if plant_id in plant_to_tier:
            existing = plant_to_tier[plant_id]
            # Allow if existing is also tier3 (different country)
            if not existing.startswith("tier3/"):
                report.err(
                    f"{file_path}: plant_id '{plant_id}' is in {existing}; "
                    f"a Tier 1/2 plant may not also be in Tier 3"
                )
            # Multiple tier3 entries are fine — separate countries
        plant_to_tier[plant_id] = tier3_key

        for i, entry in enumerate(block["names"]):
            location = f"{file_path}:{plant_id}[{i}]"
            validate_name_entry(entry, country, expected_langs, location, report)


def run_canary_regression(
    tier1_dir: Path,
    report: ValidationReport,
) -> None:
    """Phase 1a canary cases: pinned (plant, country, primary_name) tuples."""
    print("\n--- Phase 1a canary regression ---")
    for plant_id, country, expected_name in CANARY_CASES:
        report.check()
        file_path = tier1_dir / f"{plant_id}.json"
        if not file_path.exists():
            report.err(f"Canary: tier1 file missing for '{plant_id}'")
            continue
        data = load_json(file_path)
        if country not in data.get("names", {}):
            report.err(
                f"Canary: ({plant_id}, {country}) — country missing from names"
            )
            continue
        primary = data["names"][country][0]["name"]
        if primary != expected_name:
            report.err(
                f"Canary: ({plant_id}, {country}) primary='{primary}', "
                f"expected '{expected_name}'"
            )
        else:
            print(f"  ✓ ({plant_id}, {country}) → '{primary}'")


def main() -> int:
    parser = argparse.ArgumentParser(description="FloraLexicon tier file validator")
    parser.add_argument("--tier1-only", action="store_true")
    parser.add_argument("--tier2-only", action="store_true")
    parser.add_argument("--tier3-only", action="store_true")
    parser.add_argument("--no-canary", action="store_true")
    parser.add_argument("--strict", action="store_true",
                        help="treat warnings as errors (exit 1)")
    parser.add_argument("--root", default=".",
                        help="project root (default: cwd)")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    canonical = root / "data" / "canonical"
    schemas_dir = root / "data" / "schemas"
    tier1_dir = root / "data" / "tier1"
    tier2_dir = root / "data" / "tier2"
    tier3_dir = root / "data" / "tier3"

    plants = {p["plant_id"]: p for p in load_json(canonical / "plants.json")["plants"]}
    countries = load_json(canonical / "countries.json")["countries"]
    regions = load_json(canonical / "regions.json")["regions"]

    tier1_schema = load_json(schemas_dir / "tier1.schema.json")
    tier2_schema = load_json(schemas_dir / "tier2.schema.json")
    tier3_schema = load_json(schemas_dir / "tier3.schema.json")

    report = ValidationReport()
    plant_to_tier: dict[str, str] = {}

    do_t1 = not (args.tier2_only or args.tier3_only)
    do_t2 = not (args.tier1_only or args.tier3_only)
    do_t3 = not (args.tier1_only or args.tier2_only)

    if do_t1 and tier1_dir.exists():
        print(f"--- Validating Tier 1 ({tier1_dir}) ---")
        for f in sorted(tier1_dir.glob("*.json")):
            validate_tier1(f, tier1_schema, plants, countries, plant_to_tier, report)

    if do_t2 and tier2_dir.exists():
        print(f"--- Validating Tier 2 ({tier2_dir}) ---")
        for f in sorted(tier2_dir.glob("*.json")):
            validate_tier2(f, tier2_schema, plants, countries, regions, plant_to_tier, report)

    if do_t3 and tier3_dir.exists():
        print(f"--- Validating Tier 3 ({tier3_dir}) ---")
        for f in sorted(tier3_dir.rglob("*.json")):
            validate_tier3(f, tier3_schema, plants, countries, plant_to_tier, report)

    if not args.no_canary and do_t1 and tier1_dir.exists():
        run_canary_regression(tier1_dir, report)

    return report.summary(strict=args.strict)


if __name__ == "__main__":
    sys.exit(main())

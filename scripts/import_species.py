#!/usr/bin/env python3
"""Import GuideMyTank species data from JSON into Supabase."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REQUIRED_SPECIES_FIELDS = ("slug", "common_name", "category")
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

SPECIES_FIELDS = {
    "slug",
    "common_name",
    "scientific_name",
    "category",
    "family",
    "origin_region",
    "temperament",
    "care_level",
    "diet",
    "short_description",
    "min_tank_gallons",
    "max_size_inches",
    "min_temp_f",
    "max_temp_f",
    "min_ph",
    "max_ph",
    "schooling",
    "minimum_group_size",
    "reef_safe",
}

WATER_PARAMETER_FIELDS = {
    "min_temp_f",
    "max_temp_f",
    "min_ph",
    "max_ph",
}

STOCKING_PROFILE_FIELDS = {
    "min_tank_gallons",
    "max_size_inches",
    "schooling",
    "minimum_group_size",
    "activity_level",
    "lifespan_years_min",
    "lifespan_years_max",
}

TEXT_FIELDS = {
    "slug",
    "common_name",
    "scientific_name",
    "category",
    "family",
    "origin_region",
    "temperament",
    "care_level",
    "diet",
    "short_description",
    "activity_level",
}

NUMBER_FIELDS = {
    "min_tank_gallons",
    "max_size_inches",
    "min_temp_f",
    "max_temp_f",
    "min_ph",
    "max_ph",
    "minimum_group_size",
    "lifespan_years_min",
    "lifespan_years_max",
}

BOOLEAN_FIELDS = {
    "schooling",
    "reef_safe",
}


@dataclass
class ImportStats:
    inserted: int = 0
    updated: int = 0
    skipped_existing: int = 0
    aliases_replaced: int = 0
    water_parameters_upserted: int = 0
    stocking_profiles_upserted: int = 0


class ImportErrorWithContext(Exception):
    """Raised for import validation or Supabase API errors."""


def load_species_file(path: Path) -> list[dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ImportErrorWithContext(f"Import file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ImportErrorWithContext(
            f"Invalid JSON in {path}: line {exc.lineno}, column {exc.colno}"
        ) from exc

    species = payload.get("species") if isinstance(payload, dict) else payload

    if not isinstance(species, list):
        raise ImportErrorWithContext(
            "Import file must contain a top-level species array or be an array."
        )

    for index, item in enumerate(species, start=1):
        if not isinstance(item, dict):
            raise ImportErrorWithContext(f"Species item #{index} must be an object.")

    return species


def validate_species(species: list[dict[str, Any]]) -> None:
    seen_slugs: set[str] = set()
    errors: list[str] = []

    for index, item in enumerate(species, start=1):
        label = item.get("slug") or f"item #{index}"

        for field in REQUIRED_SPECIES_FIELDS:
            if not item.get(field):
                errors.append(f"{label}: missing required field '{field}'.")

        slug = item.get("slug")
        if isinstance(slug, str):
            if not SLUG_PATTERN.match(slug):
                errors.append(
                    f"{label}: slug must use lowercase letters, numbers, and hyphens."
                )
            if slug in seen_slugs:
                errors.append(f"{label}: duplicate slug in import file.")
            seen_slugs.add(slug)

        validate_field_types(item, SPECIES_FIELDS, label, errors)
        validate_nested_object(item, "water_parameters", WATER_PARAMETER_FIELDS, errors)
        validate_nested_object(item, "stocking_profile", STOCKING_PROFILE_FIELDS, errors)
        validate_aliases(item, label, errors)

    if errors:
        raise ImportErrorWithContext(
            "Import validation failed:\n" + "\n".join(f"- {error}" for error in errors)
        )


def validate_nested_object(
    item: dict[str, Any],
    key: str,
    allowed_fields: set[str],
    errors: list[str],
) -> None:
    if key not in item or item[key] is None:
        return

    label = item.get("slug") or "unknown species"
    nested = item[key]
    if not isinstance(nested, dict):
        errors.append(f"{label}: '{key}' must be an object.")
        return

    validate_field_types(nested, allowed_fields, f"{label}.{key}", errors)


def validate_field_types(
    item: dict[str, Any],
    allowed_fields: set[str],
    label: str,
    errors: list[str],
) -> None:
    for field, value in item.items():
        if field in {"aliases", "water_parameters", "stocking_profile"}:
            continue
        if field not in allowed_fields:
            errors.append(f"{label}: unknown field '{field}'.")
            continue
        if value is None:
            continue
        if field in TEXT_FIELDS and not isinstance(value, str):
            errors.append(f"{label}: '{field}' must be a string or null.")
        if field in NUMBER_FIELDS and not is_number(value):
            errors.append(f"{label}: '{field}' must be a number or null.")
        if field in BOOLEAN_FIELDS and not isinstance(value, bool):
            errors.append(f"{label}: '{field}' must be a boolean or null.")


def validate_aliases(item: dict[str, Any], label: str, errors: list[str]) -> None:
    aliases = item.get("aliases")
    if aliases is None:
        return
    if not isinstance(aliases, list):
        errors.append(f"{label}: 'aliases' must be an array of strings.")
        return
    for alias in aliases:
        if not isinstance(alias, str) or not alias.strip():
            errors.append(f"{label}: aliases must be non-empty strings.")


def is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def pick_fields(item: dict[str, Any], allowed_fields: set[str]) -> dict[str, Any]:
    return {field: item[field] for field in allowed_fields if field in item}


def get_supabase_config() -> tuple[str, str]:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )

    if not url or not key:
        raise ImportErrorWithContext(
            "Missing Supabase credentials. Set SUPABASE_URL or "
            "NEXT_PUBLIC_SUPABASE_URL, plus SUPABASE_SERVICE_ROLE_KEY."
        )

    return url.rstrip("/"), key


class SupabaseRestClient:
    def __init__(self, base_url: str, api_key: str) -> None:
        self.rest_url = f"{base_url}/rest/v1"
        self.api_key = api_key

    def request(
        self,
        method: str,
        table: str,
        query: str = "",
        payload: Any | None = None,
        prefer: str | None = None,
    ) -> Any:
        url = f"{self.rest_url}/{table}{query}"
        data = None
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer

        request = urllib.request.Request(url, data=data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request) as response:
                body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8")
            raise ImportErrorWithContext(
                f"Supabase {method} {table} failed with {exc.code}: {detail}"
            ) from exc
        except urllib.error.URLError as exc:
            raise ImportErrorWithContext(f"Supabase request failed: {exc}") from exc

        return json.loads(body) if body else None

    def select_existing_species(self, slugs: list[str]) -> dict[str, dict[str, Any]]:
        existing: dict[str, dict[str, Any]] = {}

        for slug in slugs:
            encoded_slug = urllib.parse.quote(slug, safe="")
            result = self.request(
                "GET",
                "species",
                f"?select=id,slug&slug=eq.{encoded_slug}",
            )
            if result:
                existing[result[0]["slug"]] = result[0]

        return existing

    def insert_species(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.request(
            "POST",
            "species",
            payload=payload,
            prefer="return=representation",
        )
        return result[0]

    def update_species(self, slug: str, payload: dict[str, Any]) -> dict[str, Any]:
        encoded_slug = urllib.parse.quote(slug, safe="")
        result = self.request(
            "PATCH",
            "species",
            f"?slug=eq.{encoded_slug}",
            payload=payload,
            prefer="return=representation",
        )
        return result[0]

    def replace_aliases(self, species_id: str, aliases: list[str]) -> None:
        encoded_id = urllib.parse.quote(species_id, safe="")
        self.request("DELETE", "species_aliases", f"?species_id=eq.{encoded_id}")
        if aliases:
            payload = [{"species_id": species_id, "alias": alias.strip()} for alias in aliases]
            self.request("POST", "species_aliases", payload=payload)

    def upsert_one_to_one(
        self,
        table: str,
        species_id: str,
        payload: dict[str, Any],
    ) -> None:
        body = {"species_id": species_id, **payload}
        self.request(
            "POST",
            table,
            "?on_conflict=species_id",
            payload=body,
            prefer="resolution=merge-duplicates",
        )


def import_species(
    species: list[dict[str, Any]],
    client: SupabaseRestClient,
    update_existing: bool,
    dry_run: bool,
) -> ImportStats:
    stats = ImportStats()
    slugs = [item["slug"] for item in species]
    existing_by_slug = client.select_existing_species(slugs)

    if not update_existing:
        duplicates = sorted(set(slugs).intersection(existing_by_slug))
        if duplicates:
            duplicate_list = ", ".join(duplicates)
            raise ImportErrorWithContext(
                "These slugs already exist in Supabase. Re-run with "
                f"--update-existing to update them: {duplicate_list}"
            )

    for item in species:
        slug = item["slug"]
        existing = existing_by_slug.get(slug)
        species_payload = pick_fields(item, SPECIES_FIELDS)

        if dry_run:
            if existing and update_existing:
                stats.updated += 1
            elif existing:
                stats.skipped_existing += 1
            else:
                stats.inserted += 1
            count_related(item, stats)
            continue

        if existing and update_existing:
            saved_species = client.update_species(slug, species_payload)
            stats.updated += 1
        elif existing:
            stats.skipped_existing += 1
            continue
        else:
            saved_species = client.insert_species(species_payload)
            stats.inserted += 1

        species_id = saved_species["id"]
        import_related_records(item, species_id, client, stats)

    return stats


def count_related(item: dict[str, Any], stats: ImportStats) -> None:
    if "aliases" in item:
        stats.aliases_replaced += 1
    if "water_parameters" in item and item["water_parameters"] is not None:
        stats.water_parameters_upserted += 1
    if "stocking_profile" in item and item["stocking_profile"] is not None:
        stats.stocking_profiles_upserted += 1


def import_related_records(
    item: dict[str, Any],
    species_id: str,
    client: SupabaseRestClient,
    stats: ImportStats,
) -> None:
    if "aliases" in item:
        client.replace_aliases(species_id, item.get("aliases") or [])
        stats.aliases_replaced += 1

    water_parameters = item.get("water_parameters")
    if water_parameters is not None:
        client.upsert_one_to_one("water_parameters", species_id, water_parameters)
        stats.water_parameters_upserted += 1

    stocking_profile = item.get("stocking_profile")
    if stocking_profile is not None:
        client.upsert_one_to_one("stocking_profiles", species_id, stocking_profile)
        stats.stocking_profiles_upserted += 1


def print_summary(stats: ImportStats, dry_run: bool) -> None:
    prefix = "Dry run complete" if dry_run else "Import complete"
    print(prefix)
    print(f"- Species inserted: {stats.inserted}")
    print(f"- Species updated: {stats.updated}")
    print(f"- Existing species skipped: {stats.skipped_existing}")
    print(f"- Alias sets replaced: {stats.aliases_replaced}")
    print(f"- Water parameter rows upserted: {stats.water_parameters_upserted}")
    print(f"- Stocking profile rows upserted: {stats.stocking_profiles_upserted}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import GuideMyTank species JSON into Supabase."
    )
    parser.add_argument("file", type=Path, help="Path to a species JSON import file.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and summarize without writing to Supabase.",
    )
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="Update existing species matched by slug.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        species = load_species_file(args.file)
        validate_species(species)

        if args.dry_run:
            print(f"Validated {len(species)} species from {args.file}.")
            print("Dry run skips remote duplicate checks and Supabase writes.")
            stats = ImportStats(inserted=len(species))
            for item in species:
                count_related(item, stats)
            print_summary(stats, dry_run=True)
            return 0

        supabase_url, supabase_key = get_supabase_config()
        client = SupabaseRestClient(supabase_url, supabase_key)
        stats = import_species(
            species,
            client,
            update_existing=args.update_existing,
            dry_run=False,
        )
        print_summary(stats, dry_run=False)
        return 0
    except ImportErrorWithContext as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

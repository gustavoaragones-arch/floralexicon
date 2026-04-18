# Data quality

## Country coverage rule (STRICT)

For every `(plant_id, country)` pair:

- There MUST be at least one name with explicit `country_usage` for that country (not only `global_fallback`).
- Synthetic fallback (`source: global_fallback`) is NOT allowed in production datasets.

### Approved ways to fix coverage

- Add or extend raw dataset files under `data/raw/`.
- Reuse an existing global or common name and record it in raw input; after migration, tag with `source: global_reuse` when appropriate (see `scripts/migrate-countries-to-country-usage.ts`). Use `language: "en"` on that raw name row when the label is English; for merge order, prefer a filename that sorts **late** in `data/raw/` (e.g. `z-*.json`) so `en` wins over regional `es` rows in `mergeDataset.ts`.
- Add a verified local or regional name; tag with `source: local_ethnobotany` when appropriate.

### Forbidden

- Inject fallback rows via scripts for production (the `--fix` path on `validate-country-name-coverage.ts` is dev-only and still fails `npm run ci:coverage`).
- Modify processed outputs by hand to bypass the merge pipeline.
- Skip validation in CI.

All fixes must originate from raw inputs and pass `npm run build-dataset` (or at least `merge-dataset` → `migrate-country-usage` → `ci:coverage`).

## CI

```bash
npm run build-dataset
npm run ci:coverage
```

`ci:coverage` runs `scripts/validate-country-name-coverage.ts` and exits with a non-zero status if any pair is `missing` or `fallback_only`.

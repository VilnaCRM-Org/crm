# Metrics Policy

## Source Of Truth

`config/metrics-policy.json` defines hard and review thresholds. Do not lower
thresholds to pass a feature branch.

## Common Fixes

- Split large files by owner.
- Extract pure helpers from hooks and components.
- Deduplicate repeated style objects.
- Replace complex branches with typed lookup maps.

Run:

```bash
make lint-metrics
```

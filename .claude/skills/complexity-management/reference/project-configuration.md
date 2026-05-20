# Project Configuration

## Metrics Scope

`make lint-metrics` analyzes `src/` and excludes generated, build, coverage,
test, Storybook, and dependency paths.

## Related Files

- `config/metrics-policy.json`: hard and review thresholds.
- `scripts/lint-metrics.sh`: report generation and gate behavior.
- `CLAUDE.md`: human-readable metrics summary.

## Update Rule

If policy changes, update both `config/metrics-policy.json` and the Code Metrics
section in `CLAUDE.md` in the same change.

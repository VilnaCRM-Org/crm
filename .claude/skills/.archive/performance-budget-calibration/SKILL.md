---
name: performance-budget-calibration
description: Calibrate Lighthouse performance budgets against live server transfer sizes (gzipped bytes), not raw. Use when setting, validating, or debugging bundle or Lighthouse gzip budget gates.
---

# Performance Budget Calibration

## The Issue: Calibration Trap

Lighthouse `resource-summary` measures **transfer size** (gzipped), not raw bytes. Calibrating budgets on raw-byte assumptions creates false-negative gates—budgets that never fail and catch no regressions.

### Case Study: CRM Issue #117

Initial budgets assumed `serve@14` doesn't gzip. It does. Result: budgets were ~1.4–1.7× too high, unable to catch a real regression until code review bots flagged it.

| Metric            | Assumed (raw) | Actual (gzipped) |
| ----------------- | ------------- | ---------------- |
| `scriptSizeBytes` | 265 KB        | ~156 KB          |
| `totalSizeBytes`  | 480 KB        | ~353 KB          |

## How to Calibrate

1. Build and serve the production app:

   ```bash
   make build-out
   make start-prod
   ```

2. Measure transfer sizes using Chrome DevTools Network tab (observe `Content-Encoding: gzip`):
   - Profile the heaviest page.
   - Record total transfer and per-asset breakdown (JS, CSS, images, fonts).

3. Add 30–35% headroom, then set budgets in `config/performance-budget.json`:

   ```json
   {
     "gzip": {
       "maxInitialEntrypointBytes": 165000,
       "maxAssetBytes": 130000
     },
     "lighthouse": {
       "scriptSizeBytes": 265000,
       "totalSizeBytes": 480000
     }
   }
   ```

4. Verify the gate works by intentionally adding dead code, then running `make perf-budget`. Budget must fail.

## Why It Matters

- A gate that never fires is lint theater—no regression detection.
- Server middleware (gzip, CDN compression) is invisible in raw-byte counting; live measurement is the only truth.
- Headroom accounts for variance across user cohorts, slow networks, and unknown assets.

## Codebase Files

- `config/performance-budget.json` — authoritative budgets.
- `.github/workflows/bundle-size.yml` — gzip enforcement + PR comment.
- `rsbuild.config.ts` — Rspack raw-byte hints.
- `scripts/bundle-size-report.mjs` — gzip validation.
- `tests/unit/routes/route-manifest.test.tsx` — route splitting verification.

## Related

- CLAUDE.md: "Performance Budgets, Bundle Reports, and Route Splitting (issue #117)".
- Commands: `make perf-budget`, `make build-analyze`.
- GitHub workflow: `.github/workflows/bundle-size.yml`.

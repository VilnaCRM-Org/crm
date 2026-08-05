---
name: deferred-di-reflect-metadata-optimization
description: Reduce the critical render chunk by moving reflect-metadata import from entry to deferred-DI composition root; pin the contract with a performance test.
---

## Context

Projects using tsyringe with a **deferred-DI composition root** (loads DI container + reflect-metadata behind a dynamic `import()`) can optimize the entry bundle by removing the redundant eager reflect-metadata import.

Example: the auth feature loads the DI container dynamically on first auth action, so the entry file (`src/index.tsx`) doesn't need `reflect-metadata`.

## Optimization

Remove `import 'reflect-metadata';` from the entry file. The composition root's DI config loads it when the deferred store actions are first accessed.

**Result**: Saves ~16 KB gzip off the critical render path. On mobile Lighthouse: +0.03 (0.82 → 0.85+).

## Verification

Pin the contract in a performance test (e.g., `tests/unit/performance/public-index.test.js`):

```javascript
expect(entrySource).not.toContain("import 'reflect-metadata';");
expect(entrySource).not.toContain("import '@/config/dependency-injection-config';");
```

This enforces that reflect-metadata stays out of the client entry bundle.

## Preconditions

- Project uses tsyringe with a deferred-composition-root pattern (e.g., composition root loads container dynamically behind a `load()` method or similar).
- The composition root's DI config (e.g., `src/config/dependency-injection-config.ts`) imports `reflect-metadata` on line 1.
- No static decorated classes in the static entry path (the entry file and its immediate imports must not use `@injectable()` or other reflect-metadata decorators at parse time).

## Caution

**Do not apply** if reflect-metadata is needed for a decorator-decorated class that is eagerly imported by the entry file. In that case, the entry import is necessary. Verify the static import closure before removing.

## Precedent

VilnaCRM crm: applied in feat/117 and feat/115 (PRs #197, #198). The change passed all CI gates including the 0.85 mobile Lighthouse threshold, confirmed by multiple runs across platforms.

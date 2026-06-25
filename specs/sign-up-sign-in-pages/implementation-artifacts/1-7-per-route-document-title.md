# Story 1.7: Per-route `document.title` via `usePageTitle` (M1 → AR3)

Status: done

## Story

As an assistive-technology user,
I want `/sign-up` and `/sign-in` to have distinct, localized document titles,
so the two URLs are not announced with the same title.

## Acceptance Criteria

1. Given a component calling `usePageTitle('sign_up.title')`, When it mounts, Then
   `document.title` is the localized composed title containing "Registration" (FR11, AR3,
   AC8).
2. Given a component calling `usePageTitle('sign_in.title')`, When it mounts, Then
   `document.title` is the localized composed title containing "Authentication", distinct from
   the sign-up title (FR11, AR3, AC8).
3. Given a `languageChanged` event, When it fires, Then `document.title` is re-applied from the
   same key in the new language (FR11, AR3, AC8).
4. Given the hook unmounts, When cleanup runs, Then it unsubscribes from `languageChanged`
   (no leak) (NFR3).
5. Given the hook file, When inspected, Then it is a `use-*` hook (NFR6-exempt) and declares no
   `static` member or free function (NFR6).

## Tasks / Subtasks

- [x] Task 1: Add the `usePageTitle` hook (AC: 1, 2, 3, 4, 5)
  - [x] 1.1 Create `src/modules/user/features/auth/hooks/use-page-title.ts` as a `use-*` hook
        (NFR6-exempt) with signature `usePageTitle(titleKey: string)`
  - [x] 1.2 Read `t(titleKey)` and compose the localized title (e.g. `"<heading> - VilnaCRM"`),
        then set `document.title`
  - [x] 1.3 Subscribe to `languageChanged` to re-apply the title, mirroring the subscribe/cleanup
        shape of the existing `dir` effect (`app.tsx:31-38`)
  - [x] 1.4 Return a cleanup that unsubscribes from `languageChanged` so the listener does not
        leak (NFR3)

- [x] Task 2: Add unit coverage for the hook (AC: 1, 2, 3, 4)
  - [x] 2.1 Create `tests/unit/modules/user/features/auth/hooks/use-page-title.test.tsx`
  - [x] 2.2 Assert `document.title` is set from the i18n key with exact title-string assertions
        (NFR13), and differs between `sign_up.title` and `sign_in.title`
  - [x] 2.3 Assert the title re-applies on a simulated `languageChanged` event
  - [x] 2.4 Assert the cleanup unsubscribes from `languageChanged` (no leak)

## Dev Notes

- New file (only file touched): `src/modules/user/features/auth/hooks/use-page-title.ts`.
- New test: `tests/unit/modules/user/features/auth/hooks/use-page-title.test.tsx`.
- `usePageTitle(titleKey: string)` reads `t(titleKey)`, composes the localized document title
  (e.g. `"<heading> - VilnaCRM"`), sets `document.title`, and subscribes to `languageChanged`
  to re-apply — mirroring the subscribe/cleanup shape of the existing `dir` effect
  (`app.tsx:31-38`).
- Source the title from the same i18n keys that feed each page's `<h1>` (`sign_up.title` =
  "Registration" / `sign_in.title` = "Authentication"); this guarantees the two pages differ
  and avoids the WCAG 2.4.2 failure (M1, FR11, AR3).
- D3: keep "Authentication" as the sign-in title — the `sign_in.title` key is reused verbatim
  as both the `<h1>` and the document-title source.
- Keep this in a per-page hook (not the shared app effect) so each page stays self-describing
  and the app effect stays single-responsibility under the rca caps (NFR3).
- As a `use-*` hook the file is NFR6-exempt (hooks are functions by definition), but it must
  still declare no `static` member or free function (NFR6).
- Honor the repo gates: rust-code-analysis metrics (`make lint-metrics`), jscpd duplication,
  type-only-files convention (no `interface`/`type` in this logic file), 100% coverage, and
  exact title-string assertions (NFR13).
- No ESLint/TS suppressions, no `data-testid` (locate via semantic queries), no new inline
  comments; test data uses the shared Faker builders where arbitrary domain values are needed.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-7

## Dev Agent Record

**Agent Model Used:** Opus 4.8 (BMAD Dev agent, Amelia)

**Completion Notes:**

- Added `usePageTitle(titleKey)` at `hooks/use-page-title.ts` (a `use-*` hook, NFR6-exempt): reads
  `i18n.t(titleKey)`, sets `document.title` to `"<heading> - VilnaCRM"`, subscribes to
  `languageChanged` to re-apply, and unsubscribes on cleanup — mirroring the `app.tsx` dir effect.
- Titles are sourced from the same keys as each page `<h1>`: `sign_up.title` ("Registration") and
  `sign_in.title` ("Authentication", D3 kept), so the two routes differ (WCAG 2.4.2, M1).
- Tests assert the exact composed titles, distinctness, languageChanged re-application (uk),
  cleanup unsubscribe, and tolerance of an i18n without on/off — 100% coverage incl. branches.
- Gates green: ESLint, tsc, dependency-cruiser, jscpd, rca metrics; no suppressions, no comments.

**File List:**

- `src/modules/user/features/auth/hooks/use-page-title.ts` (new)
- `tests/unit/modules/user/features/auth/hooks/use-page-title.test.tsx` (new)

**Change Log:**

- 2026-06-25: Implemented Story 1.7 — per-route `document.title` via `usePageTitle`.

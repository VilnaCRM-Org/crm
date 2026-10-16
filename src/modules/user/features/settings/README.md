# Settings feature

The user settings page (issue #330): `/settings`, a protected route behind the `userSettings`
runtime flag. The decisions are recorded in `## User Settings decisions` of the
[user module README](../../README.md).

## What is here

- `routes/index.ts` — the `user.settings` route contract.
- `routes/user-profile/index.tsx` — `UserProfile`, the page: title, heading, subtitle, grid.
- `routes/user-profile/settings-catalog-loader.ts` — registers the lazy `settings.*` catalog.
- `components/settings-grid/` — the grid the page's sections are placed in.
- `i18n/{en,uk}.json` — the lazy settings catalog.

## Contract

- The route is always registered; the `RouteFlagGate` shows the not-found page while
  `userSettings` is off, so the page chunk is never requested (see `src/routes/README.md`).
- The page registers its catalog through `SettingsCatalogLoader` when the route module evaluates,
  before `usePageTitle('settings.title')` runs. The catalog is listed in
  `config/i18n-catalog-policy.json`, so the merged `localization.json` holds no `settings.*` key.
- The page imports nothing from the auth feature: shared form pieces live in `src/components` and
  `src/modules/user/lib`.

# Code Organization Troubleshooting

## Import Crosses Too Many Folders

If an import needs several `../` segments, check whether `@/` should be used or
whether the importing file belongs closer to the feature it consumes.

## Component Feels Shared But Imports Feature State

Keep it in the feature. Shared UI must not depend on feature translations,
Redux slices, RTK Query hooks, or route-specific state.

## New Folder Name Is Unclear

`dependency-cruiser` only allows specific folder names; using anything else
fails `make lint-deps`.

- Feature root (`feature-allowed-folders`): `assets`, `components`, `hooks`,
  `i18n`, `repositories`, `routes`, `types`, `utils`.
- Module root (`module-allowed-folders`): `config`, `features`, `hooks`,
  `lib`, `store`, `types`, `utils`.

Do not introduce `helpers/`, `api/`, or feature-level `store/` — data access
is `repositories/`, store stays at module level, and shared module code
goes in `lib/` or `utils/`. Avoid `misc`, `common`, and `manager` names.

## Tests Are Hard To Place

Mirror the source owner. All module and feature names are lowercase
kebab-case:

```text
src/modules/user/features/auth/utils/normalize-auth-error.ts
tests/unit/modules/user/features/auth/utils/normalize-auth-error.test.ts
```

For Playwright flows, name tests by user journey under `tests/e2e/`.

# Code Organization Troubleshooting

## Import Crosses Too Many Folders

If an import needs several `../` segments, check whether `@/` should be used or
whether the importing file belongs closer to the feature it consumes.

## Component Feels Shared But Imports Feature State

Keep it in the feature. Shared UI must not depend on feature translations,
Redux slices, RTK Query hooks, or route-specific state.

## New Folder Name Is Unclear

Prefer existing folder types: `components`, `hooks`, `helpers`, `api`, `store`,
`i18n`, `routes`, `services`, and `utils`. Avoid `misc`, `common`, and `manager`
unless the surrounding code already establishes that pattern.

## Tests Are Hard To Place

Mirror the source owner:

```text
src/modules/User/features/Auth/helpers/foo.ts
tests/unit/modules/User/features/Auth/helpers/foo.test.ts
```

For Playwright flows, name tests by user journey under `tests/e2e/`.

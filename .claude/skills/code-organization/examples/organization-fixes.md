# Code Organization Fixes

All module and feature folders are lowercase kebab-case
(enforced by `dependency-cruiser` rules `src-module-name-kebab-case` and
`src-feature-name-kebab-case`).

## Move Feature-Only UI Back To Its Feature

Problem: a component in `src/components/` imports user auth translations and
repository types.

Fix:

```text
src/modules/user/features/auth/components/
```

Keep it feature-owned until at least two modules use it without auth-specific
props, copy, or state.

## Split Container Logic From Presentation

Problem: a component fetches data, maps errors, owns form state, and renders the
full layout.

Fix:

```text
src/modules/profile/features/profile/
  hooks/use-profile-form.ts
  components/profile-form.tsx
  components/profile-form-fields.tsx
```

The hook owns data and side effects. Components render props and translated UI.

## Replace Vague Utils

`feature-allowed-folders` permits `utils/` (not `helpers/`) at feature level.
Module-shared utilities live in `src/modules/<module>/lib/` or
`src/modules/<module>/utils/`.

Bad:

```text
src/modules/user/features/auth/utils/utils.ts
```

Better:

```text
src/modules/user/features/auth/utils/normalize-auth-error.ts
src/modules/user/features/auth/utils/map-validation-errors.ts
```

Name utilities by the transformation or decision they perform.

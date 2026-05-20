# Code Organization Fixes

## Move Feature-Only UI Back To Its Feature

Problem: a component in `src/components/` imports User Auth translations and API
types.

Fix:

```text
src/modules/User/features/Auth/components/
```

Keep it feature-owned until at least two modules use it without Auth-specific
props, copy, or state.

## Split Container Logic From Presentation

Problem: a component fetches data, maps errors, owns form state, and renders the
full layout.

Fix:

```text
features/Profile/
  hooks/useProfileForm.ts
  components/ProfileForm.tsx
  components/ProfileFormFields.tsx
```

The hook owns data and side effects. Components render props and translated UI.

## Replace Vague Helpers

Bad:

```text
src/modules/User/features/Auth/helpers/utils.ts
```

Better:

```text
src/modules/User/features/Auth/helpers/normalizeAuthError.ts
src/modules/User/features/Auth/helpers/mapValidationErrors.ts
```

Name helpers by the transformation or decision they perform.

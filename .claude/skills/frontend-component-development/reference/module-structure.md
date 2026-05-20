# Module Structure

Use this shape for feature-owned UI:

```text
src/modules/<Module>/features/<Feature>/
  api/
  components/
  helpers/
  hooks/
  i18n/
  store/
  index.ts
```

Only create folders that the feature actually needs.

Shared UI belongs in `src/components` with the `UI` prefix when it is not tied to
one module.

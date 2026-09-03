# Module Structure

Module and feature folder names are lowercase kebab-case
(`src-module-name-kebab-case`, `src-feature-name-kebab-case` in
`.dependency-cruiser.js`).

Use this shape for feature-owned UI:

```text
src/modules/<module>/features/<feature>/
  assets/
  components/
  hooks/
  i18n/
  repositories/
  routes/
  stores/
  types/
  utils/
  index.tsx
```

Only the folders listed above are allowed at feature root
(`feature-allowed-folders`, generated from `config/module-shape.json`). Data
access lives in `repositories/`; do not add `api/` or `helpers/`.
Feature-scoped state is `stores/` (plural); the module-wide store stays at
`src/modules/<module>/store/` (singular).

Scaffold this shape with `make new-module name=<kebab> feature=<kebab>` rather
than creating it by hand — see `docs/scaffolding.md`.

Create only the folders the feature actually needs.

Shared UI belongs in `src/components/` with the `ui-` prefix when it is not
tied to one module (folder: `ui-button/`, exported symbol: `UIButton`).

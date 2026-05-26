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
  types/
  utils/
  index.ts
```

Only the folders listed above are allowed at feature root
(`feature-allowed-folders`). Data access lives in `repositories/`; do not add
`api/`, `helpers/`, or `store/` at the feature level. The module store stays
at `src/modules/<module>/store/`.

Create only the folders the feature actually needs.

Shared UI belongs in `src/components/` with the `ui-` prefix when it is not
tied to one module (folder: `ui-button/`, exported symbol: `UIButton`).

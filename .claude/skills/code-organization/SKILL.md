---
name: code-organization
description: Use when placing, moving, naming, or splitting frontend files.
---

# Code Organization

## Core Rule

Place code by ownership first, then by type. Prefer the existing module and
feature structure over new top-level abstractions.

## Frontend Structure

```text
src/
  modules/
    user/
      config/
      features/
        auth/
          assets/
          components/
          hooks/
          i18n/
          repositories/
          routes/
          types/
          utils/
      hooks/
      lib/
      store/
      types/
      utils/
  components/
  services/
  stores/
  config/
  routes/
  providers/
  utils/
```

Use `src/modules/<module>/features/<feature>/` for domain-owned workflows.
Use `src/components/ui-*` for reusable UI building blocks.

## Placement Rules

- Feature UI stays with its feature unless it is genuinely shared.
- Shared components use the `ui-` prefix and MUI/Emotion patterns.
- Data access lives in `features/<feature>/repositories/`; features must
  not call the HTTP client (`src/services/https-client/`) directly.
- Repositories are consumed through their `index` file only.
- Feature components and routes go through hooks; they must not import
  the module store, repositories, or `src/services/` directly.
- Translation files live in feature `i18n/en.json` and `i18n/uk.json`.
- Tests mirror source ownership under `tests/`.
- Use `@/` imports instead of deep relative paths across folders.

## Naming Rules

All rules below are enforced by `dependency-cruiser` (see
`.dependency-cruiser.js`). Violations fail `make lint-deps` and CI.

- All source paths are lowercase. No uppercase letters in file or folder
  names anywhere under `src/` or `tests/` (rule: `no-uppercase-paths`).
- Module names under `src/modules/` are lowercase kebab-case — `user`,
  `back-to-main` — not `User` or `BackToMain` (`src-module-name-kebab-case`).
- Feature names under `src/modules/*/features/` are lowercase kebab-case —
  `auth`, not `Auth` (`src-feature-name-kebab-case`).
- Files and folders inside a feature are kebab-case
  (`components/form-section/inert-box.tsx`,
  `repositories/login-repository.ts`).
- Feature hook files must be `index.*` or `use-<kebab>.*`
  (`use-login-switcher.ts`) — enforced by `feature-hooks-file-convention`.
- Module root may only contain: `config`, `features`, `hooks`, `lib`,
  `store`, `types`, `utils` (`module-allowed-folders`). Use `lib/` or
  `utils/` instead of `helpers/`.
- Feature root may only contain: `assets`, `components`, `hooks`, `i18n`,
  `repositories`, `routes`, `types`, `utils` (`feature-allowed-folders`).
  Do not add `api/`, `helpers/`, or `store/` at feature level — data
  access is `repositories/`; store stays at module level.
- Test module and feature folder names under `tests/{e2e,integration,unit}/
modules/` are lowercase kebab-case (`tests-module-name-lowercase`,
  `tests-feature-name-lowercase`).
- Component identifiers (the exported symbol) are PascalCase; reusable
  components are prefixed with `UI` (e.g. `export function UIButton`),
  but their files and folders stay kebab-case (`ui-button/index.tsx`).
- Hook identifiers are `useSomething`; hook files are `use-something.ts`.
- Helpers: specific names, not `helper`, `misc`, or `utils` catch-alls.
- Redux slices and thunks: name by the module action they represent.
- Test files: match the subject and environment.

## Avoid

- New shared folders without existing demand from multiple callers.
- Cross-module imports that bypass public feature exports.
- Business strings hardcoded in JSX.
- Components that mix data fetching, layout, validation, and presentation when
  a hook or child component would make the boundary clearer.

## Related Guides

Before applying this skill, confirm the active task against
[../AI-AGENT-GUIDE.md](../AI-AGENT-GUIDE.md) and
[../SKILL-DECISION-GUIDE.md](../SKILL-DECISION-GUIDE.md) so every relevant
skill is consulted.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [examples/organization-fixes.md](examples/organization-fixes.md): concrete
  frontend placement and naming fixes.
- [reference/troubleshooting.md](reference/troubleshooting.md): guidance for
  ambiguous ownership, imports, and test placement.

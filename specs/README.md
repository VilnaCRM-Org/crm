# Specs

BMAD planning and Ralph implementation artifacts, grouped per spec.

## Layout

Each spec owns one folder with two artifact subfolders:

```text
specs/
└── <spec-name>/
    ├── planning-artifacts/        # PRD, architecture, epics (BMAD phases 1-3)
    └── implementation-artifacts/  # Story files produced during implementation
```

## Current Specs

| Spec                          | Status      |
| ----------------------------- | ----------- |
| `rust-code-analysis`          | Implemented |
| `start-ci-chromium`           | Implemented |
| `eslint-suppressions`         | In progress |
| `makefile-playwright-targets` | Planned     |

## Conventions

- Planning artifacts are named `<type>-<spec-name>-<date>.md`
  (`type` is `prd`, `architecture`, or `epics`).
- Implementation artifacts are story files named `<epic>-<story>-<slug>.md`.
- The active spec is selected in `_bmad/config.yaml` via the
  `planning_artifacts` and `implementation_artifacts` paths.
- Do not scan this folder in lint or suppression checks; documents quote
  directive examples that are not real code.

---
name: documentation-sync
description: Use when code, commands, tools, or workflows change documentation obligations.
---

# Documentation Sync

## When To Update Docs

Update docs in the same change when you modify:

- Makefile targets or command behavior.
- Test strategy, mock behavior, or CI expectations.
- Feature/module structure.
- Agent skill layout or guidance.
- User-visible flows that existing docs describe.

## Places To Check

- `CLAUDE.md`
- `agents.md`
- `.claude/skills/`
- README files near changed features
- Test or workflow docs under `tests/`, `scripts/`, or `docs/`

## Sync Rules

- Keep `.agents/skills` as the BMAD location.
- Keep `.claude/skills` for non-BMAD frontend project skills.
- When `make format` changes behavior, mention that it includes Prettier and
  `qlty fmt`.
- Do not copy backend-only user-service instructions into frontend docs.

## Verification

```bash
make format
make lint-md
```

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [reference/quality-standards.md](reference/quality-standards.md): doc quality
  rules for examples, commands, and cross-references.
- [reference/workflow-checklist.md](reference/workflow-checklist.md): sync flow.
- [update-scenarios/tooling-and-agent-skills.md](update-scenarios/tooling-and-agent-skills.md):
  Makefile and skill-layout doc updates.
- [update-scenarios/testing-and-quality.md](update-scenarios/testing-and-quality.md):
  testing, formatting, lint, and metrics doc updates.
- [update-scenarios/frontend-features.md](update-scenarios/frontend-features.md):
  feature-level documentation updates.

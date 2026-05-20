---
name: documentation-creation
description: Use when creating new repository documentation or agent guides.
---

# Documentation Creation

## Scope

Create docs that help future contributors act correctly in this frontend repo.
Prefer short, command-oriented guidance over broad background.

## Required Content

- State the audience and the task the doc supports.
- Reference real repo paths and Makefile targets.
- Explain frontend-specific conventions: React, MUI, Emotion, i18n, testing, and
  Docker-backed commands.
- Add verification steps for any workflow that changes code.

## Markdown Standards

- Keep headings in order.
- Use fenced code blocks with a language.
- Keep lines under the markdownlint limit.
- Avoid bare URLs; use markdown links when links are needed.
- Keep tables narrow enough to pass `make lint-md`.

## Verification

```bash
make format
make lint-md
```

Run `make lint` as the final gate when docs are part of a code change.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [examples/README.md](examples/README.md): examples of feature and skill docs.
- [reference/doc-templates.md](reference/doc-templates.md): concise templates.
- [reference/verification-checklist.md](reference/verification-checklist.md):
  checks before committing docs.

---
name: code-review
description: Use when retrieving or addressing PR review comments.
---

# Code Review Workflow

## Quick Start

```bash
make pr-comments
make pr-comments PR=123
make pr-comments FORMAT=json
make pr-comments FORMAT=markdown
```

Resolve comments in priority order, then verify with formatting, focused tests,
and the full lint gate.

## Comment Categories

| Type                   | Response                                           |
| ---------------------- | -------------------------------------------------- |
| Committable suggestion | Apply if correct, then verify                      |
| Bug or regression      | Reproduce and add or update a focused test         |
| Architecture concern   | Use `code-organization` or `complexity-management` |
| Test gap               | Add coverage at the smallest meaningful level      |
| Question               | Answer directly or make the code clearer           |

## Verification

```bash
make format
make lint
```

Add focused suites when comments touch behavior:

```bash
make test-unit-client
make test-e2e
make test-visual
```

## Rules

- Do not apply suggestions blindly; check the surrounding code first.
- Do not lower lint, TypeScript, test, or metrics thresholds to pass review.
- Keep commits grouped by coherent review concern when possible.
- Re-run `make pr-comments` before finishing review work.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [reference/quality-standards.md](reference/quality-standards.md): review
  evidence, verification commands, and protected quality rules.

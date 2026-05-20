---
name: frontend-performance-accessibility
description: Use when improving frontend performance, Lighthouse, web-vitals, or a11y.
---

# Frontend Performance Accessibility

## Performance Checks

Use Lighthouse for page-level performance and best-practice validation:

```bash
make lighthouse-desktop
make lighthouse-mobile
```

Use `web-vitals` for runtime signals when adding instrumentation.

## Accessibility Checks

- Prefer semantic MUI components and native controls.
- Use accessible names for buttons, links, fields, dialogs, and icons.
- Keep form errors connected to their fields.
- Use Playwright role and label locators to preserve accessibility pressure.
- Check keyboard interaction for menus, dialogs, forms, and route changes.

## Rendering Rules

- Avoid layout shifts from dynamic labels, counters, and loading states.
- Keep heavy computation out of render paths.
- Memoize only when measurement or code shape shows repeated cost.
- Preserve readable contrast and focus states.

## Verification

```bash
make test-unit-client
make test-e2e
make test-visual
make lighthouse-desktop
make lighthouse-mobile
```

Run the subset that matches the change, then finish with `make format` followed
by `make lint`.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [reference/lighthouse.md](reference/lighthouse.md): Lighthouse command and
  review areas.
- [reference/web-vitals.md](reference/web-vitals.md): LCP, CLS, and INP notes.
- [reference/a11y-review.md](reference/a11y-review.md): accessibility review
  checklist.

# Console gate

Fails a Jest test when it emits unexpected `console.error` or `console.warn` output (issue #192).

## Why

ESLint's `no-console` gates code that _writes_ `console.*` calls. It cannot see output _emitted by_
React, MUI, react-router, or i18next while a component renders. That channel carried real defects
past every green build: `act()` warnings from un-awaited state updates, missing list `key` props,
invalid DOM nesting, duplicate providers, and i18next `missingKey` output — the last of which is a
user-visible localization defect in a `uk`/`en` product. Because the 100% coverage threshold forces
essentially the whole component tree through Jest, this gate observes far more surface than a
browser-level console check can, and it sees development-mode warnings that production builds strip.

## Wiring

`installConsoleGate()` is called from every Jest setup file. It is idempotent, so
`tests/mutation/setup.ts` re-entering through `tests/integration/setup.ts` installs the gate once.

| Setup file                     | Suite                              | Gated levels |
| ------------------------------ | ---------------------------------- | ------------ |
| `jest.setup.ts`                | unit (jsdom)                       | error + warn |
| `tests/integration/setup.ts`   | integration                        | error + warn |
| `tests/mutation/setup.ts`      | Stryker (unit + integration union) | error + warn |
| `tests/apollo-server/setup.ts` | apollo server (node)               | error only   |

The node server suite runs no React, and its intentional `console.error` paths are already spied in
`format-error.test.ts` and `shutdown-functions.test.ts`. `console.log` / `info` / `debug` are never
gated — the apollo-server shutdown path logs on purpose, and gating those levels adds noise without
defect coverage.

Because Stryker reuses this Jest wiring, mutants that surface a React warning are now killed. That
can only raise the mutation score; no Stryker threshold changes.

## Satisfying the gate

**The path legitimately logs.** Spy on it _and assert it_, scoped to the single test that needs it:

```ts
it('returns error when the response is null', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  const result = mapper.map(null);

  expect(consoleError).toHaveBeenCalledWith('Registration response validation failed', {
    issueCount: 1,
  });
  expect(result.ok).toBe(false);
});
```

A file-wide `beforeEach` spy is not acceptable: it swallows genuinely unexpected output in the
file's other tests. A bare `mockImplementation()` with no assertion is silencing, not testing.

**The message is an `act()` warning.** It is a real latent bug — the test asserts against a React
tree that is still settling. Await the update (`await waitFor(...)`, `await screen.findBy…`, or wrap
the trigger in `act(...)`). Do not spy it away.

**A library emits it unconditionally and nothing in this repository can stop it.** Only then add an
allowlist entry, and expect it to be reviewed as a defect suppression.

## Allowlist

`allowlist.ts` entries are validated by `tests/unit/tooling/console-gate.test.ts`, which fails the
build unless every entry:

- has a `pattern` anchored at **both** ends (`^` … `$`), so an entry matches the complete message
  and cannot swallow unrelated output appended to it;
- carries a substantive `reason`;
- declares an `expiresWith` package major that the version pinned in `package.json` has **not** yet
  reached.

The last rule is what stops the allowlist from rotting: the dependency bump that fixes the message
turns this test red until the stale entry is deleted. An entry cannot outlive its cause.

## Proof the gate fires

`tests/unit/tooling/console-gate-fixtures.test.ts` runs a child Jest process against the seeded
fixtures in `tests/fixtures/console-gate/` and pins that the gate:

- fails a test that emits an unexpected `console.error`;
- fails a test that emits an unexpected `console.warn`;
- fails a test whose output is emitted during testing-library cleanup, after the test body returned;
- passes a test that spies on and asserts its expected output;
- re-arms after a test leaves its `console` spy unrestored, so one spied test cannot silently
  disable the gate for the rest of its file (the library re-installs its patch in its own
  `beforeEach`, so no `mockRestore()` is required);
- passes an allowlisted message and the ungated `log` / `info` levels.

The fixtures are named `*.fixture.ts` / `*.fixture.tsx`, not `*.test.ts` / `*.test.tsx`, so no
runner discovers them directly.

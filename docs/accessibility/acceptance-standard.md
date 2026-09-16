# Accessibility acceptance standard

**Conformance target: WCAG 2.1 Level AA.** Every page and component this repository ships must
meet it, and the gates below (issue #118) make that a merge condition rather than a review
opinion. WCAG 2.2 AA (`wcag22aa`, in practice the `target-size` rule) is the next ratchet; the
44 px floor on the primary auth controls in `tests/e2e/mobile/` already covers its largest
surface and the remaining under-sized controls are tracked as design work.

## What is enforced

| Layer          | Tool                     | Check                              |
| -------------- | ------------------------ | ---------------------------------- |
| Static JSX     | `eslint-plugin-jsx-a11y` | `make lint-eslint`                 |
| Component      | `jest-axe`               | `make test-a11y-unit`              |
| Route          | `@axe-core/playwright`   | `make test-a11y-e2e`               |
| Keyboard       | Playwright               | `make test-a11y-e2e`               |
| Category score | Lighthouse               | `performance testing`, second line |

The component lane calls [`expectNoA11yViolations`][component-helper] over the `UI*` components
and pages listed in [`tests/unit/a11y/`][unit] and also runs inside `make test-unit-all`. The
route lane calls [`expectNoAxeViolations`][route-helper] on every route in
`src/routes/route-paths.ts` in Chromium, Firefox and WebKit, and the keyboard lane uses
[`expectTabOrder`][keyboard-helper] to assert tab order, `:focus-visible`, a visible focus change
and Space/Enter activation. Both Playwright lanes ride the `accessibility testing` check.
Lighthouse keeps its 0.95 desktop / 0.90 mobile accessibility scores on `/`, `/sign-in` and
`/sign-up` as a second signal, not the primary gate.

The component lane renders the `UI*` components and pages listed in [`tests/unit/a11y/`][unit]
and also runs inside `make test-unit-all`. The route lane scans every route in
`src/routes/route-paths.ts` in Chromium, Firefox and WebKit, and the keyboard lane asserts tab
order, `:focus-visible`, a visible focus change and Space/Enter activation. Lighthouse keeps its
0.95 desktop / 0.90 mobile accessibility scores on `/`, `/sign-in` and `/sign-up` as a second
signal, not the primary gate.

The **rule set** is one constant, [`WCAG_AA_TAGS`][config] = `wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa`; both axe layers import it and no test re-declares it. `best-practice` rules are
advisory and are not part of the gate: in jsdom they false-fail every rendered fragment
(`region`, `landmark-one-main`, `page-has-heading-one`), and at route level the one worth
enforcing — no positive `tabindex` — is asserted explicitly by the route spec instead.

**The Jest lane cannot judge colour.** jsdom performs no layout and has no canvas, so
`color-contrast` and `link-in-text-block` are disabled there ([`JSDOM_INCAPABLE_RULES`][config]);
axe-core 4.13 would otherwise report the gap through `console.error`, which the console gate
turns into a failure. WCAG 1.4.3 is owned by the Playwright lane, which runs in real browsers. A
green component test is therefore evidence of names, roles, states, labels and structure — never
of contrast.

## Definition of done for a page or component

A change is accessibility-done when all of the following hold, in addition to the gates passing:

- Every interactive control has an accessible name that matches its visible label (2.5.3), and
  every form field is labelled with `<label htmlFor>` or `aria-labelledby`, never placeholder
  text alone (1.3.1, 3.3.2). Validation errors are tied to their field through
  `aria-describedby` and the field carries `aria-invalid` (3.3.1).
- Everything reachable with a pointer is reachable and operable with the keyboard alone, in an
  order that follows the reading order (2.1.1, 2.4.3), with a focus indicator visible on every
  stop (2.4.7). Dialogs and menus trap focus while open and return it on close.
- Icon-only controls have a text alternative; decorative images have `alt=""` and are hidden from
  the accessibility tree (1.1.1).
- Text contrast is at least 4.5:1, large text and UI component boundaries at least 3:1 (1.4.3,
  1.4.11). Colour is never the only carrier of meaning (1.4.1).
- Content that changes without a page load is announced through a live region when it matters
  (`UILiveStatus`), and never through two competing mechanisms (4.1.3).
- New routes are added to the route-coverage manifest, so the route scan reaches them, and to
  `lighthouse/constants.js` when they are user-facing pages.

Locate elements in tests by user-facing semantics (`getByRole`, `getByLabelText`, `getByText`);
`src/` ships no `data-testid` (issue #90).

## Exception process

A violation the gate reports is fixed at its source. The single sanctioned alternative is a
scoped entry in [`A11Y_EXCEPTIONS`][config]:

```ts
{
  ruleId: 'color-contrast',
  selector: 'form button[type="submit"].MuiButton-contained',
  reason: 'Submit button is white on the Figma primary #1EAEFF (2.45:1); token owned by design.',
  trackingUrl: 'https://github.com/VilnaCRM-Org/crm/issues/276',
}
```

- `ruleId` names exactly one axe rule; `selector` is a CSS selector the offending element must
  match (`Element.matches`), so a hashed emotion class is never a valid scope and `*` is rejected
  by the filter itself; `reason` states why the debt is accepted rather than fixed; `trackingUrl`
  is the GitHub issue that owns removing it.
- The filter removes only the violation nodes that match both the rule and the selector — every
  other node of the same rule stays reported, so an exception can never widen into a rule
  suppression.
- An entry is deleted in the pull request that closes its tracking issue. The allowlist contract
  in [`tests/unit/a11y/a11y-gate.test.tsx`][gate-test] fails the build on an entry missing any
  of the four fields, and pins that a nameless button and an `alt`-less image really fail.
- Never satisfy the gate with `eslint-disable`, `axe.configure` rule removal, `test.skip` /
  `test.fixme`, a widened selector, or a re-introduced `if (count > 0)` guard around an
  assertion — `playwright/no-conditional-in-test` and `playwright/no-wait-for-timeout` are
  `error` for exactly that reason.

### Current exceptions

Four `color-contrast` entries, all rooted in Figma palette tokens (`#1EAEFF` primary,
`grey[50]` `#969B9D`) and the `UILink` theme dropping the palette, tracked together in
[issue #276](https://github.com/VilnaCRM-Org/crm/issues/276). Fixing them changes rendered
colour and therefore every visual baseline, which is why they are design-owned work rather than
part of the gate's own pull request.

## Adding coverage

- **A new `UI*` component**: add a row to `componentCases` in
  [`tests/unit/a11y/ui-components.a11y.test.tsx`][unit] rendering it in its representative
  states (idle, error, loading). Mock its `.svg` imports the way the file already does.
- **A new route**: add it to `routeScans` in [`tests/e2e/a11y/routes.a11y.spec.ts`][routes] with
  the selector that proves the page has finished rendering, and its manifest row in
  `tests/e2e/route-coverage.tsv`.
- **A new form or focus-trapping surface**: add a keyboard spec beside
  [`sign-in-keyboard.a11y.spec.ts`][keyboard-spec] using `expectTabOrder` for the order and
  `visibleFocus: true` on every stop whose focus style is static (inputs, outlined buttons and
  links). A ripple-only cue does not register as a computed-style change; treat such a control
  as a 2.4.7 finding to fix, not a stop to skip.

Run the whole gate locally with `make test-a11y`; the Playwright half needs the production
stack (`make start-prod`), which the target starts.

[config]: ../../tests/utils/a11y/axe-config.ts
[component-helper]: ../../tests/utils/a11y/expect-no-a11y-violations.ts
[route-helper]: ../../tests/utils/a11y/expect-no-axe-violations.ts
[keyboard-helper]: ../../tests/utils/a11y/keyboard.ts
[unit]: ../../tests/unit/a11y/ui-components.a11y.test.tsx
[gate-test]: ../../tests/unit/a11y/a11y-gate.test.tsx
[routes]: ../../tests/e2e/a11y/routes.a11y.spec.ts
[keyboard-spec]: ../../tests/e2e/a11y/sign-in-keyboard.a11y.spec.ts

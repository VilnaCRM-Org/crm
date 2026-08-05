# Module and feature scaffolding

Modules and features are **generated**, not hand-rolled. One command emits a skeleton that
already satisfies dependency-cruiser, TypeScript, ESLint, jscpd, markdownlint, Prettier and
the rust-code-analysis metrics gate — so structure mistakes never reach red CI.

This page is the single place that documents how to create one. Everything else links here.

## Commands

```bash
make new-module name=orders                          # module + a first feature named `orders`
make new-module name=orders feature=order-list       # module + a named first feature
make new-module name=orders feature=order-list owner=@handle
make new-feature module=orders feature=order-detail  # add a feature to an existing module
make verify-scaffold                                 # gate the templates themselves
```

`owner` defaults to the owner of the `*` line in `.github/CODEOWNERS` and must be an
`@user` or `@org/team` handle. Names must be lowercase kebab-case; the generator refuses
anything else.

The generator runs inside the dev container. `node_modules` there is a named Docker volume
that is only seeded the first time it is created, so a container built before `plop` was
added still will not have it and `bun x plop` fails. Recreate the volume once:

```bash
make clean && make start
```

## What `make new-module` writes

```text
src/modules/<module>/
├── package.json                  # module name + owners
├── README.md                     # public API contract stub
├── index.ts                      # module barrel (@/modules/<module>)
├── config/{tokens.ts,di.ts}      # DI symbols + ModuleRegistrar composition root
├── features/<feature>/
│   ├── index.tsx                 # the feature entry component (the routed page)
│   ├── components/<feature>-panel/index.tsx
│   ├── hooks/{index.ts,use-<feature>.ts}
│   ├── i18n/{en.json,uk.json}
│   ├── repositories/{index.ts,<feature>-repository-impl.ts}
│   ├── routes/index.ts           # module-owned route contract
│   ├── stores/index.ts           # the one sanctioned DI seam for the feature
│   ├── types/…                   # type-only files (issue #88)
│   └── assets/, utils/           # kept by an empty .gitignore
└── hooks/, lib/, store/, types/, utils/   # kept by an empty .gitignore
tests/unit/modules/<module>/features/<feature>/…   # hook + repository suites
tests/e2e/modules/<module>/features/<feature>/…    # Playwright skeleton
.github/CODEOWNERS                                 # one appended ownership line
```

`make new-feature` writes the `features/<feature>/` subtree plus its tests, and appends the
feature's DI token to `config/tokens.ts` and its registration to `config/di.ts`.

Generated files are run through `eslint --fix` and Prettier before the generator returns, and
the generator fails if any emitted line would breach the 100-character `max-len` gate — use a
shorter module or feature name if that happens.

## What it deliberately does not write

Two files are hand-maintained and order-sensitive, so the generator prints the exact lines
instead of rewriting them:

- `src/config/dependency-injection-config.ts` — import the module registrar and append it to
  the `registrars` array. Until you do, nothing in `config/di.ts` is registered.
- `src/routes/registry.ts` — import the route contract and append it to `routeModules`. Until
  you do, the page is unreachable.

The generated Playwright spec ships as `test.describe.fixme(...)` for the same reason. Drop
the `.fixme` once the route is registered.

## The folder law is single-sourced

[`config/module-shape.json`](../config/module-shape.json) is the only place the allowed
folder names live. Both the generator and `.dependency-cruiser.js` read it, so the skeleton
and the gate that judges it cannot disagree.

- **Module root** — `config`, `features`, `hooks`, `lib`, `store`, `types`, `utils`.
- **Feature root** — `assets`, `components`, `hooks`, `i18n`, `repositories`, `routes`,
  `stores`, `types`, `utils`.
- **`tests/` root** — `apollo-server`, `builders`, `e2e`, `integration`, `load`,
  `memory-leak`, `mutation`, `unit`, `utils`, `visual`.
- **Test module root** — `features`, `helpers`, `lib`, `repositories`, `store`.
- **Test feature root** — same list as the feature root.

There is no `api/` and no `helpers/`: data access is `repositories/`, shared module code is
`lib/` or `utils/`. Feature-level state lives in `stores/` (plural); the module-wide store is
`store/` (singular) at the module root.

`tests/unit/tooling/module-shape.test.ts` fails if `.dependency-cruiser.js` ever grows a
second copy of these lists, or if the generator emits a folder the policy does not allow.

## The self-verification gate

`make verify-scaffold` (CI check **`scaffold`**) generates a throwaway module, runs
`lint-deps`, `lint-tsc`, `lint-eslint`, `lint-dup`, `lint-md`, `lint-prettier` and
`lint-metrics` against the generated tree, then deletes every generated path and restores
`.github/CODEOWNERS`. It fails if the templates drift from any of those configs.

Because the dev container runs as root, the generated files are root-owned on the host; the
cleanup therefore runs inside the same container. Override the gate list with
`SCAFFOLD_VERIFY_TARGETS="lint-deps lint-tsc"` for a faster local loop.

## Changing the templates

Templates live in [`scripts/templates/`](../scripts/templates) and the generator definitions
in [`plopfile.ts`](../plopfile.ts). After any change:

```bash
make format
make verify-scaffold
make test-unit-all
```

Never satisfy a gate by weakening it. If a generated file trips dependency-cruiser, ESLint,
TypeScript, jscpd or the metrics policy, fix the template.

Two generated features must not duplicate each other either — the jscpd gate has zero
tolerance. That is why the shared loading state machine lives in `src/hooks/use-async-list.ts`
and the shared section chrome in `src/components/ui-async-section/`, instead of being copied
into every scaffold.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

type EslintMessage = { ruleId: string | null; message: string; severity: number; line: number };
type EslintResult = { messages: EslintMessage[] };

type CruiseReport = { summary?: { violations?: { rule: { name: string; severity: string } }[] } };

const repoRoot = path.resolve(__dirname, '../../..');
// Fixtures must live under src/ for the flat config and the tsconfig project to apply, so
// they are namespaced per worker and swept before and after the suite. In-process cleanup
// cannot survive a SIGKILL, so the guarantee is bounded: no worker can collide with another,
// and the next run of this suite removes anything a killed one left behind. A hard-killed run
// still leaves its fixture until then — `git status` shows it, and `make lint` would flag it.
const probe = `probe-${process.pid}`;
const eslintBin = path.join(repoRoot, 'node_modules/eslint/bin/eslint.js');
const depcruiseBin = path.join(
  repoRoot,
  'node_modules/dependency-cruiser/bin/dependency-cruise.mjs'
);

// The gate is only worth its maintenance cost if it actually rejects the code it claims
// to reject, so lint a throwaway fixture through the real ESLint binary instead of
// asserting on the config shape (issue #189's must-fail-fixture principle). ESLint's flat
// config is ESM and cannot be imported from this CJS suite, hence the child process.
const lint = (relativePath: string, source: string): EslintMessage[] => {
  const absolute = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, source, 'utf8');
  try {
    execFileSync(process.execPath, [eslintBin, absolute, '--format', 'json'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    return [];
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; status?: number };
    const output = failure.stdout ?? '';
    // A config or crash failure produces empty/non-JSON stdout; surfacing ESLint's own
    // reason beats a bare "Unexpected end of JSON input" from the parser.
    if (!output.trim().startsWith('[')) {
      throw new Error(`ESLint exited ${failure.status ?? '?'}: ${failure.stderr ?? output}`);
    }
    const results = JSON.parse(output) as EslintResult[];
    return results.flatMap((result) => result.messages);
  } finally {
    fs.rmSync(absolute, { force: true });
  }
};

const authorizationMessages = (messages: EslintMessage[]): EslintMessage[] =>
  messages.filter((message) => message.message.includes('(issue #114)'));

// Same principle for the import boundaries: cruise a throwaway fixture and read the rule
// names out of the report, rather than regex-matching the config against itself.
const cruise = (fixtures: Record<string, string>): string[] => {
  const written = Object.keys(fixtures).map((relative) => path.join(repoRoot, relative));
  written.forEach((absolute, index) => {
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, Object.values(fixtures)[index], 'utf8');
  });
  // depcruise reports violations on stdout whether or not it exits non-zero, so read the
  // report in both branches — trusting the exit code alone would make this pass vacuously.
  const run = (): string => {
    try {
      return execFileSync(
        process.execPath,
        [depcruiseBin, ...written, '--output-type', 'json', '--config', '.dependency-cruiser.js'],
        { cwd: repoRoot, encoding: 'utf8' }
      );
    } catch (error) {
      const failure = error as { stdout?: string; stderr?: string; status?: number };
      const output = failure.stdout ?? '';
      if (!output.trim().startsWith('{')) {
        throw new Error(`depcruise exited ${failure.status ?? '?'}: ${failure.stderr ?? output}`);
      }
      return output;
    }
  };
  try {
    const report = JSON.parse(run()) as CruiseReport;
    // Name alone is not enough: depcruise lists warn-severity violations in the same
    // array, so a rule quietly downgraded to `warn` would keep every assertion green
    // while no longer blocking CI. Only blocking violations count as caught.
    return (report.summary?.violations ?? [])
      .filter((violation) => violation.rule.severity === 'error')
      .map((violation) => violation.rule.name);
  } finally {
    // Remove the fixture *and* any directory it needed: a stray empty folder under src/
    // silently changes how the other gates resolve their own fixtures.
    written.forEach((absolute) => {
      fs.rmSync(absolute, { force: true });
      const parent = path.dirname(absolute);
      if (parent !== repoRoot && fs.existsSync(parent) && fs.readdirSync(parent).length === 0) {
        fs.rmdirSync(parent);
      }
    });
  }
};

const GATED_COMPONENT = `import useCan from '@/hooks/use-can';
import type { Principal } from '@/lib/types/access/principal';

export default function Probe({ principal }: { principal: Principal }): JSX.Element {
  const allowed = useCan('contact:read');
  const elevated = principal.permissions.includes('contact:manage-all');
  const admin = principal.roles.includes('admin');
  return <p>{\`\${allowed}\${elevated}\${admin}\`}</p>;
}
`;

// `includes` is the obvious spelling, not the only one. The fixture below covers every
// membership pattern the gate must reject — every method in `MEMBERSHIP_METHODS` (includes,
// some, every, find, findIndex, findLast, findLastIndex, indexOf, lastIndexOf, filter, at),
// spelled as an identifier and as a computed literal, across the member, destructured,
// computed and optionally-chained receivers, plus the two escapes that never call an array
// method: a `.has()`-ed Set wrapper and bare indexing. A gate that stops only the obvious
// one is a gate in name only, so any method added to the selector must be added here and to
// `docs/access-control.md` too, or it can silently fall out of the regex unnoticed.
const BYPASS_ATTEMPTS = `import RequirePermission from '@/components/require-permission';
import type { Principal } from '@/lib/types/access/principal';

export default function Probe({ principal }: { principal: Principal }): JSX.Element {
  const { permissions, roles } = principal;
  const a = permissions.includes('contact:manage-all');
  const b = roles.includes('admin');
  const c = principal['permissions'].includes('deal:write');
  const d = principal?.permissions.includes('contact:read');
  const e = principal.permissions.some((p) => p === 'contact:read');
  const f = principal.roles.find((r) => r === 'admin') !== undefined;
  const g = principal.roles.indexOf('admin') !== -1;
  const h = principal.permissions.filter((p) => p === 'deal:read').length > 0;
  const i = new Set(principal.permissions).has('deal:write');
  const j = principal.roles[0] === 'admin';
  const k = roles[0] === 'admin';
  const l = principal.roles.every((r) => r === 'admin');
  const m = principal.permissions.findIndex((p) => p === 'deal:read') !== -1;
  const n = principal.roles.at(0) === 'admin';
  const o = principal.roles.findLast((r) => r === 'admin') !== undefined;
  const q = principal.permissions.findLastIndex((p) => p === 'deal:read') !== -1;
  const s = principal.roles.lastIndexOf('admin') !== -1;
  const t = principal.permissions['includes']('deal:write');
  const u = new Set(roles).has('admin');
  const v = new Set(principal['roles']).has('admin');
  return (
    <RequirePermission permission={'contact:read'}>
      <p>{\`\${a}\${b}\${c}\${d}\${e}\${f}\${g}\${h}\${i}\${j}\${k}\${l}\${m}\${n}\`}</p>
      <p>{\`\${o}\${q}\${s}\${t}\${u}\${v}\`}</p>
    </RequirePermission>
  );
}
`;

// The other half of the contract: the gate must NOT fire on a plain read. Rendering a
// principal's own roles, or de-duplicating them for display, decides nothing — a selector
// tightened until it rejects these would push callers toward casts instead of the seam.
const ALLOWED_READS = `import type { Principal } from '@/lib/types/access/principal';

export default function Probe({ principal }: { principal: Principal }): JSX.Element {
  const distinct = new Set(principal.roles).size;
  const listed = principal.roles.map((role) => role).join(', ');
  const count = principal.permissions.length;
  return <p>{\`\${distinct}\${listed}\${count}\`}</p>;
}
`;

// Backticks are quotes too, and `canAll`/`canAny` hide their permissions one level deeper
// inside an array — the most natural way to call them. Every position that rejects a plain
// string must reject these, or the catalog rule is advisory.
const TEMPLATE_AND_ARRAY_SPELLINGS = [
  "import RequirePermission from '@/components/require-permission';",
  "import useCan from '@/hooks/use-can';",
  '',
  'type Gate = {',
  '  can: (permission: string) => boolean;',
  '  canAll: (permissions: string[]) => boolean;',
  '  canAny: (permissions: string[]) => boolean;',
  '};',
  '',
  'export default function Probe({ gate }: { gate: Gate }): JSX.Element {',
  '  const a = useCan(`contact:read`);',
  '  const b = gate.can(`contact:read`);',
  "  const c = gate.canAll(['contact:read', `deal:write`]);",
  '  const d = gate.canAny([`contact:read`]);',
  '  return (',
  '    <RequirePermission permission={`contact:read`}>',
  '      <p>{[a, b, c, d].join()}</p>',
  '    </RequirePermission>',
  '  );',
  '}',
  '',
].join('\n');

// Route meta names its permission as an object key, spelled bare or quoted.
const ROUTE_META_SPELLINGS = [
  'export const routes = [',
  "  { path: '/contacts', meta: { permission: 'contact:read' } },",
  "  { path: '/deals', meta: { permission: `deal:read` } },",
  "  { path: '/reports', meta: { 'permission': 'report:read' } },",
  '];',
  '',
  'export default routes;',
  '',
].join('\n');

const ACCESS_LAYER_MODULE = `import type { Permission } from '@/lib/types/access/permission';
import type { Principal } from '@/lib/types/access/principal';

export class Probe {
  public check(principal: Principal, permission: Permission): boolean {
    return principal.permissions.includes(permission) || principal.roles.includes('admin');
  }
}

export default new Probe();
`;

// The fixtures must live under src/ for the flat-config globs and the tsconfig project to
// apply, so they cannot go to a temp dir. Sweep defensively in case a run is interrupted
// between the write and the finally.
const FIXTURE_PATHS = [
  `src/components/${probe}.tsx`,
  `src/components/${probe}-bypass.tsx`,
  `src/components/${probe}-cruise/index.tsx`,
  `src/hooks/use-${probe}.ts`,
  `src/lib/access/${probe}.ts`,
  `src/hooks/use-access-${probe}.ts`,
  `src/routes/${probe}-meta.ts`,
];
const [
  ESLINT_FIXTURE,
  BYPASS_FIXTURE,
  CRUISE_FIXTURE,
  HOOK_FIXTURE,
  LAYER_FIXTURE,
  SEAM_LOOKALIKE_FIXTURE,
  META_FIXTURE,
] = FIXTURE_PATHS;

const sweepFixtures = (): void => {
  FIXTURE_PATHS.forEach((relative) => {
    const absolute = path.join(repoRoot, relative);
    fs.rmSync(absolute, { force: true });
    const parent = path.dirname(absolute);
    if (parent.endsWith('-cruise') && fs.existsSync(parent)) fs.rmdirSync(parent);
  });
};

beforeAll(sweepFixtures);
afterAll(sweepFixtures);

describe('access-control ESLint gate (issue #114)', () => {
  it('rejects raw permission strings and ad-hoc role checks outside the access layer', () => {
    const messages = authorizationMessages(lint(ESLINT_FIXTURE, GATED_COMPONENT));

    expect(messages).toHaveLength(3);
    expect(messages.every((message) => message.ruleId === 'no-restricted-syntax')).toBe(true);
    expect(messages.filter((m) => m.message.includes('No raw permission strings'))).toHaveLength(1);
    expect(
      messages.filter((m) => m.message.includes('No ad-hoc role/permission membership checks'))
    ).toHaveLength(2);
  });

  it('catches every membership spelling, not just the obvious one', () => {
    const messages = authorizationMessages(lint(BYPASS_FIXTURE, BYPASS_ATTEMPTS));

    // Exactly one per bypass line: includes (member, destructured, computed, optional and
    // computed-method), some, find, indexOf, lastIndexOf, filter, every, findIndex,
    // findLast, findLastIndex, at, three `.has()`-ed Set wrappers and two bare index reads.
    // Counting one per line — not "at least" — also pins that a single decision is reported
    // once, so a developer is never sent chasing two findings for one fix.
    const membership = messages.filter((m) =>
      m.message.includes('No ad-hoc role/permission membership')
    );
    expect(membership).toHaveLength(20);
    expect(new Set(membership.map((m) => m.line)).size).toBe(20);
    // A severity downgrade would leave every count above green while the gate stopped
    // failing the build, so pin it: 2 is ESLint's `error`.
    expect(membership.every((m) => m.severity === 2)).toBe(true);
    expect(
      messages.filter((m) => m.message.includes('No raw permission strings on a permission prop'))
    ).toHaveLength(1);
  });

  it('rejects template-literal permissions and the array arguments of canAll/canAny', () => {
    const messages = authorizationMessages(lint(BYPASS_FIXTURE, TEMPLATE_AND_ARRAY_SPELLINGS));

    // useCan(`…`), gate.can(`…`), both elements of canAll([…]) and the one in canAny([…]).
    const callSites = messages.filter((m) => m.message.includes('No raw permission strings at'));
    expect(callSites).toHaveLength(5);
    expect(callSites.every((m) => m.severity === 2)).toBe(true);
    expect(
      messages.filter((m) => m.message.includes('No raw permission strings on a permission prop'))
    ).toHaveLength(1);
  });

  it('rejects a route-meta permission spelled bare, quoted or as a template literal', () => {
    const messages = authorizationMessages(lint(META_FIXTURE, ROUTE_META_SPELLINGS));

    const meta = messages.filter((m) => m.message.includes('No raw permission strings in route'));
    expect(meta).toHaveLength(3);
    expect(new Set(meta.map((m) => m.line)).size).toBe(3);
    expect(meta.every((m) => m.severity === 2)).toBe(true);
  });

  it('leaves plain reads alone: rendering a principal is not an authorization decision', () => {
    const messages = authorizationMessages(lint(BYPASS_FIXTURE, ALLOWED_READS));

    expect(messages).toEqual([]);
  });

  it('exempts the access layer itself, which is where the decisions are made', () => {
    const messages = authorizationMessages(lint(LAYER_FIXTURE, ACCESS_LAYER_MODULE));

    expect(messages).toEqual([]);
  });
});

describe('access-control dependency-cruiser boundaries (issue #114)', () => {
  it('rejects a shared component that resolves an access service or writes the state', () => {
    const violations = cruise({
      [CRUISE_FIXTURE]: `import accessState from '@/lib/access/access-state';
import permissionService from '@/services/access/permission-service';

export default function GateProbe(): JSX.Element {
  accessState.setActiveTenant('forged-tenant');
  return <p>{String(permissionService.can)}</p>;
}
`,
    });

    expect(violations).toContain('no-ui-to-access-services');
    expect(violations).toContain('no-ui-to-access-state');
  });

  it('rejects a hook that reaches past the seam into an access service', () => {
    const violations = cruise({
      [HOOK_FIXTURE]: [
        "import permissionService from '@/services/access/permission-service';",
        '',

        'export default function useGateProbe(): boolean {',
        "  return typeof permissionService.can === 'function';",
        '}',
      ].join('\n'),
    });

    expect(violations).toContain('no-ui-to-access-services');
  });

  // The read seam is two named files, not a naming convention: a hook merely *called*
  // `use-access-…` must not inherit their exemption and write the store unaudited.
  it('rejects a hook that only looks like the read seam writing the access state', () => {
    const violations = cruise({
      [SEAM_LOOKALIKE_FIXTURE]: [
        "import accessState from '@/lib/access/access-state';",
        '',
        'export default function useAccessProbe(): void {',
        "  accessState.setActiveTenant('forged-tenant');",
        '}',
      ].join('\n'),
    });

    expect(violations).toContain('no-ui-to-access-state');
  });

  it('rejects the paint-safe domain importing the container or a feature module', () => {
    const violations = cruise({
      [LAYER_FIXTURE]: `import { injectable } from 'tsyringe';

import ApiError from '@/modules/user';
import permissionService from '@/services/access/permission-service';

@injectable()
export class GateProbe {
  public probe(): boolean {
    return typeof permissionService.can === 'function' && typeof ApiError === 'function';
  }
}
`,
    });

    expect(violations).toContain('no-access-domain-to-container');
    expect(violations).toContain('no-access-domain-to-tsyringe');
    expect(violations).toContain('no-access-layer-to-modules');
  });

  it('accepts the sanctioned seam: a component consuming the access hooks', () => {
    const violations = cruise({
      [CRUISE_FIXTURE]: `import useCan from '@/hooks/use-can';
import { PERMISSIONS } from '@/lib/access/permission-catalog';

export default function GateProbe(): JSX.Element {
  return <p>{String(useCan(PERMISSIONS.contactRead))}</p>;
}
`,
    });

    expect(violations).toEqual([]);
  });
});

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
  const entries = Object.entries(fixtures);
  const written = entries.map(([relative]) => path.join(repoRoot, relative));
  entries.forEach(([relative, source]) => {
    const absolute = path.join(repoRoot, relative);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, source, 'utf8');
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

const GATED_COMPONENT = `import useCanMutate from '@/hooks/use-can-mutate';
import type { Principal } from '@/lib/types/access/principal';

export default function Probe({ principal }: { principal: Principal }): JSX.Element {
  const allowed = useCanMutate('createUser');
  const elevated = principal.allowedMutations.includes('archiveUser');
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
const BYPASS_ATTEMPTS = `import RequireMutation from '@/components/require-mutation';
import type { Principal } from '@/lib/types/access/principal';

export default function Probe({ principal }: { principal: Principal }): JSX.Element {
  const { allowedMutations, roles } = principal;
  const a = allowedMutations.includes('archiveUser');
  const b = roles.includes('admin');
  const c = principal['allowedMutations'].includes('archiveUser');
  const d = principal?.allowedMutations.includes('createUser');
  const e = principal.allowedMutations.some((p) => p === 'createUser');
  const f = principal.roles.find((r) => r === 'admin') !== undefined;
  const g = principal.roles.indexOf('admin') !== -1;
  const h = principal.allowedMutations.filter((p) => p === 'createUser').length > 0;
  const i = new Set(principal.allowedMutations).has('archiveUser');
  const j = principal.roles[0] === 'admin';
  const k = roles[0] === 'admin';
  const l = principal.roles.every((r) => r === 'admin');
  const m = principal.allowedMutations.findIndex((p) => p === 'createUser') !== -1;
  const n = principal.roles.at(0) === 'admin';
  const o = principal.roles.findLast((r) => r === 'admin') !== undefined;
  const q = principal.allowedMutations.findLastIndex((p) => p === 'createUser') !== -1;
  const s = principal.roles.lastIndexOf('admin') !== -1;
  const t = principal.allowedMutations['includes']('archiveUser');
  const u = new Set(roles).has('admin');
  const v = new Set(principal['roles']).has('admin');
  return (
    <RequireMutation mutation={'createUser'}>
      <p>{\`\${a}\${b}\${c}\${d}\${e}\${f}\${g}\${h}\${i}\${j}\${k}\${l}\${m}\${n}\`}</p>
      <p>{\`\${o}\${q}\${s}\${t}\${u}\${v}\`}</p>
    </RequireMutation>
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
  const count = principal.allowedMutations.length;
  return <p>{\`\${distinct}\${listed}\${count}\`}</p>;
}
`;

// Backticks are quotes too, an array argument hides its keys one level deeper, and a computed
// method name (`gate['can']`) is the same call spelled to dodge an identifier match. Every
// position that rejects a plain string must reject these, or the catalogue rule is advisory.
const TEMPLATE_AND_ARRAY_SPELLINGS = [
  "import RequireMutation from '@/components/require-mutation';",
  "import useCanMutate from '@/hooks/use-can-mutate';",
  '',
  'type Gate = {',
  '  can: (mutation: string | string[]) => boolean;',
  '};',
  '',
  'export default function Probe({ gate }: { gate: Gate }): JSX.Element {',
  '  const a = useCanMutate(`createUser`);',
  '  const b = gate.can(`createUser`);',
  "  const c = gate.can(['createUser', `archiveUser`]);",
  "  const d = gate['can']('createUser');",
  '  return (',
  '    <RequireMutation mutation={`createUser`}>',
  '      <p>{[a, b, c, d].join()}</p>',
  '    </RequireMutation>',
  '  );',
  '}',
  '',
].join('\n');

const ACCESS_LAYER_MODULE = `import type { MutationKey } from '@/lib/types/access/mutation-access';
import type { Principal } from '@/lib/types/access/principal';

export class Probe {
  public check(principal: Principal, mutation: MutationKey): boolean {
    return principal.allowedMutations.includes(mutation) || principal.roles.includes('admin');
  }
}

export default new Probe();
`;

// The fixtures must live under src/ for the flat-config globs and the tsconfig project to
// apply, so they cannot go to a temp dir. Sweep defensively in case a run is interrupted
// between the write and the finally.
const ESLINT_FIXTURE = `src/components/${probe}.tsx`;
const BYPASS_FIXTURE = `src/components/${probe}-bypass.tsx`;
const CRUISE_FIXTURE = `src/components/${probe}-cruise/index.tsx`;
const HOOK_FIXTURE = `src/hooks/use-${probe}.ts`;
const LAYER_FIXTURE = `src/lib/access/${probe}.ts`;
const SEAM_LOOKALIKE_FIXTURE = `src/hooks/use-access-${probe}.ts`;
const FIXTURE_PATHS = [
  ESLINT_FIXTURE,
  BYPASS_FIXTURE,
  CRUISE_FIXTURE,
  HOOK_FIXTURE,
  LAYER_FIXTURE,
  SEAM_LOOKALIKE_FIXTURE,
];

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
  it('rejects raw mutation keys and ad-hoc role checks outside the access layer', () => {
    const messages = authorizationMessages(lint(ESLINT_FIXTURE, GATED_COMPONENT));

    expect(messages).toHaveLength(3);
    expect(messages.every((message) => message.ruleId === 'no-restricted-syntax')).toBe(true);
    expect(messages.filter((m) => m.message.includes('No raw mutation keys'))).toHaveLength(1);
    expect(
      messages.filter((m) => m.message.includes('No ad-hoc role/mutation membership checks'))
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
      m.message.includes('No ad-hoc role/mutation membership')
    );
    expect(membership).toHaveLength(20);
    expect(new Set(membership.map((m) => m.line)).size).toBe(20);
    // A severity downgrade would leave every count above green while the gate stopped
    // failing the build, so pin it: 2 is ESLint's `error`.
    expect(membership.every((m) => m.severity === 2)).toBe(true);
    expect(
      messages.filter((m) => m.message.includes('No raw mutation keys on a mutation prop'))
    ).toHaveLength(1);
  });

  it('rejects template-literal mutation keys and the array argument of can()', () => {
    const messages = authorizationMessages(lint(BYPASS_FIXTURE, TEMPLATE_AND_ARRAY_SPELLINGS));

    // useCanMutate(`…`), gate.can(`…`), both elements of gate.can([…]) and the computed
    // spelling gate['can'](…).
    const callSites = messages.filter((m) => m.message.includes('No raw mutation keys at'));
    expect(callSites).toHaveLength(5);
    expect(new Set(callSites.map((m) => m.line)).size).toBe(4);
    expect(callSites.every((m) => m.severity === 2)).toBe(true);
    expect(
      messages.filter((m) => m.message.includes('No raw mutation keys on a mutation prop'))
    ).toHaveLength(1);
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
import mutationAccessService from '@/services/access/mutation-access-service';

export default function GateProbe(): JSX.Element {
  accessState.setActiveTenant('forged-tenant');
  return <p>{String(mutationAccessService.can)}</p>;
}
`,
    });

    expect(violations).toContain('no-ui-to-access-services');
    expect(violations).toContain('no-ui-to-access-state');
  });

  it('rejects a hook that reaches past the seam into an access service', () => {
    const violations = cruise({
      [HOOK_FIXTURE]: [
        "import mutationAccessService from '@/services/access/mutation-access-service';",
        '',

        'export default function useGateProbe(): boolean {',
        "  return typeof mutationAccessService.can === 'function';",
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
import mutationAccessService from '@/services/access/mutation-access-service';

@injectable()
export class GateProbe {
  public probe(): boolean {
    return typeof mutationAccessService.can === 'function' && typeof ApiError === 'function';
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
      [CRUISE_FIXTURE]: `import useCanMutate from '@/hooks/use-can-mutate';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';

export default function GateProbe(): JSX.Element {
  return <p>{String(useCanMutate(MUTATION_KEYS.createUser))}</p>;
}
`,
    });

    expect(violations).toEqual([]);
  });
});

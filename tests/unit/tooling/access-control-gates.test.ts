import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

type EslintMessage = { ruleId: string | null; message: string };
type EslintResult = { messages: EslintMessage[] };

type CruiseReport = { summary?: { violations?: { rule: { name: string } }[] } };

const repoRoot = path.resolve(__dirname, '../../..');
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
    return (report.summary?.violations ?? []).map((violation) => violation.rule.name);
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

// The obvious spellings are not the only ones: destructuring the principal, indexing it
// with a computed key, or wrapping the permission in an expression container all name the
// same thing. A gate that misses them is a gate in name only.
const BYPASS_ATTEMPTS = `import RequirePermission from '@/components/require-permission';
import type { Principal } from '@/lib/types/access/principal';

export default function Probe({ principal }: { principal: Principal }): JSX.Element {
  const { permissions, roles } = principal;
  const elevated = permissions.includes('contact:manage-all');
  const admin = roles.includes('admin');
  const computed = principal['permissions'].includes('deal:write');
  return (
    <RequirePermission permission={'contact:read'}>
      <p>{\`\${elevated}\${admin}\${computed}\`}</p>
    </RequirePermission>
  );
}
`;

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
  'src/components/gate-probe.tsx',
  'src/components/bypass-probe.tsx',
  'src/components/cruise-probe/index.tsx',
  'src/hooks/use-gate-probe.ts',
  'src/lib/access/gate-probe.ts',
];

const sweepFixtures = (): void => {
  FIXTURE_PATHS.forEach((relative) => {
    const absolute = path.join(repoRoot, relative);
    fs.rmSync(absolute, { force: true });
    const parent = path.dirname(absolute);
    if (parent.endsWith('cruise-probe') && fs.existsSync(parent)) fs.rmdirSync(parent);
  });
};

beforeAll(sweepFixtures);
afterAll(sweepFixtures);

describe('access-control ESLint gate (issue #114)', () => {
  it('rejects raw permission strings and ad-hoc role checks outside the access layer', () => {
    const messages = authorizationMessages(lint('src/components/gate-probe.tsx', GATED_COMPONENT));

    expect(messages).toHaveLength(3);
    expect(messages.every((message) => message.ruleId === 'no-restricted-syntax')).toBe(true);
    expect(messages.filter((m) => m.message.includes('No raw permission strings'))).toHaveLength(1);
    expect(
      messages.filter((m) => m.message.includes('No ad-hoc role/permission membership checks'))
    ).toHaveLength(2);
  });

  it('catches the destructured, computed and expression-container spellings too', () => {
    const messages = authorizationMessages(
      lint('src/components/bypass-probe.tsx', BYPASS_ATTEMPTS)
    );

    expect(
      messages.filter((m) => m.message.includes('No ad-hoc role/permission membership checks'))
    ).toHaveLength(3);
    expect(
      messages.filter((m) => m.message.includes('No raw permission strings on a permission prop'))
    ).toHaveLength(1);
  });

  it('exempts the access layer itself, which is where the decisions are made', () => {
    const messages = authorizationMessages(
      lint('src/lib/access/gate-probe.ts', ACCESS_LAYER_MODULE)
    );

    expect(messages).toEqual([]);
  });
});

describe('access-control dependency-cruiser boundaries (issue #114)', () => {
  it('rejects a shared component that resolves an access service or writes the state', () => {
    const violations = cruise({
      'src/components/cruise-probe/index.tsx': `import accessState from '@/lib/access/access-state';
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
      'src/hooks/use-gate-probe.ts': [
        "import permissionService from '@/services/access/permission-service';",
        '',

        'export default function useGateProbe(): boolean {',
        "  return typeof permissionService.can === 'function';",
        '}',
      ].join('\n'),
    });

    expect(violations).toContain('no-ui-to-access-services');
  });

  it('rejects the paint-safe domain importing the container or a feature module', () => {
    const violations = cruise({
      'src/lib/access/gate-probe.ts': `import { injectable } from 'tsyringe';

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
      'src/components/cruise-probe/index.tsx': `import useCan from '@/hooks/use-can';
import { PERMISSIONS } from '@/lib/access/permission-catalog';

export default function GateProbe(): JSX.Element {
  return <p>{String(useCan(PERMISSIONS.contactRead))}</p>;
}
`,
    });

    expect(violations).toEqual([]);
  });
});

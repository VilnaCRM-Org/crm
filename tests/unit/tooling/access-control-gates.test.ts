import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

type ForbiddenRule = {
  name: string;
  severity: string;
  from: { path: string | string[] };
  to: { path: string | string[] };
};

type DepcruiseConfig = { forbidden: ForbiddenRule[] };

type EslintMessage = { ruleId: string | null; message: string };
type EslintResult = { messages: EslintMessage[] };

const repoRoot = path.resolve(__dirname, '../../..');
const eslintBin = path.join(repoRoot, 'node_modules/eslint/bin/eslint.js');

const depcruise = require('../../../.dependency-cruiser.js') as DepcruiseConfig;

const ruleNamed = (name: string): ForbiddenRule =>
  depcruise.forbidden.find((candidate) => candidate.name === name) as ForbiddenRule;

const matchesAny = (pattern: string | string[], value: string): boolean =>
  (Array.isArray(pattern) ? pattern : [pattern]).some((entry) => new RegExp(entry).test(value));

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
    const output = (error as { stdout?: string }).stdout ?? '';
    const results = JSON.parse(output) as EslintResult[];
    return results.flatMap((result) => result.messages);
  } finally {
    fs.rmSync(absolute, { force: true });
  }
};

const authorizationMessages = (messages: EslintMessage[]): EslintMessage[] =>
  messages.filter((message) => message.message.includes('(issue #114)'));

const GATED_COMPONENT = `import useCan from '@/hooks/use-can';
import type { Principal } from '@/lib/types/access/principal';

export default function Probe({ principal }: { principal: Principal }): JSX.Element {
  const allowed = useCan('contact:read');
  const elevated = principal.permissions.includes('contact:manage-all');
  const admin = principal.roles.includes('admin');
  return <p>{\`\${allowed}\${elevated}\${admin}\`}</p>;
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

  it('exempts the access layer itself, which is where the decisions are made', () => {
    const messages = authorizationMessages(
      lint('src/lib/access/gate-probe.ts', ACCESS_LAYER_MODULE)
    );

    expect(messages).toEqual([]);
  });
});

describe('access-control dependency-cruiser boundaries (issue #114)', () => {
  it('forbids UI layers from resolving the injectable access services', () => {
    const rule = ruleNamed('no-ui-to-access-services');

    expect(rule.severity).toBe('error');
    expect(matchesAny(rule.from.path, 'src/components/require-permission/index.tsx')).toBe(true);
    expect(matchesAny(rule.from.path, 'src/routes/permission-route.tsx')).toBe(true);
    expect(matchesAny(rule.to.path, 'src/services/access/permission-service.ts')).toBe(true);
    // The React seam and the dependency-free domain stay reachable from the UI.
    expect(matchesAny(rule.to.path, 'src/lib/access/access-core.ts')).toBe(false);
    expect(matchesAny(rule.to.path, 'src/hooks/use-can.ts')).toBe(false);
  });

  it('forbids the access layer from depending on a feature module', () => {
    const rule = ruleNamed('no-access-layer-to-modules');

    expect(rule.severity).toBe('error');
    expect(matchesAny(rule.from.path, 'src/lib/access/access-core.ts')).toBe(true);
    expect(matchesAny(rule.from.path, 'src/services/access/di.ts')).toBe(true);
    expect(matchesAny(rule.to.path, 'src/modules/user/features/auth/stores/index.ts')).toBe(true);
    expect(matchesAny(rule.to.path, 'src/services/observability/observability-core.ts')).toBe(
      false
    );
  });
});

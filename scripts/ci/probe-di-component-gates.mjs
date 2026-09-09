// Issue #128 gate probe. Proves the two DI-bridge gates still fire on a violating fixture and
// stay silent on each documented carve-out, so neither can rot into a vacuous pass. Runs as a
// child process because both tools load ESM (ESLint dynamically imports the flat config,
// dependency-cruiser ships as ESM) and the Jest CJS runner cannot do that. Emits JSON on stdout.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cruise } from 'dependency-cruiser';
import { ESLint } from 'eslint';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(repoRoot, 'package.json'));
const depcruiseConfig = require(path.join(repoRoot, '.dependency-cruiser.js'));

const NEW_BEHAVIORAL_CLASS = `class Thing {
  public run(): string {
    return 'x';
  }
}
export default function Probe(): JSX.Element {
  const thing = new Thing();
  return <span>{thing.run()}</span>;
}`;

const NEW_BUILTINS = `export default function Probe(): JSX.Element {
  const at = new Date();
  const url = new URL('https://example.com');
  const seen = new Map<string, number>();
  const boom = new Error('nope');
  return <span>{[at, url, seen, boom].length}</span>;
}`;

const NEW_IN_HOOK = `class Thing {
  public run(): string {
    return 'x';
  }
}
export default function useThing(): Thing {
  return new Thing();
}`;

const ESLINT_FIXTURES = {
  component: { code: NEW_BEHAVIORAL_CLASS, filePath: 'src/components/fixture.tsx' },
  builtins: { code: NEW_BUILTINS, filePath: 'src/components/fixture.tsx' },
  authCarveOut: {
    code: NEW_BEHAVIORAL_CLASS,
    filePath: 'src/modules/user/features/auth/components/fixture.tsx',
  },
  routeShellCarveOut: { code: NEW_BEHAVIORAL_CLASS, filePath: 'src/routes/route-composer.tsx' },
  routeShellOtherFile: { code: NEW_BEHAVIORAL_CLASS, filePath: 'src/routes/fixture.tsx' },
  appEntrypointCarveOut: { code: NEW_BEHAVIORAL_CLASS, filePath: 'src/index.tsx' },
  rootErrorBoundaryCarveOut: {
    code: NEW_BEHAVIORAL_CLASS,
    filePath: 'src/components/error-boundary/app-error-boundary.tsx',
  },
  errorBoundaryDescendant: {
    code: NEW_BEHAVIORAL_CLASS,
    filePath: 'src/components/error-boundary/error-fallback.tsx',
  },
  story: { code: NEW_BEHAVIORAL_CLASS, filePath: 'src/components/fixture.stories.tsx' },
  test: { code: NEW_BEHAVIORAL_CLASS, filePath: 'src/components/fixture.test.tsx' },
  hook: { code: NEW_IN_HOOK, filePath: 'src/hooks/use-thing.ts' },
};

// `parserOptions.project` is dropped for the virtual fixtures: ESLint never reads them from disk
// (lintText carries the source), and the type-aware parser rejects a path outside the program.
// Only the syntactic no-restricted-syntax gate under test depends on this config.
const eslintGateErrors = async () => {
  const eslint = new ESLint({
    cwd: repoRoot,
    overrideConfigFile: path.join(repoRoot, 'eslint.config.mjs'),
    overrideConfig: {
      languageOptions: { parserOptions: { project: null, projectService: false } },
    },
  });
  const entries = await Promise.all(
    Object.entries(ESLINT_FIXTURES).map(async ([name, { code, filePath }]) => {
      const [result] = await eslint.lintText(code, { filePath, warnIgnored: false });
      const messages = (result?.messages ?? [])
        .filter((message) => message.severity === 2 && message.message.includes('issue #128'))
        .map((message) => message.message);
      return [name, messages];
    })
  );
  return Object.fromEntries(entries);
};

const SERVICE_FILES = {
  'src/services/thing.ts': 'export default class Thing {\n  public run(): void {}\n}\n',
};
const BRIDGE_FILES = {
  'src/providers/di/use-service.ts': 'export default function useService(): void {}\n',
};

const componentImporting = (statement) =>
  `${statement}\n\nexport default function Widget(): JSX.Element {\n  return <span>widget</span>;\n}\n`;

const DEPCRUISE_FIXTURES = {
  valueImport: {
    files: {
      ...SERVICE_FILES,
      'src/components/widget.tsx': componentImporting("import Thing from '../services/thing';"),
    },
  },
  typeImport: {
    files: {
      ...SERVICE_FILES,
      'src/components/widget.tsx': componentImporting(
        "import type Thing from '../services/thing';"
      ),
    },
  },
  authCarveOut: {
    files: {
      ...SERVICE_FILES,
      'src/modules/user/features/auth/components/widget.tsx': componentImporting(
        "import Thing from '../../../../../services/thing';"
      ),
    },
  },
  authImportsBridge: {
    files: {
      ...BRIDGE_FILES,
      'src/modules/user/features/auth/components/widget.tsx': componentImporting(
        "import useService from '../../../../../providers/di/use-service';"
      ),
    },
  },
  authReachesBridgeIndirectly: {
    files: {
      ...BRIDGE_FILES,
      'src/components/shared.tsx': componentImporting(
        "import useService from '../providers/di/use-service';"
      ),
      'src/modules/user/features/auth/components/widget.tsx': componentImporting(
        "import Shared from '../../../../../components/shared';"
      ),
    },
  },
  eagerShellImportsBridge: {
    files: {
      ...BRIDGE_FILES,
      'src/app.tsx': componentImporting("import useService from './providers/di/use-service';"),
    },
  },
  lazyRouteReachesBridge: {
    files: {
      ...BRIDGE_FILES,
      'src/pages/dashboard.tsx': componentImporting(
        "import useService from '../providers/di/use-service';"
      ),
      'src/routes/routes.tsx':
        "const load = () => import('../pages/dashboard');\n\n" +
        'export default function Routes(): JSX.Element {\n  void load;\n  ' +
        'return <span>routes</span>;\n}\n',
    },
  },
  rootErrorBoundaryCarveOut: {
    files: {
      ...SERVICE_FILES,
      'src/components/error-boundary/app-error-boundary.tsx': componentImporting(
        "import Thing from '../../services/thing';"
      ),
    },
  },
  errorBoundaryDescendant: {
    files: {
      ...SERVICE_FILES,
      'src/components/error-boundary/error-fallback.tsx': componentImporting(
        "import Thing from '../../services/thing';"
      ),
    },
  },
};

// `tsConfig` names a cwd-relative tsconfig whose baseUrl/paths would let a fixture import resolve
// out of the sandbox into the real src/. dependency-cruiser merges ruleSet.options back into the
// cruise options, so it must be stripped from both. Fixtures import relatively for that reason.
const { tsConfig, ...cruiseOptions } = depcruiseConfig.options;
const fixtureRuleSet = { ...depcruiseConfig, options: cruiseOptions };

const firedRules = async (baseDir) => {
  const result = await cruise(['src'], {
    ...cruiseOptions,
    baseDir,
    validate: true,
    ruleSet: fixtureRuleSet,
    outputType: 'json',
  });
  const output = typeof result.output === 'string' ? JSON.parse(result.output) : result.output;
  return [...new Set(output.summary.violations.map((violation) => violation.rule.name))].sort();
};

const root = mkdtempSync(path.join(os.tmpdir(), 'di-component-gate-fixtures-'));
let depcruise;
try {
  for (const [name, fixture] of Object.entries(DEPCRUISE_FIXTURES)) {
    for (const [relativePath, content] of Object.entries(fixture.files)) {
      const absolute = path.join(root, name, relativePath);
      mkdirSync(path.dirname(absolute), { recursive: true });
      writeFileSync(absolute, content);
    }
  }
  const names = Object.keys(DEPCRUISE_FIXTURES);
  const fired = await Promise.all(names.map((name) => firedRules(path.join(root, name))));
  depcruise = Object.fromEntries(names.map((name, index) => [name, fired[index]]));
} finally {
  rmSync(root, { recursive: true, force: true });
}

process.stdout.write(JSON.stringify({ eslint: await eslintGateErrors(), depcruise }));

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { ActionType, NodePlopAPI } from 'plop';

export interface ModuleShape {
  version: number;
  namePattern: string;
  locales: string[];
  module: { allowedFolders: string[] };
  feature: { allowedFolders: string[] };
  tests: {
    rootAllowedFolders: string[];
    moduleAllowedFolders: string[];
    featureAllowedFolders: string[];
  };
}

export interface ScaffoldFile {
  template: string;
  path: string;
}

export interface RegistrarBinding {
  module: string;
  feature: string;
  tokens: string;
  tokenBase: string;
}

export const MODULE_FILES: ScaffoldFile[] = [
  { template: 'module/package.json.hbs', path: 'src/modules/{{module}}/package.json' },
  { template: 'module/README.md.hbs', path: 'src/modules/{{module}}/README.md' },
  { template: 'module/index.ts.hbs', path: 'src/modules/{{module}}/index.ts' },
  { template: 'module/config/tokens.ts.hbs', path: 'src/modules/{{module}}/config/tokens.ts' },
  { template: 'module/config/di.ts.hbs', path: 'src/modules/{{module}}/config/di.ts' },
];

const FEATURE_ROOT = 'src/modules/{{module}}/features/{{feature}}';
const UNIT_ROOT = 'tests/unit/modules/{{module}}/features/{{feature}}';
const E2E_ROOT = 'tests/e2e/modules/{{module}}/features/{{feature}}';

export const FEATURE_FILES: ScaffoldFile[] = [
  { template: 'feature/index.tsx.hbs', path: `${FEATURE_ROOT}/index.tsx` },
  {
    template: 'feature/components/panel.tsx.hbs',
    path: `${FEATURE_ROOT}/components/{{feature}}-panel/index.tsx`,
  },
  { template: 'feature/hooks/index.ts.hbs', path: `${FEATURE_ROOT}/hooks/index.ts` },
  {
    template: 'feature/hooks/use-feature.ts.hbs',
    path: `${FEATURE_ROOT}/hooks/use-{{feature}}.ts`,
  },
  { template: 'feature/i18n/en.json.hbs', path: `${FEATURE_ROOT}/i18n/en.json` },
  { template: 'feature/i18n/uk.json.hbs', path: `${FEATURE_ROOT}/i18n/uk.json` },
  { template: 'feature/repositories/index.ts.hbs', path: `${FEATURE_ROOT}/repositories/index.ts` },
  {
    template: 'feature/repositories/repository-impl.ts.hbs',
    path: `${FEATURE_ROOT}/repositories/{{feature}}-repository-impl.ts`,
  },
  { template: 'feature/routes/index.ts.hbs', path: `${FEATURE_ROOT}/routes/index.ts` },
  { template: 'feature/stores/index.ts.hbs', path: `${FEATURE_ROOT}/stores/index.ts` },
  {
    template: 'feature/types/repository.ts.hbs',
    path: `${FEATURE_ROOT}/types/{{feature}}-repository.ts`,
  },
  {
    template: 'feature/types/components/panel.ts.hbs',
    path: `${FEATURE_ROOT}/types/components/{{feature}}-panel.ts`,
  },
  {
    template: 'feature/types/hooks/use-feature.ts.hbs',
    path: `${FEATURE_ROOT}/types/hooks/use-{{feature}}.ts`,
  },
  {
    template: 'tests/unit/use-feature.test.ts.hbs',
    path: `${UNIT_ROOT}/hooks/use-{{feature}}.test.ts`,
  },
  {
    template: 'tests/unit/repository-impl.test.ts.hbs',
    path: `${UNIT_ROOT}/repositories/{{feature}}-repository-impl.test.ts`,
  },
  { template: 'tests/e2e/feature.spec.ts.hbs', path: `${E2E_ROOT}/{{feature}}.spec.ts` },
];

const FILLED_MODULE_FOLDERS = ['config', 'features'];
const FILLED_FEATURE_FOLDERS = [
  'components',
  'hooks',
  'i18n',
  'repositories',
  'routes',
  'stores',
  'types',
];

const MAX_LINE_LENGTH = 100;
const LINTABLE = ['.ts', '.tsx'];

export function loadModuleShape(root: string = process.cwd()): ModuleShape {
  const raw = readFileSync(join(root, 'config', 'module-shape.json'), 'utf8');
  return JSON.parse(raw) as ModuleShape;
}

export function placeholderFolders(allowed: string[], filled: string[]): string[] {
  return allowed.filter((folder) => !filled.includes(folder));
}

export function fillPath(template: string, module: string, feature: string): string {
  return template.split('{{module}}').join(module).split('{{feature}}').join(feature);
}

export function modulePaths(shape: ModuleShape, module: string, feature: string): string[] {
  const files = MODULE_FILES.map((file) => fillPath(file.path, module, feature));
  const folders = placeholderFolders(shape.module.allowedFolders, FILLED_MODULE_FOLDERS);
  return [...files, ...folders.map((folder) => `src/modules/${module}/${folder}/.gitignore`)];
}

export function featurePaths(shape: ModuleShape, module: string, feature: string): string[] {
  const files = FEATURE_FILES.map((file) => fillPath(file.path, module, feature));
  const folders = placeholderFolders(shape.feature.allowedFolders, FILLED_FEATURE_FOLDERS);
  const root = fillPath(FEATURE_ROOT, module, feature);
  return [...files, ...folders.map((folder) => `${root}/${folder}/.gitignore`)];
}

export function addTokenEntry(source: string, tokenBase: string): string {
  if (source.includes(`${tokenBase}: Symbol(`)) {
    return source;
  }
  const anchor = /^(const [A-Z0-9_]+_TOKENS = Object\.freeze\(\{\n)/m;
  if (!anchor.test(source)) {
    throw new Error('config/tokens.ts no longer exposes the generated Object.freeze anchor');
  }
  return source.replace(anchor, `$1  ${tokenBase}: Symbol('${tokenBase}'),\n`);
}

export function addRegistrarBinding(source: string, binding: RegistrarBinding): string {
  const implName = `${binding.tokenBase}Impl`;
  if (source.includes(implName)) {
    return source;
  }
  const lines = source.split('\n');
  const lastImport = lines.map((line) => line.startsWith('import ')).lastIndexOf(true);
  const registerAt = lines.findIndex((line) => line.includes('public register('));
  if (lastImport === -1 || registerAt === -1) {
    throw new Error('config/di.ts no longer exposes the generated import / register anchors');
  }
  const closeAt = lines.findIndex((line, index) => index > registerAt && /^\s*\}\s*$/.test(line));
  if (closeAt === -1) {
    throw new Error('config/di.ts no longer closes register() on a line of its own');
  }
  const call = `container.registerSingleton(${binding.tokens}.${binding.tokenBase}, ${implName});`;
  lines.splice(closeAt, 0, `    ${call}`);
  const from = `@/modules/${binding.module}/features/${binding.feature}/repositories`;
  lines.splice(lastImport + 1, 0, `import { ${implName} } from '${from}';`);
  return lines.join('\n');
}

export function codeownersEntry(source: string, module: string, owner: string): string {
  const prefix = `/src/modules/${module}/`;
  if (source.split('\n').some((entry) => entry.trim().startsWith(prefix))) {
    return source;
  }
  return `${source.replace(/\n*$/, '')}\n${prefix} ${owner}\n`;
}

export function defaultOwner(source: string): string {
  const wildcard = source
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .find((parts) => parts[0] === '*');
  return wildcard?.[1] ?? '';
}

// Feature names are only unique within their module, so an unqualified `/<feature>` URL
// collides across modules and RouteValidator does not check for duplicate paths — it only
// rejects duplicate module ids. Qualify the path with the module unless they are the same.
export function routePath(module: string, feature: string): string {
  return module === feature ? `/${module}` : `/${module}/${feature}`;
}

export function overLongLines(source: string): number[] {
  return source
    .split('\n')
    .map((line, index) => (line.length > MAX_LINE_LENGTH ? index + 1 : 0))
    .filter((line) => line > 0);
}

function writePlaceholder(root: string, relativePath: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, '');
}

function assertLineLength(root: string, paths: string[]): void {
  const offenders = paths
    .filter((path) => LINTABLE.some((extension) => path.endsWith(extension)))
    .flatMap((path) =>
      overLongLines(readFileSync(join(root, path), 'utf8')).map((line) => `${path}:${line}`)
    );
  if (offenders.length > 0) {
    throw new Error(
      `Generated code exceeds the ${MAX_LINE_LENGTH}-character max-len gate:\n  ` +
        `${offenders.join('\n  ')}\nUse a shorter module or feature name and generate again.`
    );
  }
}

async function formatGenerated(root: string, paths: string[]): Promise<void> {
  const absolute = paths.map((path) => join(root, path));
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: root, fix: true });
  const lintable = absolute.filter((path) => LINTABLE.some((ext) => path.endsWith(ext)));
  const results = await eslint.lintFiles(lintable);
  await ESLint.outputFixes(results);

  const unfixed = results.filter((result) => result.errorCount > 0);
  if (unfixed.length > 0) {
    const detail = unfixed
      .flatMap((result) =>
        result.messages
          .filter((message) => message.severity === 2)
          .map((message) => `${result.filePath}:${message.line} ${message.message}`)
      )
      .join('\n  ');
    throw new Error(`Generated code still fails ESLint after --fix:\n  ${detail}`);
  }

  const prettier = await import('prettier');
  await Promise.all(
    absolute.map(async (target) => {
      const info = await prettier.getFileInfo(target, {
        ignorePath: join(root, '.prettierignore'),
      });
      if (!info.inferredParser || info.ignored) {
        return;
      }
      const options = await prettier.resolveConfig(target);
      const formatted = await prettier.format(readFileSync(target, 'utf8'), {
        ...options,
        filepath: target,
      });
      writeFileSync(target, formatted);
    })
  );
}

function assertName(shape: ModuleShape, label: string, value: string): void {
  if (!new RegExp(shape.namePattern).test(value ?? '')) {
    throw new Error(`${label} "${value}" must be lowercase kebab-case (${shape.namePattern})`);
  }
}

function instructions(module: string, feature: string, registrar: string, routes: string): string {
  return [
    '',
    'Two hand-maintained, order-sensitive files were deliberately NOT rewritten.',
    'Add these lines yourself:',
    '',
    '  src/config/dependency-injection-config.ts',
    `    import ${registrar} from '@/modules/${module}/config/di';`,
    `    const registrars: ModuleRegistrar[] = [/* ... */, ${registrar}];`,
    '',
    '  src/routes/registry.ts',
    `    import ${routes} from '@/modules/${module}/features/${feature}/routes';`,
    `    const routeModules: readonly RouteModule[] = [/* ... */, ${routes}];`,
    '',
    `Then drop .fixme from tests/e2e/modules/${module}/features/${feature}/${feature}.spec.ts`,
    'and run: make format && make lint && make test-unit-all',
    '',
  ].join('\n');
}

export default function plopfile(plop: NodePlopAPI): void {
  const root = plop.getPlopfilePath();
  const shape = loadModuleShape(root);
  const codeownersPath = join(root, '.github', 'CODEOWNERS');
  const camel = plop.getHelper('camelCase') as (input: string) => string;
  const pascal = plop.getHelper('pascalCase') as (input: string) => string;
  const constant = plop.getHelper('constantCase') as (input: string) => string;

  plop.setHelper('routePath', (module: string, feature: string) => routePath(module, feature));

  const fileActions = (files: ScaffoldFile[]): ActionType[] =>
    files.map((file) => ({
      type: 'add',
      path: file.path,
      templateFile: join('scripts', 'templates', file.template),
      abortOnFail: true,
    }));

  const writePlaceholders = (paths: string[]): string => {
    const created = paths.filter((path) => path.endsWith('.gitignore'));
    created.forEach((path) => writePlaceholder(root, path));
    return `kept ${created.length} allowed folder(s) with an empty .gitignore`;
  };

  // A half-written scaffold is worse than none: the existence guards would then reject the
  // retry. Anything the run created is rolled back before the failure propagates.
  const rollback = (roots: string[], codeowners: string | null): void => {
    roots
      .map((relative) => join(root, relative))
      .filter((absolute) => existsSync(absolute))
      .forEach((absolute) => rmSync(absolute, { recursive: true, force: true }));
    if (codeowners !== null) {
      writeFileSync(codeownersPath, codeowners);
    }
  };

  const finalize = async (
    module: string,
    feature: string,
    paths: string[],
    undo: { roots: string[]; codeowners: string | null }
  ): Promise<string> => {
    try {
      await formatGenerated(root, paths);
      assertLineLength(root, paths);
    } catch (error) {
      rollback(undo.roots, undo.codeowners);
      throw error;
    }
    const registrar = `${camel(module)}Registrar`;
    const routes = `${camel(feature)}Routes`;
    process.stdout.write(instructions(module, feature, registrar, routes));
    return 'formatted, auto-fixed and length-checked the generated files';
  };

  const guardNames = (data: Record<string, string>): void => {
    assertName(shape, 'Module name', data.module);
    assertName(shape, 'Feature name', data.feature);
  };

  const guardOwner = (owner: string): void => {
    if (!/^@[\w./-]+$/.test(owner ?? '')) {
      throw new Error(
        `CODEOWNERS owner "${owner}" must be an @user or @org/team handle. ` +
          'Pass owner=@handle, or add a `*` owner line to .github/CODEOWNERS.'
      );
    }
  };

  plop.setGenerator('module', {
    description: 'Scaffold a compliant module plus its first feature',
    prompts: [
      { type: 'input', name: 'module', message: 'Module name (kebab-case)' },
      { type: 'input', name: 'feature', message: 'First feature name (kebab-case)' },
      {
        type: 'input',
        name: 'owner',
        message: 'CODEOWNERS owner',
        default: (): string => defaultOwner(readFileSync(codeownersPath, 'utf8')),
      },
    ],
    actions: (answers) => {
      const data = answers as unknown as Record<string, string>;
      guardNames(data);
      guardOwner(data.owner);
      if (existsSync(join(root, 'src', 'modules', data.module))) {
        throw new Error(`src/modules/${data.module} already exists — use \`make new-feature\``);
      }
      const paths = [
        ...modulePaths(shape, data.module, data.feature),
        ...featurePaths(shape, data.module, data.feature),
      ];
      const undo = {
        roots: [
          `src/modules/${data.module}`,
          `tests/unit/modules/${data.module}`,
          `tests/e2e/modules/${data.module}`,
        ],
        codeowners: readFileSync(codeownersPath, 'utf8'),
      };
      return [
        ...fileActions(MODULE_FILES),
        ...fileActions(FEATURE_FILES),
        (): string => writePlaceholders(paths),
        (): string => {
          writeFileSync(codeownersPath, codeownersEntry(undo.codeowners, data.module, data.owner));
          return '.github/CODEOWNERS';
        },
        (): Promise<string> => finalize(data.module, data.feature, paths, undo),
      ];
    },
  });

  plop.setGenerator('feature', {
    description: 'Scaffold a compliant feature inside an existing module',
    prompts: [
      { type: 'input', name: 'module', message: 'Existing module name (kebab-case)' },
      { type: 'input', name: 'feature', message: 'Feature name (kebab-case)' },
    ],
    actions: (answers) => {
      const data = answers as unknown as Record<string, string>;
      guardNames(data);
      const configRoot = join(root, 'src', 'modules', data.module, 'config');
      if (!existsSync(configRoot)) {
        throw new Error(`src/modules/${data.module} is not a scaffolded module`);
      }
      const featureRoot = fillPath(FEATURE_ROOT, data.module, data.feature);
      if (existsSync(join(root, featureRoot))) {
        throw new Error(`${featureRoot} already exists`);
      }
      const binding: RegistrarBinding = {
        module: data.module,
        feature: data.feature,
        tokens: `${constant(data.module)}_TOKENS`,
        tokenBase: `${pascal(data.feature)}Repository`,
      };
      const paths = featurePaths(shape, data.module, data.feature);
      const tokensPath = join(configRoot, 'tokens.ts');
      const diPath = join(configRoot, 'di.ts');
      const config = {
        tokens: readFileSync(tokensPath, 'utf8'),
        di: readFileSync(diPath, 'utf8'),
      };
      const undo = {
        roots: [
          featureRoot,
          `tests/unit/modules/${data.module}/features/${data.feature}`,
          `tests/e2e/modules/${data.module}/features/${data.feature}`,
        ],
        codeowners: null,
      };
      return [
        ...fileActions(FEATURE_FILES),
        (): string => writePlaceholders(paths),
        (): string => {
          writeFileSync(tokensPath, addTokenEntry(config.tokens, binding.tokenBase));
          writeFileSync(diPath, addRegistrarBinding(config.di, binding));
          return `wired ${binding.tokenBase} into src/modules/${data.module}/config`;
        },
        async (): Promise<string> => {
          try {
            return await finalize(
              data.module,
              data.feature,
              [
                ...paths,
                `src/modules/${data.module}/config/tokens.ts`,
                `src/modules/${data.module}/config/di.ts`,
              ],
              undo
            );
          } catch (error) {
            writeFileSync(tokensPath, config.tokens);
            writeFileSync(diPath, config.di);
            throw error;
          }
        },
      ];
    },
  });
}

// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

import {
  AUTH_FORM_CHUNKS,
  authFormsCacheGroup,
  authFormsVendorsCacheGroup,
  RECOVERY_FORM_CHUNKS,
  SETTINGS_CHUNKS,
} from '@scripts/auth-forms-chunk-group';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const readJson = <T>(relativePath: string): T => JSON.parse(readFile(relativePath)) as T;

// Static value-level module edges only: `import type` and an all-`type` specifier list are
// erased, and `import()` is a chunk boundary.
const TYPE_ONLY_SPECIFIERS = /^\{\s*type\s[^,}]+(?:,\s*type\s[^,}]+)*,?\s*\}$/;

const staticImportsOf = (source: string): string[] =>
  [...source.matchAll(/^(?:import|export)\s+(?!type\s)(?:([^'";]*?)\s+from\s+)?'([^']+)';$/gms)]
    .filter((match) => !TYPE_ONLY_SPECIFIERS.test((match[1] ?? '').trim()))
    .map((match) => match[2] ?? '');

const MODULE_EXTENSIONS = ['.ts', '.tsx', '.js', '/index.ts', '/index.tsx', '/index.js'];

const resolveLocalModule = (importer: string, specifier: string): string | null => {
  const aliased = specifier
    .replace(/^@auth\//, 'src/modules/user/features/auth/')
    .replace(/^@\//, 'src/');
  const isLocal = aliased.startsWith('src/') || specifier.startsWith('.');
  if (!isLocal || /\.(css|json|svg)$/.test(aliased)) return null;
  const base = specifier.startsWith('.') ? path.join(path.dirname(importer), specifier) : aliased;
  const found = MODULE_EXTENSIONS.map((extension) => `${base}${extension}`).find((candidate) =>
    fs.existsSync(path.join(projectRoot, candidate))
  );
  if (!found) throw new Error(`Unresolved eager import ${specifier} in ${importer}`);
  return found;
};

interface EagerGraph {
  readonly files: ReadonlySet<string>;
  readonly muiEdges: readonly string[];
}

const eagerGraphOf = (entry: string, read: (file: string) => string = readFile): EagerGraph => {
  const files = new Set<string>();
  const muiEdges: string[] = [];
  const pending = [entry];

  while (pending.length > 0) {
    const file = pending.pop() ?? '';
    if (!files.has(file)) {
      files.add(file);
      for (const specifier of staticImportsOf(read(file))) {
        const local = resolveLocalModule(file, specifier);
        if (local) pending.push(local);
        else if (specifier.startsWith('@mui/')) muiEdges.push(`${file} -> ${specifier}`);
      }
    }
  }

  return { files, muiEdges };
};

const SHELL_ONLY_FOLDERS = [
  'src/components/ui-app-shell/',
  'src/components/ui-app-header/',
  'src/components/ui-sidebar/',
  'src/components/ui-navigation-list/',
  'src/components/ui-navigation-drawer/',
  'src/modules/user/features/settings/components/user-menu/',
];

const shellFilesOf = (files: ReadonlySet<string>): string[] =>
  [...files].filter((file) => SHELL_ONLY_FOLDERS.some((folder) => file.startsWith(folder)));

const PROTECTED_LAYOUT_ROOT = 'src/routes/protected-layout.ts';

const SHARED_WITH_EAGER_PATH = [
  'src/config/env/raw-env.ts',
  'src/lib/reliability/chunk-load-error-detector.ts',
  'src/lib/reliability/chunk-retry-loader.ts',
  'src/providers/mui-theme/mui-theme-shell-loader.ts',
  'src/providers/mui-theme/themed-chunk-loader.ts',
  'src/services/observability/correlation-id-provider.ts',
  'src/services/observability/observability-core.ts',
  'src/services/observability/pii-scrubber.ts',
  'src/services/observability/sentry-client.ts',
  'src/services/observability/sentry-config.ts',
  'src/services/observability/session-correlation.ts',
  'src/services/observability/web-vitals-reporter.ts',
];

const protectedGraphIn = (files: ReadonlySet<string>): string[] => {
  const protectedGraph = eagerGraphOf(PROTECTED_LAYOUT_ROOT).files;
  return [...files].filter((file) => protectedGraph.has(file)).sort();
};

const protectedLayoutFilesOf = (files: ReadonlySet<string>): string[] =>
  protectedGraphIn(files).filter((file) => !SHARED_WITH_EAGER_PATH.includes(file));

const CURRENT_USER_MENU = /(?:^|\/)current-user-menu(?:[./]|$)/u;

describe('performance serving config', () => {
  it('ships immutable cache headers for built static assets', () => {
    const serveConfig = readJson<{
      headers?: Array<{
        source?: string;
        headers?: Array<{ key?: string; value?: string }>;
      }>;
    }>('serve.json');

    const staticAssetRule = serveConfig.headers?.find((rule) => rule.source === '/static/**');

    expect(staticAssetRule).toBeDefined();
    expect(staticAssetRule?.headers).toContainEqual({
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    });
  });

  it('loads the explicit serve config in the production image', () => {
    const dockerfile = readFile('Dockerfile');

    expect(dockerfile).toContain('COPY --chown=node:node serve.json ./serve.json');
    expect(dockerfile).toContain('"/app/serve.json"');
  });

  it('renders runtime configuration at container start without changing the serve command', () => {
    const dockerfile = readFile('Dockerfile');

    // The ENTRYPOINT renders APP_CONFIG_* into the built HTML shell, then execs CMD (issue #145).
    expect(dockerfile).toContain(
      'COPY --chown=node:node scripts/docker-entrypoint.sh scripts/render-app-config.js ' +
        'scripts/render-security-headers.js scripts/security-headers.js ./scripts/'
    );
    expect(dockerfile).toContain('ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]');

    // The serve command itself must stay byte-identical: the entrypoint wraps it, never
    // replaces it, so the production image keeps serving `dist` with the explicit serve config.
    expect(dockerfile).toContain(
      'CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3001", "-c", "/app/serve.json", ' +
        '"--no-request-logging"]'
    );
  });

  it('reads runtime configuration at boot synchronously, free of fetch, zod and tsyringe', () => {
    // Issue #145. The runtime config lives inline in the HTML shell precisely so that reading it
    // costs nothing on the critical path. Two regressions this pins against, both of which would
    // blow the auth-page Lighthouse mobile budget (lighthouse/lighthouserc.mobile.js):
    //   * an `await fetch('/app-config.json')` before render() is invisible to the preload
    //     scanner, so it serializes a full round trip onto FCP and LCP;
    //   * importing `@/config/runtime/app-config` (zod), or the tsyringe composition root, from
    //     the entry module drags both into the eager entrypoint chunk — the exact cost the
    //     deferred-DI auth store was built to avoid.
    const entrySource = readFile('src/index.tsx');
    // Comments legitimately discuss `await` and `fetch`; the gate is about executable code.
    const entryCode = entrySource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

    expect(entrySource).toContain(
      "import appConfigSource from '@/config/runtime/app-config-source';"
    );
    expect(entrySource).toContain('appConfigSource.load()');

    expect(entryCode).not.toMatch(/\bawait\b/);
    expect(entryCode).not.toContain('fetch(');
    expect(entryCode).not.toContain("'@/config/dependency-injection-config'");
    expect(entryCode).not.toContain("'@/config/runtime/app-config'");
    expect(entryCode).not.toContain("from 'zod'");
  });

  it('does not inject preload hints for every async chunk into the HTML shell', () => {
    const rsbuildConfigSource = readFile('rsbuild.config.ts');

    expect(rsbuildConfigSource).not.toContain('preload: true');
  });

  it('does not enable global async chunk prefetching for the HTML shell', () => {
    const rsbuildConfigSource = readFile('rsbuild.config.ts');

    expect(rsbuildConfigSource).not.toContain('prefetch: {');
    expect(rsbuildConfigSource).not.toContain("type: 'async-chunks'");
  });

  it('keeps route-level code splitting via the module-owned route contracts', () => {
    const mapperSource = readFile('src/routes/route-mapper.tsx');
    const appRoutesSource = readFile('src/routes/app-routes.ts');
    const authRoutesSource = readFile('src/modules/user/features/auth/routes/index.ts');
    const settingsRoutesSource = readFile('src/modules/user/features/settings/routes/index.ts');
    const routesSource = readFile('src/routes/routes.tsx');
    const rootLayoutSource = readFile('src/components/layouts/root-layout.tsx');

    // The composer maps each contract loader through React.lazy, so every page
    // still resolves via its own dynamic import() chunk; the loader wraps `route.load` in the
    // chunk-recovery loaders (issue #147) rather than replacing the contract's import().
    expect(mapperSource).toContain('lazy(() => loader.load())');
    expect(mapperSource).toContain('new ChunkRetryLoader<PageModule>(route.load)');

    // Each page is a lazy loader inside its owning module's contract, and its chunk is named
    // via webpackChunkName so the bundle-size report tracks it per route (issue #117).
    expect(appRoutesSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "[^"]+" \*\/\s*'@\/features\/home'\)/
    );
    ['not-found/not-found', 'forbidden/forbidden', 'server-error/server-error'].forEach((page) => {
      expect(appRoutesSource).toMatch(
        new RegExp(
          String.raw`import\(\s*/\* webpackChunkName: "error-page" \*/\s*` +
            String.raw`'@/components/${page}'\)`
        )
      );
    });
    expect(authRoutesSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "[^"]+" \*\/\s*'\.\/sign-up'\)/
    );
    expect(authRoutesSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "[^"]+" \*\/\s*'\.\/sign-in'\)/
    );

    expect(settingsRoutesSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "settings" \*\/\s*'\.\/user-profile'\)/
    );
    const comingSoonLoader =
      /import\(\s*\/\* webpackChunkName: "coming-soon" \*\/\s*'@\/components\/coming-soon'\)/g;
    expect(appRoutesSource.match(comingSoonLoader)).toHaveLength(5);
    expect(settingsRoutesSource.match(comingSoonLoader)).toHaveLength(3);
    expect(staticImportsOf(appRoutesSource)).not.toContain('@/components/coming-soon');
    expect(staticImportsOf(settingsRoutesSource)).not.toContain('@/components/coming-soon');
    expect(staticImportsOf(settingsRoutesSource)).not.toContain('./user-profile');
    expect(staticImportsOf(readFile('src/routes/registry.ts'))).toContain(
      '@/modules/user/features/settings/routes'
    );

    // Pages are never statically imported (which would defeat code splitting).
    expect(routesSource).not.toContain('import SignUp');
    expect(routesSource).not.toContain('import SignIn');
    expect(routesSource).not.toContain('import Home');
    expect(appRoutesSource).not.toContain('import Forbidden');
    expect(appRoutesSource).not.toContain('import ServerError');
    expect(authRoutesSource).not.toContain("import SignUp from './sign-up'");
    expect(authRoutesSource).not.toContain("import SignIn from './sign-in'");
    expect(staticImportsOf("import ResetPassword from './reset-password';\n")).toEqual([
      './reset-password',
    ]);
    ['reset-password', 'create-new-password'].forEach((page) => {
      expect(authRoutesSource).toMatch(
        new RegExp(String.raw`import\(\s*/\* webpackChunkName: "${page}" \*/\s*'\./${page}'\)`)
      );
      expect(staticImportsOf(authRoutesSource)).not.toContain(`./${page}`);
      expect(staticImportsOf(routesSource).filter((source) => source.includes(page))).toEqual([]);
    });

    // The route-level Suspense boundary ships a non-null deferred fallback (RouteFallback),
    // never `fallback={null}` (issue #117). This pins the RootLayout boundary specifically; the
    // whole-tree rule that no Suspense anywhere in `src/` may ship a null/undefined/false/""
    // fallback, or omit one, is the `suspenseFallbackSelectors` ESLint gate in eslint.config.mjs
    // (issue #116), with must-fail fixtures in scripts/ci/eslint-gate-fixtures.mjs.
    expect(rootLayoutSource).toContain('<RouteFallback />');
    expect(rootLayoutSource).not.toContain('fallback={null}');
  });

  it('keeps the MUI theme engine off the eager path', () => {
    const { muiEdges } = eagerGraphOf('src/index.tsx');

    expect(muiEdges).toEqual(['src/providers/app-providers.tsx -> @mui/material/styles']);
    expect(readFile('src/providers/app-providers.tsx')).toContain(
      "import { StyledEngineProvider } from '@mui/material/styles';"
    );

    // Every lazy surface that renders MUI receives the theme from the parallel mui-theme chunk.
    expect(readFile('src/routes/route-mapper.tsx')).toContain('new ThemedChunkLoader(');
    expect(readFile('src/components/layouts/footer-loader.ts')).toContain('new ThemedChunkLoader(');
    expect(readFile('src/components/error-boundary/error-page-loader.ts')).toContain(
      'new ThemedChunkLoader<ErrorPageProps>('
    );
    expect(readFile('src/components/error-boundary/error-page-loader.ts')).toMatch(
      /import\(\s*\/\* webpackChunkName: "error-page" \*\/\s*'@\/components\/error-page'\)/
    );
    expect(readFile('src/providers/mui-theme/mui-theme-shell-loader.ts')).toContain(
      'webpackChunkName: "mui-theme"'
    );
  });

  it('keeps the shell, the user menu and the current-user read off the eager path (NFR-5)', () => {
    const { files, muiEdges } = eagerGraphOf('src/index.tsx');
    const eagerShell = shellFilesOf(files);
    const settingsHooks = [...files].filter((file) => file.includes('hooks/use-current-user'));

    expect(eagerShell).toEqual([]);
    expect(settingsHooks).toEqual([]);
    expect(muiEdges).toEqual(['src/providers/app-providers.tsx -> @mui/material/styles']);
  });

  it('fails the eager-path check when the composer imports a shell file (must-fail)', () => {
    const composer = 'src/routes/route-composer.tsx';
    const tainted = (file: string): string =>
      file === composer
        ? `${readFile(file)}\nimport UIAppShell from '@/components/ui-app-shell';\n`
        : readFile(file);

    const { files } = eagerGraphOf('src/index.tsx', tainted);

    expect(shellFilesOf(files)).toContain('src/components/ui-app-shell/index.tsx');
  });

  it('keeps ProtectedRoute, AppLayout and their own imports off the eager path', () => {
    const { files } = eagerGraphOf('src/index.tsx');

    expect(files.has('src/routes/route-composer.tsx')).toBe(true);
    expect(files.has('src/routes/protected-layout-loader.ts')).toBe(true);
    expect(protectedLayoutFilesOf(files)).toEqual([]);
  });

  it('shares only the listed infrastructure modules between the eager and protected graphs', () => {
    const { files } = eagerGraphOf('src/index.tsx');

    expect(protectedGraphIn(files)).toEqual(SHARED_WITH_EAGER_PATH);
  });

  it('fails the protected-layout check when the composer imports AppLayout (must-fail)', () => {
    const composer = 'src/routes/route-composer.tsx';
    const tainted = (file: string): string =>
      file === composer
        ? `${readFile(file)}\nimport AppLayout from '@/components/layouts/app-layout';\n`
        : readFile(file);

    const { files } = eagerGraphOf('src/index.tsx', tainted);

    expect(protectedLayoutFilesOf(files)).toEqual([
      'src/components/layouts/app-layout-frame.tsx',
      'src/components/layouts/app-layout.styles.ts',
      'src/components/layouts/app-layout.tsx',
      'src/components/layouts/app-shell-loader.ts',
      'src/components/layouts/app-shell-placeholders.tsx',
      'src/components/layouts/footer-loader.ts',
      'src/components/layouts/use-app-shell.ts',
      'src/components/layouts/use-frame-focus.ts',
      'src/components/layouts/use-header-clearance.ts',
      'src/hooks/use-arrival-focus.ts',
    ]);
  });

  it('fails the protected-layout check when the composer imports the guard (must-fail)', () => {
    const composer = 'src/routes/route-composer.tsx';
    const tainted = (file: string): string =>
      file === composer
        ? `${readFile(file)}\nimport ProtectedRoute from '@auth/components/protected-route';\n`
        : readFile(file);

    const { files } = eagerGraphOf('src/index.tsx', tainted);

    expect(protectedLayoutFilesOf(files)).toEqual([
      'src/config/env/preloaded-auth-token.ts',
      'src/config/env/sandbox-demo-session-provider.ts',
      'src/modules/user/features/auth/components/protected-route/index.tsx',
      'src/modules/user/features/auth/hooks/use-session-redirect-state.ts',
      'src/modules/user/features/auth/stores/auth-session-provider.ts',
      'src/modules/user/features/auth/stores/auth-store-selectors.ts',
      'src/modules/user/features/auth/stores/use-auth-store.ts',
      'src/modules/user/features/auth/stores/use-auth-token.ts',
      'src/modules/user/features/auth/stores/use-sign-out.ts',
    ]);
  });

  it('loads the guard, the layout and the slot factory from one protected-layout chunk', () => {
    const loaderSource = readFile('src/routes/protected-layout-loader.ts');
    const chunkSource = readFile('src/routes/protected-layout.ts');

    expect(loaderSource.match(/import\(/g)).toHaveLength(1);
    expect(loaderSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "protected-layout" \*\/\s*'\.\/protected-layout'\s*\)/
    );
    expect(loaderSource).toContain('new ChunkRetryLoader<ProtectedLayoutModule>(');
    expect(loaderSource).not.toContain('ReloadingChunkLoader');
    expect(staticImportsOf(loaderSource)).not.toContain('./protected-layout');
    expect(staticImportsOf(chunkSource)).toEqual([
      '@/components/layouts/app-layout',
      '@auth/components/protected-route',
      './shell-slot-factory',
    ]);
  });

  it('loads the shell through a ThemedChunkLoader named ui-app-shell (AD-1)', () => {
    const loaderSource = readFile('src/components/layouts/app-shell-loader.ts');

    expect(loaderSource).toContain('new ThemedChunkLoader<UIAppShellProps>(');
    expect(loaderSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "ui-app-shell" \*\/\s*'@\/components\/ui-app-shell'\s*\)/
    );
    expect(staticImportsOf(readFile('src/components/layouts/app-layout.tsx'))).toEqual(
      expect.arrayContaining(['./app-shell-loader'])
    );
  });

  it('imports the user-menu and current-user chunks only through import() (AD-1)', () => {
    const settingsContract = readFile('src/modules/user/features/settings/routes/index.ts');
    const slot = readFile(
      'src/modules/user/features/settings/components/user-menu/user-menu-slot.tsx'
    );
    const currentUserLoader = readFile(
      'src/modules/user/features/settings/components/user-menu/current-user-menu-loader.ts'
    );

    expect(settingsContract).toMatch(
      new RegExp(
        String.raw`userMenu: \(\) =>\s*import\(\s*/\* webpackChunkName: "user-menu" \*/\s*` +
          String.raw`'\.\./components/user-menu/user-menu-slot'\s*\)`
      )
    );
    expect(staticImportsOf(settingsContract)).not.toContain(
      '../components/user-menu/user-menu-slot'
    );
    expect(currentUserLoader).toMatch(/import\(\s*\/\* webpackChunkName: "current-user" \*\//);
    expect(staticImportsOf(slot).filter((specifier) => CURRENT_USER_MENU.test(specifier))).toEqual(
      []
    );
    expect(staticImportsOf(slot)).toContain('./current-user-menu-loader');
  });

  it('warms the shared error-page chunk and its font faces after load (issue #309)', () => {
    const appRoutesSource = readFile('src/routes/app-routes.ts');
    const errorPageLoaderSource = readFile('src/components/error-boundary/error-page-loader.ts');
    const entrySource = readFile('src/index.tsx');
    const errorRouteChunks = appRoutesSource.match(
      /webpackChunkName: "error-page" \*\/\s*'@\/components\/(not-found|forbidden|server-error)\//g
    );

    expect(errorRouteChunks).toHaveLength(3);
    expect(appRoutesSource.match(/webpackChunkName: "/g)).toHaveLength(9);
    expect(errorPageLoaderSource).toContain('webpackChunkName: "error-page"');

    const renderAt = entrySource.lastIndexOf('root.render(');
    const prefetchAt = entrySource.indexOf(
      [
        'new PostLoadPrefetcher<ErrorPageModule | void>({',
        '    items: [errorPageLoader, new FontFaceLoader(document.fonts, ERROR_PAGE_FONT_FACES)],',
        '  }).attach(window);',
      ].join('\n')
    );

    expect(prefetchAt).toBeGreaterThan(renderAt);
    expect(renderAt).toBeGreaterThan(entrySource.indexOf('} else {'));
    expect(entrySource).toContain(
      "import errorPageLoader from '@/components/error-boundary/error-page-loader';"
    );
    expect(entrySource).toContain(
      "import ERROR_PAGE_FONT_FACES from '@/components/error-page/config/error-page-fonts';"
    );
    expect(entrySource).not.toContain('ReloadingChunkLoader');
  });

  it('keeps registration notifications out of the initial auth form chunk', () => {
    const registrationFormSource = readFile(
      'src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx'
    );

    expect(registrationFormSource).toContain('import { type JSX, lazy, Suspense');
    expect(registrationFormSource).toContain("from 'react';");
    expect(registrationFormSource).toContain(
      'import registrationNotificationLoader from ' +
        "'@auth/utils/load-registration-notification';"
    );
    expect(registrationFormSource).toContain(
      'const RegistrationNotification = lazy(() => registrationNotificationLoader.load());'
    );
    expect(registrationFormSource).not.toContain(
      'import RegistrationNotification from ' +
        "'@auth/components/form-section/auth-forms/registration-notification';"
    );
  });

  it('keeps the sign-in notification out of the initial auth form chunk', () => {
    const loginFormSource = readFile(
      'src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx'
    );

    expect(loginFormSource).toContain(
      'import registrationNotificationLoader, {\n' +
        '  registrationNotificationPrefetcher,\n' +
        "} from '@auth/utils/load-registration-notification';"
    );
    expect(loginFormSource).toContain(
      'const RegistrationNotification = lazy(() => registrationNotificationLoader.load());'
    );
    expect(loginFormSource).toContain('registrationNotificationPrefetcher.prefetch();');
    expect(loginFormSource).not.toContain(
      "from '@auth/components/form-section/auth-forms/registration-notification';"
    );
  });

  it('keeps the password-recovery copy out of the eager merged catalog', () => {
    const merged = readJson<Record<string, { translation: Record<string, unknown> }>>(
      'src/i18n/localization.json'
    );
    const policy = readJson<{ lazyCatalogs: { catalog: string; owners: string[] }[] }>(
      'config/i18n-catalog-policy.json'
    );
    const recoveryRoutes = ['reset-password', 'create-new-password'].map((route) =>
      readFile(`src/modules/user/features/auth/routes/${route}/index.tsx`)
    );
    const recoveryOwners =
      policy.lazyCatalogs.find(
        (entry) => entry.catalog === 'modules/user/features/auth/routes/recovery-catalog/i18n'
      )?.owners ?? [];
    const eagerSurfaces = [
      'modules/user/features/auth/routes/sign-in/index.tsx',
      'modules/user/features/auth/routes/sign-up/index.tsx',
      'modules/user/features/auth/components/form-section/auth-forms/login-form.tsx',
      'modules/user/features/auth/components/sign-in-notice/index.tsx',
      'components/ui-form/index.tsx',
    ];

    expect(recoveryOwners).toEqual(
      expect.arrayContaining([
        'modules/user/features/auth/routes/reset-password',
        'modules/user/features/auth/routes/create-new-password',
      ])
    );
    eagerSurfaces.forEach((surface) => {
      const owner = recoveryOwners.find(
        (candidate) => surface === candidate || surface.startsWith(`${candidate}/`)
      );
      expect({ surface, owner }).toEqual({ surface, owner: undefined });
    });
    ['en', 'uk'].forEach((locale) => {
      const namespaces = Object.keys(merged[locale]?.translation ?? {});
      expect(namespaces).toContain('sign_in');
      expect(namespaces).not.toContain('password_recovery');
      expect(namespaces).not.toContain('password_reset');
      expect(namespaces).not.toContain('password_policy');
      expect(namespaces).not.toContain('settings');
      expect(namespaces).not.toContain('ui_toast');
    });
    expect(
      readFile('src/modules/user/features/auth/components/recovery-page-layout/index.tsx')
    ).toContain('lazyCatalogLoader.register(i18n, { en, uk });');
    recoveryRoutes.forEach((routeSource) => {
      expect(routeSource).toContain(
        "import RecoveryPageLayout from '@auth/components/recovery-page-layout';"
      );
    });
  });

  it('wires both auth-form groups to the chunk names the form and settings loaders emit', () => {
    const rsbuildConfigSource = readFile('rsbuild.config.ts');
    const loaderChunkName = (route: string): string | undefined =>
      /webpackChunkName: "([^"]+)"/.exec(
        readFile(`src/modules/user/features/auth/routes/${route}/form-section-loader.ts`)
      )?.[1];
    const settingsChunkName = /webpackChunkName: "([^"]+)" \*\/\s*'\.\/user-profile'/.exec(
      readFile('src/modules/user/features/settings/routes/index.ts')
    )?.[1];

    expect(rsbuildConfigSource.replace(/\s+/g, ' ')).toContain(
      'cacheGroups: { authFormsVendors: authFormsVendorsCacheGroup(), ' +
        'authForms: authFormsCacheGroup(), },'
    );
    expect([authFormsVendorsCacheGroup().name, authFormsCacheGroup().name]).toEqual([
      'auth-forms-vendors',
      'auth-forms',
    ]);
    [authFormsVendorsCacheGroup(), authFormsCacheGroup()].forEach((group) => {
      const selects = group.chunks as (chunk: { name: string | undefined }) => boolean;
      expect(
        ['sign-in', 'sign-up', 'reset-password', 'create-new-password'].map((route) =>
          selects({ name: loaderChunkName(route) })
        )
      ).toEqual([true, true, true, true]);
      expect(selects({ name: settingsChunkName })).toBe(true);
    });
    expect(AUTH_FORM_CHUNKS).toEqual(['sign-in', 'sign-up'].map(loaderChunkName));
    expect(RECOVERY_FORM_CHUNKS).toEqual(
      ['reset-password', 'create-new-password'].map(loaderChunkName)
    );
    expect(SETTINGS_CHUNKS).toEqual([settingsChunkName]);
  });
});

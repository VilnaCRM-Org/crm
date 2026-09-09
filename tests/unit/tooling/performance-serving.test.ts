// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const readJson = <T>(relativePath: string): T => JSON.parse(readFile(relativePath)) as T;

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
      'COPY --chown=node:node scripts/docker-entrypoint.sh scripts/render-app-config.js ./scripts/'
    );
    expect(dockerfile).toContain('ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]');

    // The serve command itself must stay byte-identical: the entrypoint wraps it, never
    // replaces it, so the production image keeps serving `dist` with the explicit serve config.
    expect(dockerfile).toContain(
      'CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3001", "-c", "/app/serve.json"]'
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
    const routesSource = readFile('src/routes/routes.tsx');
    const rootLayoutSource = readFile('src/components/layouts/root-layout.tsx');

    // The composer maps each contract loader through React.lazy, so every page
    // still resolves via its own dynamic import() chunk.
    expect(mapperSource).toContain('lazy(route.load)');

    // Each page is a lazy loader inside its owning module's contract, and its chunk is named
    // via webpackChunkName so the bundle-size report tracks it per route (issue #117).
    expect(appRoutesSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "[^"]+" \*\/\s*'@\/button-example'\)/
    );
    expect(appRoutesSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "[^"]+" \*\/\s*'@\/components\/not-found\/not-found'\)/
    );
    expect(authRoutesSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "[^"]+" \*\/\s*'\.\/sign-up'\)/
    );
    expect(authRoutesSource).toMatch(
      /import\(\s*\/\* webpackChunkName: "[^"]+" \*\/\s*'\.\/sign-in'\)/
    );

    // Pages are never statically imported (which would defeat code splitting).
    expect(routesSource).not.toContain('import SignUp');
    expect(routesSource).not.toContain('import SignIn');
    expect(routesSource).not.toContain('import ButtonExample');
    expect(authRoutesSource).not.toContain("import SignUp from './sign-up'");
    expect(authRoutesSource).not.toContain("import SignIn from './sign-in'");

    // The single route-level Suspense boundary ships a non-null deferred fallback
    // (RouteFallback), never `fallback={null}` (issue #117 — the only fallback check).
    expect(rootLayoutSource).toContain('<RouteFallback />');
    expect(rootLayoutSource).not.toContain('fallback={null}');
  });

  it('keeps registration notifications out of the initial auth form chunk', () => {
    const registrationFormSource = readFile(
      'src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx'
    );

    expect(registrationFormSource).toContain('import { lazy, Suspense');
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
});

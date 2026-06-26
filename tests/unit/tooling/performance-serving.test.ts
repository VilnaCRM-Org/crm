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

  it('does not inject preload hints for every async chunk into the HTML shell', () => {
    const rsbuildConfigSource = readFile('rsbuild.config.ts');

    expect(rsbuildConfigSource).not.toContain('preload: true');
  });

  it('does not enable global async chunk prefetching for the HTML shell', () => {
    const rsbuildConfigSource = readFile('rsbuild.config.ts');

    expect(rsbuildConfigSource).not.toContain('prefetch: {');
    expect(rsbuildConfigSource).not.toContain("type: 'async-chunks'");
  });

  it('keeps route-level code splitting in the routes layer', () => {
    const routesSource = readFile('src/routes/routes.tsx');

    expect(routesSource).toContain(
      "const SignUp = lazy(async () => import('@auth/routes/sign-up'));"
    );
    expect(routesSource).toContain(
      "const SignIn = lazy(async () => import('@auth/routes/sign-in'));"
    );
    expect(routesSource).toContain(
      "const ButtonExample = lazy(async () => import('@/button-example'));"
    );
    expect(routesSource).not.toContain("import SignUp from '@auth/routes/sign-up';");
    expect(routesSource).not.toContain("import SignIn from '@auth/routes/sign-in';");
    expect(routesSource).not.toContain("import ButtonExample from '@/button-example';");
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

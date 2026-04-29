import fs from 'fs';
import path from 'path';

const readFile = (filePath: string): string =>
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', filePath), 'utf-8');

describe('review feedback regressions', () => {
  it('Storybook waits for i18n initialization before rendering stories', () => {
    const preview = readFile('.storybook/preview.tsx');

    expect(preview).toContain('export const i18nInitPromise');
    expect(preview).toContain('loaders: [');
    expect(preview).toContain('async () => {');
    expect(preview).toContain('await i18nInitPromise');
    expect(preview).not.toContain('void i18next.use(initReactI18next).init');
  });

  it('Mockoon Dockerfile downloads the spec with retries, auth support, and checksum validation', () => {
    const dockerfile = readFile('Mockoon.Dockerfile');

    expect(dockerfile).not.toMatch(/^ADD\s+https:/m);
    expect(dockerfile).toContain('ARG GITHUB_TOKEN');
    expect(dockerfile).toContain('ARG OPENAPI_SPEC_SHA256');
    expect(dockerfile).toContain('curl --fail --show-error --location');
    expect(dockerfile).toContain('--retry 5');
    expect(dockerfile).toContain('--retry-connrefused');
    expect(dockerfile).toContain('/app/data.yaml');
    expect(dockerfile).toContain('sha256sum -c');
  });

  it('Apollo bootstrap treats expected termination signals as graceful exits', () => {
    const bootstrap = readFile('docker/apollo-server/bootstrap.mjs');

    expect(bootstrap).toContain("const gracefulSignals = new Set(['SIGINT', 'SIGTERM', 'SIGQUIT'])");
    expect(bootstrap).toContain('code === 0 || gracefulSignals.has(signal)');
    expect(bootstrap).toContain('return res()');
  });
});

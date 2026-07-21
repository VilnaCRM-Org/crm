const fs = require('fs');
const path = require('path');

describe('public index performance safeguards', () => {
  it('does not load external font stylesheets that block first paint', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../../../public/index.html'), 'utf8');

    expect(html).not.toContain('https://rsms.me/inter/inter.css');
  });

  it('uses the production metadata and manifest assets from PR #54', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../../../public/index.html'), 'utf8');

    expect(html).toContain('VilnaCRM');
    expect(html).toContain('/site.webmanifest');
    expect(html).toContain('/favicon.svg');
    expect(html).not.toContain('%PUBLIC_URL%');
    expect(html).not.toContain('Bulletproof React Application');
  });

  it('does not inline the lhci preloaded auth token into the rsbuild client defines', () => {
    const config = fs.readFileSync(path.resolve(__dirname, '../../../rsbuild.config.ts'), 'utf8');

    expect(config).not.toContain("'process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN'");
    expect(config).not.toContain('process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN ??');
  });

  it('uses a deferred, spinner-free route fallback so first paint adds no loading spinner', () => {
    const rootLayoutSource = fs.readFileSync(
      path.resolve(__dirname, '../../../src/components/layouts/root-layout.tsx'),
      'utf8'
    );

    // The route-level Suspense uses the deferred RouteFallback, never an eager MUI
    // CircularProgress, so a fast chunk load adds no first-paint spinner (issue #117).
    expect(rootLayoutSource).toContain('<RouteFallback />');
    expect(rootLayoutSource).not.toContain('CircularProgress');

    const fallbackSource = fs.readFileSync(
      path.resolve(__dirname, '../../../src/components/route-fallback/index.tsx'),
      'utf8'
    );

    // RouteFallback paints nothing until a timer elapses and stays off the eager MUI spinner
    // graph, so the safeguard that motivated `fallback={null}` is preserved.
    expect(fallbackSource).toContain('setTimeout');
    expect(fallbackSource).not.toContain('CircularProgress');
  });

  it('keeps dependency injection metadata out of the client entry bundle', () => {
    const entrySource = fs.readFileSync(path.resolve(__dirname, '../../../src/index.tsx'), 'utf8');

    expect(entrySource).not.toContain("import '@/config/dependency-injection-config';");
    expect(entrySource).not.toContain("import 'reflect-metadata';");
  });

  it('serves immutable cache headers for static assets in production', () => {
    const serveConfig = fs.readFileSync(path.resolve(__dirname, '../../../serve.json'), 'utf8');

    expect(serveConfig).toContain('/static/**');
    expect(serveConfig).toContain('immutable');
    expect(serveConfig).toContain('/index.html');
    expect(serveConfig).toContain('no-cache');
  });
});

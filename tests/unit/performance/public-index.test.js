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

  it('injects the lhci preloaded auth token into the rsbuild client defines', () => {
    const config = fs.readFileSync(path.resolve(__dirname, '../../../rsbuild.config.ts'), 'utf8');

    expect(config).toContain("'process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN'");
    expect(config).toContain('process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN ??');
  });

  it('serves immutable cache headers for static assets in production', () => {
    const serveConfig = fs.readFileSync(path.resolve(__dirname, '../../../serve.json'), 'utf8');

    expect(serveConfig).toContain('/static/**');
    expect(serveConfig).toContain('immutable');
    expect(serveConfig).toContain('/index.html');
    expect(serveConfig).toContain('no-cache');
  });
});

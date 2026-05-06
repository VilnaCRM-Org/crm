// @jest-environment node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const readJson = <T>(relativePath: string): T => JSON.parse(readFile(relativePath)) as T;

describe('auth test harness wiring', () => {
  it('includes auth load testing in the CI workflow matrix', () => {
    const workflow = readFile('.github/workflows/load-testing.yml');

    expect(workflow).toContain('make_cmd: test-load-signup');
    expect(workflow).toContain('label: signup');
  });

  it('includes auth performance coverage in the Lighthouse config instead of the CI workflow', () => {
    const workflow = readFile('.github/workflows/performance-testing.yml');
    const constants = readFile('lighthouse/constants.js');
    const desktopRc = readFile('lighthouse/lighthouserc.desktop.js');
    const mobileRc = readFile('lighthouse/lighthouserc.mobile.js');
    const dockerCompose = readFile('docker-compose.test.yml');
    const makefile = readFile('Makefile');
    const batchScript = readFile('scripts/ci/batch_lhci_leak.sh');

    expect(workflow).not.toContain('/authentication');
    // eslint-disable-next-line no-template-curly-in-string
    expect(constants).toContain("const pages = [baseUrl || '/', `${baseUrl}/authentication`];");
    expect(desktopRc).toContain("const { pages } = require('./constants');");
    expect(desktopRc).toContain('url: pages');
    expect(desktopRc).not.toContain('puppeteerScript');
    expect(desktopRc).not.toContain('puppeteerLaunchOptions');
    expect(mobileRc).toContain("const { pages } = require('./constants');");
    expect(mobileRc).toContain('url: pages');
    expect(mobileRc).not.toContain('puppeteerScript');
    expect(mobileRc).not.toContain('puppeteerLaunchOptions');
    expect(dockerCompose).toContain('REACT_APP_LHCI_PRELOADED_AUTH_TOKEN');
    expect(dockerCompose).toContain(`${'$'}{LHCI_PRELOADED_AUTH_TOKEN-}`);
    expect(makefile).toContain('LHCI_PRELOADED_AUTH_TOKEN');
    expect(makefile).not.toContain(
      'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN=$(LHCI_PRELOADED_AUTH_TOKEN)'
    );
    expect(makefile).toContain('make ensure-chromium && make start-prod && $(LHCI)');
    expect(batchScript).not.toContain('LHCI_PRELOADED_AUTH_TOKEN');
    expect(makefile).not.toContain('--collect.url=$(LHCI_TARGET_URL)');
    expect(makefile).not.toContain('--collect.url=http://localhost:3001');
  });

  it('ships auth-specific load and memory leak entry points', () => {
    expect(fs.existsSync(path.join(projectRoot, 'tests/load/signup.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'tests/load/signup/integration.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'tests/load/signup/negative.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'tests/load/signup/positive.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'tests/load/signup/ratelimit.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'tests/memory-leak/tests/signup.js'))).toBe(true);
  });

  it('includes auth load endpoint configuration', () => {
    const config = readJson<{
      endpoints?: {
        signup?: {
          host?: string;
          port?: string;
          smoke?: unknown;
          average?: unknown;
          stress?: unknown;
          spike?: unknown;
        };
      };
    }>('tests/load/config.json.dist');

    expect(config.endpoints?.signup).toBeDefined();
    expect(config.endpoints?.signup?.host).toBe('mockoon');
    expect(config.endpoints?.signup?.port).toBe('8080');
    expect(config.endpoints?.signup?.smoke).toBeDefined();
    expect(config.endpoints?.signup?.average).toBeDefined();
    expect(config.endpoints?.signup?.stress).toBeDefined();
    expect(config.endpoints?.signup?.spike).toBeDefined();
  });
});

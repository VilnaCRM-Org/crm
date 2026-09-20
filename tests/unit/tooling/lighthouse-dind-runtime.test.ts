// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import { execFileSync } from 'child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync } from 'fs';
import { createRequire } from 'module';
import os from 'os';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const packageRoot = (entryPath: string, packageName: string): string => {
  let candidate = path.dirname(realpathSync(entryPath));
  while (candidate !== path.dirname(candidate)) {
    const manifestPath = path.join(candidate, 'package.json');
    if (
      existsSync(manifestPath) &&
      JSON.parse(readFileSync(manifestPath, 'utf8')).name === packageName
    ) {
      return candidate;
    }
    candidate = path.dirname(candidate);
  }
  throw new Error(`Could not locate installed package root for ${packageName}`);
};

describe('Lighthouse DIND runtime contract', () => {
  it('loads both configs from the same config and dependency paths as the prod fixture', () => {
    const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'crm-lhci-prod-'));
    const appDir = path.join(fixtureRoot, 'app');
    const lighthouseDir = path.join(appDir, 'lighthouse');
    const configDir = path.join(appDir, 'config');
    const globalModulesDir = path.join(fixtureRoot, 'usr/local/lib/node_modules');
    const dependencyRoot = process.env.CRM_NODE_MODULES || path.join(projectRoot, 'node_modules');
    mkdirSync(lighthouseDir, { recursive: true });
    mkdirSync(configDir, { recursive: true });
    mkdirSync(globalModulesDir, { recursive: true });

    try {
      cpSync(path.join(projectRoot, 'lighthouse'), lighthouseDir, { recursive: true });
      cpSync(
        path.join(projectRoot, 'config/performance-budget.json'),
        path.join(configDir, 'performance-budget.json')
      );
      expect(readFileSync(path.join(projectRoot, 'Dockerfile'), 'utf8')).toContain(
        'COPY --chown=node:node config/security-headers.json serve.json ./config/'
      );
      const dotenvExpandEntry = require.resolve('dotenv-expand', { paths: [dependencyRoot] });
      const nestedDotenvEntry = createRequire(dotenvExpandEntry).resolve('dotenv');
      cpSync(
        packageRoot(require.resolve('dotenv', { paths: [dependencyRoot] }), 'dotenv'),
        path.join(globalModulesDir, 'dotenv'),
        { recursive: true, dereference: true }
      );
      cpSync(
        packageRoot(dotenvExpandEntry, 'dotenv-expand'),
        path.join(globalModulesDir, 'dotenv-expand'),
        { recursive: true, dereference: true }
      );
      cpSync(
        packageRoot(nestedDotenvEntry, 'dotenv'),
        path.join(globalModulesDir, 'dotenv-expand/node_modules/dotenv'),
        { recursive: true, dereference: true }
      );
      const script = `
        const desktop = require(
          ${JSON.stringify(path.join(lighthouseDir, 'lighthouserc.desktop.js'))}
        );
        const mobile = require(
          ${JSON.stringify(path.join(lighthouseDir, 'lighthouserc.mobile.js'))}
        );
        const constants = require(${JSON.stringify(path.join(lighthouseDir, 'constants.js'))});
        const expected = ['', '/sign-up', '/sign-in'].map(route => 'http://localhost:3001' + route);
        if (desktop.ci.collect.url.join(',') !== expected.join(',')) process.exit(11);
        if (mobile.ci.collect.url.join(',') !== desktop.ci.collect.url.join(',')) process.exit(12);
        if (constants.pages.length !== 3) process.exit(13);
      `;
      execFileSync(process.execPath, ['-e', script], {
        env: {
          ...process.env,
          LHCI_TARGET_URL: 'http://localhost:3001',
          NODE_PATH: globalModulesDir,
        },
        stdio: 'pipe',
      });
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('derives DIND install versions from the committed Bun lockfile', () => {
    const lock = readFileSync(path.join(projectRoot, 'bun.lock'), 'utf8');
    const makefile = readFileSync(path.join(projectRoot, 'Makefile'), 'utf8');
    const lhciVersion = lock.match(/^\s*"@lhci\/cli": \["@lhci\/cli@([^"]+)"/m)?.[1];
    const dotenvExpandVersion = lock.match(/^\s*"dotenv-expand": \["dotenv-expand@([^"]+)"/m)?.[1];
    const dotenvVersion = lock.match(/^\s*"dotenv": \["dotenv@([^"]+)"/m)?.[1];

    expect(lhciVersion).toBe('0.15.1');
    expect(dotenvExpandVersion).toBe('12.0.3');
    expect(dotenvVersion).toBe('17.4.2');
    expect(makefile).toMatch(/LHCI_DIND_CLI_VERSION\s*=\s*\$\(shell sed .*bun\.lock/);
    expect(makefile).toMatch(/DOTENV_EXPAND_DIND_VERSION\s*=\s*\$\(shell sed .*bun\.lock/);
    expect(makefile).toMatch(/DOTENV_DIND_VERSION\s*=\s*\$\(shell sed .*bun\.lock/);
    expect(makefile).toContain('LHCI_VERSION="$(LHCI_DIND_CLI_VERSION)"');
    expect(makefile).toContain('DOTENV_EXPAND_VERSION="$(DOTENV_EXPAND_DIND_VERSION)"');
    expect(makefile).toContain('DOTENV_VERSION="$(DOTENV_DIND_VERSION)"');
    expect(makefile).toContain('[ -n "$$LHCI_VERSION" ]');
    expect(makefile).toContain('[ -n "$$DOTENV_EXPAND_VERSION" ]');
    expect(makefile).toContain('[ -n "$$DOTENV_VERSION" ]');
    expect(makefile).toContain('npm install -g --prefix /usr/local');
    expect(makefile).toContain('chromium=136.0.7103.113-r0');
  });
});

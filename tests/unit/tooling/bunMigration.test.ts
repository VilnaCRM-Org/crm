import fs from 'fs';
import path from 'path';

import type { Config } from 'jest';

import jestConfig from '../../../jest.config';

const readFile = (filePath: string): string =>
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', filePath), 'utf-8');

describe('Bun migration tooling expectations', () => {
  it('Dockerfile installs bun v1.3.5 and exposes bunx', () => {
    const dockerfile = readFile('Dockerfile');

    expect(dockerfile).toContain('curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"');
    expect(dockerfile).toContain('ln -sf /root/.bun/bin/bun /root/.bun/bin/bunx');
    expect(dockerfile).toContain('ln -sf /root/.bun/bin/bun /usr/local/bin/bunx');
  });

  it('dev docker-compose uses bunx to start the app', () => {
    const compose = readFile('docker-compose.yml');
    expect(compose).toContain("command: ['bunx', 'craco', 'start']");
  });

  it('Makefile keeps host fallback when Docker is unavailable', () => {
    const makefile = readFile('Makefile');

    expect(makefile).toContain('DOCKER_AVAILABLE');
    expect(makefile).toContain('UNIT_TESTS              = make start && $(EXEC_DEV_TTYLESS) env');
    expect(makefile).toContain('UNIT_TESTS              = env');
  });

  it('Jest config uses babel coverage provider and expected thresholds', () => {
    const config = jestConfig as Config;

    expect(config.coverageProvider).toBe('babel');
    expect(config.coverageThreshold?.global).toEqual({
      branches: 96,
      functions: 96,
      lines: 96,
      statements: 96,
    });
  });
});

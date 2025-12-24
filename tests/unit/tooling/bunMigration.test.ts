import fs from 'fs';
import path from 'path';

import jestConfig from '../../../jest.config';

const readFile = (filePath: string): string =>
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', filePath), 'utf-8');

describe('Bun migration tooling expectations', () => {
  it('Dockerfile installs bun v1.3.5 with built-in bunx', () => {
    const dockerfile = readFile('Dockerfile');

    expect(dockerfile).toContain(
      'curl --retry 5 --retry-delay 2 -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"'
    );
    expect(dockerfile).not.toContain('ln -sf /root/.bun/bin/bunx');
    expect(dockerfile).toContain('ENV PATH="/root/.bun/bin:$PATH"');
  });

  it('dev docker-compose uses bun to start the app', () => {
    const compose = readFile('docker-compose.yml');
    expect(compose).toContain("command: ['bun', 'x', 'craco', 'start']");
    expect(compose).toContain('node_modules:/app/node_modules');
  });

  it('Makefile enforces dockerized workflows with Bun tooling', () => {
    const makefile = readFile('Makefile');

    expect(makefile).toMatch(/UNIT_TESTS\s+= make start && \$\(EXEC_DEV_TTYLESS\) env/);
    expect(makefile).not.toContain('UNIT_TESTS              = env');
  });

  it('Jest config uses babel coverage provider and expected thresholds', () => {
    const config = jestConfig;

    expect(config.coverageProvider).toBe('babel');
    expect(config.coverageThreshold?.global).toEqual({
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    });
  });
});

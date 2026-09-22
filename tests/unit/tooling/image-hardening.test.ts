/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

import { parse } from 'yaml';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const DOCKERFILES = [
  'Dockerfile',
  'Apollo.Dockerfile',
  'MemoryLeak.Dockerfile',
  'Mockoon.Dockerfile',
  'Playwright.Dockerfile',
  'tests/load/dockerfile',
];

const SERVICE_IMAGES = [
  'Dockerfile',
  'Apollo.Dockerfile',
  'MemoryLeak.Dockerfile',
  'Mockoon.Dockerfile',
];
const ONE_SHOT_IMAGES = ['Playwright.Dockerfile', 'tests/load/dockerfile'];
const BUN_IMAGES = [
  'Dockerfile',
  'Apollo.Dockerfile',
  'MemoryLeak.Dockerfile',
  'Playwright.Dockerfile',
];

const INSTALLER = 'scripts/docker/install-bun.sh';
const BUN_ASSETS = [
  'bun-linux-x64.zip',
  'bun-linux-x64-baseline.zip',
  'bun-linux-aarch64.zip',
  'bun-linux-x64-musl.zip',
  'bun-linux-x64-musl-baseline.zip',
  'bun-linux-aarch64-musl.zip',
];

const fromLines = (dockerfile: string): string[] =>
  dockerfile.split('\n').filter((line) => line.startsWith('FROM '));

const stageNames = (dockerfile: string): Set<string> =>
  new Set(
    fromLines(dockerfile)
      .map((line) => line.match(/ AS (\S+)$/)?.[1])
      .filter((name): name is string => name !== undefined)
  );

const registryFromLines = (dockerfile: string): string[] => {
  const stages = stageNames(dockerfile);
  return fromLines(dockerfile).filter((line) => {
    const reference = line.replace(/^FROM /, '').split(' ')[0] ?? '';
    return !stages.has(reference);
  });
};

const healthchecks = (dockerfile: string): string[] =>
  dockerfile.split('\n').filter((line) => line.startsWith('HEALTHCHECK '));

describe('image hardening (issue #139, item 4)', () => {
  describe('every registry base image is pinned by digest', () => {
    it.each(DOCKERFILES)('%s', (file) => {
      const lines = registryFromLines(readRepoFile(file));

      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line).toMatch(/^FROM \S+:[^@\s]+@sha256:[0-9a-f]{64}( AS \S+)?$/);
      }
    });
  });

  describe('every image carries a health signal an orchestrator can read', () => {
    it.each(SERVICE_IMAGES)('%s probes the service it serves', (file) => {
      const checks = healthchecks(readRepoFile(file));

      expect(checks.length).toBeGreaterThan(0);
      for (const check of checks) {
        expect(check).toMatch(
          /^HEALTHCHECK --interval=\S+ --timeout=\S+ --start-period=\S+ --retries=\d+ CMD \["/
        );
        expect(check).not.toContain('"true"');
      }
    });

    it.each(ONE_SHOT_IMAGES)(
      '%s declares that a one-shot runner has no health to report',
      (file) => {
        expect(healthchecks(readRepoFile(file))).toEqual(['HEALTHCHECK NONE']);
      }
    );

    it('probes the static server on port 3001 with the curl the stage installs', () => {
      const dockerfile = readRepoFile('Dockerfile');
      const [check] = healthchecks(dockerfile);

      expect(check).toContain('CMD ["curl", "-fsS", "-o", "/dev/null", "http://127.0.0.1:3001/"]');
      expect(dockerfile.indexOf('HEALTHCHECK ')).toBeGreaterThan(
        dockerfile.indexOf('AS serve-base')
      );
      expect(dockerfile.indexOf('HEALTHCHECK ')).toBeLessThan(dockerfile.indexOf('AS production'));
    });

    it('posts a real GraphQL query to Apollo on the GRAPHQL_PORT the server reads', () => {
      const [check] = healthchecks(readRepoFile('Apollo.Dockerfile'));

      expect(check).toContain('CMD ["sh", "-c", "wget ');
      expect(check).toContain(`--post-data='{\\"query\\":\\"{__typename}\\"}'`);
      expect(check).toContain('\\"http://localhost:${GRAPHQL_PORT:-4000}/graphql\\"');
    });
  });

  describe('Bun is installed from a checksum-verified release archive', () => {
    const installer = readRepoFile(INSTALLER);
    const { packageManager } = JSON.parse(readRepoFile('package.json')) as {
      packageManager: string;
    };
    const bunVersion = packageManager.replace(/^bun@/, '');

    it.each(BUN_IMAGES)(
      '%s runs the installer instead of piping bun.sh/install into bash',
      (file) => {
        const dockerfile = readRepoFile(file);

        expect(dockerfile).not.toContain('bun.sh/install');
        expect(dockerfile).toContain(`COPY ${INSTALLER} /usr/local/bin/install-bun`);
        expect(dockerfile).toContain(`ARG BUN_VERSION=${bunVersion}`);
        expect(dockerfile).toMatch(/install-bun "\$\{BUN_VERSION\}"/);
      }
    );

    it('pins one SHA256 per release archive, for the version package.json declares', () => {
      for (const asset of BUN_ASSETS) {
        expect(installer).toMatch(
          new RegExp(
            `^  ${bunVersion.replaceAll('.', '\\.')}/${asset}\\) sha256=[0-9a-f]{64} ;;$`,
            'm'
          )
        );
      }
      expect(installer.match(/sha256=[0-9a-f]{64}/g)).toHaveLength(BUN_ASSETS.length);
    });

    it('verifies the archive before extracting it and proves the binary runs', () => {
      expect(installer).toContain('sha256sum -c');
      expect(installer.indexOf('sha256sum -c')).toBeLessThan(installer.indexOf('unzip'));
      expect(installer).toMatch(/"\$prefix\/bin\/bun" --version$/m);
    });

    it('fails closed on an architecture or version it has no checksum for', () => {
      expect(installer).toMatch(/\*\) .*no pinned checksum.*exit 1 ;;/);
      expect(installer).toMatch(/\*\) .*unsupported architecture.*exit 1 ;;/);
    });
  });

  it('installs the memory-leak harness from the lockfile, like every other image', () => {
    const dockerfile = readRepoFile('MemoryLeak.Dockerfile');

    expect(dockerfile).toContain('RUN bun install --frozen-lockfile');
    expect(dockerfile).not.toMatch(/^RUN bun install$/m);
  });

  it('lets Dependabot move the digest pins, so a pin is a floor rather than a freeze', () => {
    const config = parse(readRepoFile('.github/dependabot.yml')) as {
      updates: { 'package-ecosystem': string; directories?: string[]; directory?: string }[];
    };
    const docker = config.updates.find((update) => update['package-ecosystem'] === 'docker');

    expect(docker?.directories).toEqual(['/', '/tests/load']);
  });
});

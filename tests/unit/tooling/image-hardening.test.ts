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

const APT_IMAGES = ['Dockerfile', 'Playwright.Dockerfile'];
const SNAPSHOT_ARG = /^ARG ([A-Z]+_SNAPSHOT)=(\d{8}T\d{6}Z)$/m;
const SNAPSHOT_HOSTS = [
  'https://snapshot.ubuntu.com/ubuntu/',
  'http://snapshot.debian.org/archive/',
];
const LIVE_ARCHIVE_HOSTS = [
  'archive.ubuntu.com',
  'security.ubuntu.com',
  'ports.ubuntu.com',
  'deb.debian.org',
  'ftp.debian.org',
  'security.debian.org',
];
const SOURCES_WRITE = /> \/etc\/apt\/sources\.list(?:\.d\/\S+)? /;
const DEBIAN_CODENAMES: Record<string, string> = { '13': 'trixie' };

const stagesOf = (dockerfile: string): string[] =>
  dockerfile.split(/^(?=FROM )/m).filter((stage) => stage.startsWith('FROM '));

const aptStages = (dockerfile: string): string[] =>
  stagesOf(dockerfile).filter((stage) => stage.includes('apt-get update'));

const aptSnapshotViolations = (dockerfile: string): string[] =>
  aptStages(dockerfile).flatMap((stage) => {
    const from = fromLines(stage)[0] ?? '';
    const beforeUpdate = stage.slice(0, stage.indexOf('apt-get update'));
    const argName = beforeUpdate.match(SNAPSHOT_ARG)?.[1];
    const checks: [boolean, string][] = [
      [argName !== undefined, 'declares no ARG <DISTRO>_SNAPSHOT=<YYYYMMDDTHHMMSSZ>'],
      [SOURCES_WRITE.test(beforeUpdate), 'does not rewrite the apt sources before apt-get update'],
      [
        SNAPSHOT_HOSTS.some((host) => beforeUpdate.includes(host)),
        'points apt at no snapshot archive',
      ],
      [
        argName !== undefined && beforeUpdate.includes(`\${${argName}}`),
        'does not build the source URL from the snapshot ARG',
      ],
      [
        !LIVE_ARCHIVE_HOSTS.some((host) => beforeUpdate.includes(host)),
        'also reads a live (non-snapshot) archive host',
      ],
    ];

    return checks.filter(([ok]) => !ok).map(([, problem]) => `${from}: ${problem}`);
  });

const aptInstalledPackages = (stage: string): string[] =>
  [...stage.matchAll(/apt-get install -y --no-install-recommends((?:[^;&]|\\\n)*)/g)].flatMap(
    (match) =>
      (match[1] ?? '')
        .split(/\s+/)
        .filter((token) => token !== '' && token !== '\\' && !token.startsWith('-'))
  );

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

describe('apt installs resolve from a fixed-timestamp snapshot archive (issue #300)', () => {
  it.each(APT_IMAGES)('%s rewrites its apt sources to the snapshot ARG before updating', (file) => {
    const dockerfile = readRepoFile(file);

    expect(aptStages(dockerfile).length).toBeGreaterThan(0);
    expect(aptSnapshotViolations(dockerfile)).toEqual([]);
  });

  it('flags an apt stage that still reads the live archive', () => {
    const live = [
      'FROM ubuntu:22.04@sha256:' + '0'.repeat(64),
      'RUN apt-get update && apt-get install -y --no-install-recommends curl=7.81.0-1ubuntu1.27',
      '',
    ].join('\n');
    const mirror = [
      'FROM ubuntu:22.04@sha256:' + '0'.repeat(64),
      'ARG UBUNTU_SNAPSHOT=20260925T000000Z',
      'RUN echo "deb http://archive.ubuntu.com/ubuntu jammy main" > /etc/apt/sources.list \\',
      '    && apt-get update',
      '',
    ].join('\n');
    const mixed = [
      'FROM ubuntu:22.04@sha256:' + '0'.repeat(64),
      'ARG UBUNTU_SNAPSHOT=20260925T000000Z',
      'RUN echo "deb https://snapshot.ubuntu.com/ubuntu/${UBUNTU_SNAPSHOT} jammy main" ' +
        '> /etc/apt/sources.list \\',
      '    && echo "deb http://archive.ubuntu.com/ubuntu jammy main" >> /etc/apt/sources.list \\',
      '    && apt-get update',
      '',
    ].join('\n');

    expect(aptSnapshotViolations(live)).toHaveLength(4);
    expect(aptSnapshotViolations(mirror)).toEqual([
      expect.stringContaining('points apt at no snapshot archive'),
      expect.stringContaining('does not build the source URL from the snapshot ARG'),
      expect.stringContaining('also reads a live (non-snapshot) archive host'),
    ]);
    expect(aptSnapshotViolations(mixed)).toEqual([
      expect.stringContaining('also reads a live (non-snapshot) archive host'),
    ]);
  });

  it.each(APT_IMAGES)('%s pins every apt package to an exact version', (file) => {
    const packages = aptStages(readRepoFile(file)).flatMap(aptInstalledPackages);

    expect(packages.length).toBeGreaterThan(0);
    for (const pkg of packages) {
      expect(pkg).toMatch(/^[a-z0-9][a-z0-9.+-]*=[0-9][\w.+~:-]*$/);
    }
  });

  it('reads the Ubuntu snapshot for the release the Playwright base image is built on', () => {
    const dockerfile = readRepoFile('Playwright.Dockerfile');
    const codename = fromLines(dockerfile)[0]?.match(/-([a-z]+)@sha256:/)?.[1];

    expect(codename).toBe('jammy');
    expect(dockerfile).toContain(
      `for suite in ${codename} ${codename}-updates ${codename}-security; do`
    );
    expect(dockerfile).toContain('done > /etc/apt/sources.list');
  });

  it('reads the Debian snapshot for the release the rust-code-analysis stage is built on', () => {
    const [stage] = aptStages(readRepoFile('Dockerfile'));
    const major = stage?.match(/debian:(\d+)-slim@sha256:/)?.[1] ?? '';
    const codename = DEBIAN_CODENAMES[major];

    expect(stage).toMatch(/^FROM \S+debian:\d+-slim@sha256:[0-9a-f]{64} AS rca$/m);
    expect(codename).toBeDefined();
    expect(stage).toContain(`debian "\${DEBIAN_SNAPSHOT}" "${codename} ${codename}-updates"`);
    expect(stage).toContain(`debian-security "\${DEBIAN_SNAPSHOT}" ${codename}-security`);
    expect(stage).toContain('Check-Valid-Until: no');
    expect(stage).toContain('> /etc/apt/sources.list.d/debian.sources; ');
  });
});

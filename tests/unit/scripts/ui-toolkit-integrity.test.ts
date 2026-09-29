/**
 * @jest-environment node
 */

import { createHash } from 'node:crypto';

import UiToolkitIntegrityVerifier from '@scripts/ci/ui-toolkit/ui-toolkit-integrity-verifier.mjs';
import UI_TOOLKIT_POLICY from '@scripts/ci/ui-toolkit/ui-toolkit-policy.mjs';

type Files = Record<string, string>;

type FakeFileSystem = { readFile: jest.Mock; readDir: jest.Mock };

type RunResult = { code: number; stdout: string; stderr: string; readFile: jest.Mock };

type Manifest = Record<string, unknown>;

const { PACKAGE_ROOT, CHECKSUMS_PATH, LOCKFILE_PATH, LOCKFILE_GATE_PATH } = UI_TOOLKIT_POLICY;
const FAIL_LINE = 'ui-toolkit integrity: FAIL\n';
const HASHED_FILES: Files = {
  'build/assets/Golos.woff2': 'font bytes',
  'build/index.mjs': 'export {};',
};

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function releaseUrl(tag: string, asset = tag): string {
  return (
    'https://github.com/VilnaCRM-Org/ui-toolkit/releases/download/' +
    `v${tag}/vilnacrm-ui-toolkit-${asset}.tgz`
  );
}

function installedFiles(version: string): Files {
  return {
    ...HASHED_FILES,
    'package.json': JSON.stringify({ name: '@vilnacrm/ui-toolkit', version }),
    LICENSE: 'license text',
    'README.md': 'readme text',
  };
}

function manifestFor(version: string, releaseChecksum: string): Manifest {
  const installed = installedFiles(version);
  return {
    comment: 'Reviewed digests.',
    algorithm: 'sha256',
    version,
    tarballUrl: releaseUrl(version),
    tarballSha256: sha256('fake release tarball bytes'),
    releaseChecksum,
    artifacts: ['build/assets/Golos.woff2', 'build/index.mjs', 'package.json'].map((path) => ({
      path,
      sha256: sha256(installed[path] ?? ''),
    })),
  };
}

function lockfile(workspaceSpec: string, packageSpec: string): string {
  return [
    '{',
    '  "workspaces": {',
    '    "": {',
    '      "dependencies": {',
    `        "@vilnacrm/ui-toolkit": "${workspaceSpec}",`,
    '      },',
    '    },',
    '  },',
    '  "packages": {',
    `    "@vilnacrm/ui-toolkit": ["@vilnacrm/ui-toolkit@${packageSpec}", ` +
      '{ "peerDependencies": {} }],',
    '  }',
    '}',
    '',
  ].join('\n');
}

function repository(version: string, releaseChecksum = 'absent'): Files {
  const spec = releaseUrl(version);
  const installed = Object.entries(installedFiles(version)).map(([path, content]) => [
    `${PACKAGE_ROOT}/${path}`,
    content,
  ]);
  return {
    'package.json': JSON.stringify({ dependencies: { '@vilnacrm/ui-toolkit': spec } }),
    [LOCKFILE_PATH]: lockfile(spec, spec),
    [LOCKFILE_GATE_PATH]: `#!/usr/bin/env sh\nTOOLKIT_URL='${spec}'\n`,
    [CHECKSUMS_PATH]: JSON.stringify(manifestFor(version, releaseChecksum), null, 2),
    ...Object.fromEntries(installed),
  };
}

function withManifest(files: Files, change: (manifest: Manifest) => Manifest): Files {
  const manifest = JSON.parse(files[CHECKSUMS_PATH] ?? '{}') as Manifest;
  return { ...files, [CHECKSUMS_PATH]: JSON.stringify(change(manifest), null, 2) };
}

function without(files: Files, filePath: string): Files {
  return Object.fromEntries(Object.entries(files).filter(([key]) => key !== filePath));
}

function entryKind(files: Files, links: string[], childPath: string): string {
  if (links.includes(childPath)) {
    return 'link';
  }
  return childPath in files ? 'file' : 'directory';
}

function fileSystem(files: Files, links: string[] = []): FakeFileSystem {
  const readFile = jest.fn((filePath: string, encoding?: BufferEncoding) => {
    const content = files[filePath];
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    return encoding === undefined ? Buffer.from(content) : content;
  });
  const readDir = jest.fn((dirPath: string) => {
    const prefix = `${dirPath}/`;
    const names = [...Object.keys(files), ...links]
      .filter((entryPath) => entryPath.startsWith(prefix))
      .map((entryPath) => entryPath.slice(prefix.length).split('/')[0] ?? '');
    return [...new Set(names)].map((name) => {
      const kind = entryKind(files, links, `${prefix}${name}`);
      return {
        name,
        isFile: (): boolean => kind === 'file',
        isDirectory: (): boolean => kind === 'directory',
      };
    });
  });
  return { readFile, readDir };
}

function runWith({ readFile, readDir }: FakeFileSystem): RunResult {
  const stdout = { write: jest.fn() };
  const stderr = { write: jest.fn() };
  const verifier = new UiToolkitIntegrityVerifier({ readFile, readDir });
  const code = verifier.run({ stdout, stderr });
  return {
    code,
    stdout: stdout.write.mock.calls.join(''),
    stderr: stderr.write.mock.calls.join(''),
    readFile,
  };
}

function runVerifier(files: Files, links: string[] = []): RunResult {
  return runWith(fileSystem(files, links));
}

function expectFailure(result: RunResult, className: string): void {
  expect(result.code).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr.startsWith(FAIL_LINE)).toBe(true);
  expect(result.stderr).toContain(`\n  - [${className}] `);
}

function findingLines(result: RunResult): string[] {
  return result.stderr.slice(FAIL_LINE.length).split('\n').filter(Boolean);
}

describe('UiToolkitIntegrityVerifier pass', () => {
  it.each([
    ['a v0.5.0 manifest with releaseChecksum "absent"', '0.5.0', 'absent'],
    ['a later manifest with releaseChecksum "matched"', '0.6.0', 'matched'],
  ])('accepts %s and prints the OK line', (_label, version, releaseChecksum) => {
    const result = runVerifier(repository(version, releaseChecksum));

    expect(result.code).toBe(0);
    expect(result.stdout).toBe(
      `ui-toolkit integrity: OK (v${version}, 3 artifacts verified, 0 extra files)\n`
    );
    expect(result.stderr).toBe('');
  });
});

describe('UiToolkitIntegrityVerifier [manifest] group', () => {
  const entry = (path: string, digest = sha256(path)): Manifest => ({ path, sha256: digest });

  it.each<[string, Files]>([
    ['a bad algorithm', withManifest(repository('0.5.0'), (m) => ({ ...m, algorithm: 'sha1' }))],
    ['an empty list', withManifest(repository('0.5.0'), (m) => ({ ...m, artifacts: [] }))],
    [
      'a list that is not an array',
      withManifest(repository('0.5.0'), (m) => ({ ...m, artifacts: {} })),
    ],
    [
      'a .. path',
      withManifest(repository('0.5.0'), (m) => ({
        ...m,
        artifacts: [entry('build/../package.json'), entry('package.json')],
      })),
    ],
    [
      'a . segment path',
      withManifest(repository('0.5.0'), (m) => ({
        ...m,
        artifacts: [entry('build/./index.mjs'), entry('package.json')],
      })),
    ],
    [
      'a non-object entry',
      withManifest(repository('0.5.0'), (m) => ({
        ...m,
        artifacts: [null, entry('package.json')],
      })),
    ],
    [
      'bad artifact hex',
      withManifest(repository('0.5.0'), (m) => ({
        ...m,
        artifacts: [entry('build/index.mjs', 'ABC'), entry('package.json')],
      })),
    ],
    [
      'bad tarballSha256 hex',
      withManifest(repository('0.5.0'), (m) => ({ ...m, tarballSha256: 'f'.repeat(63) })),
    ],
    [
      'a duplicate path',
      withManifest(repository('0.5.0'), (m) => ({
        ...m,
        artifacts: [entry('build/index.mjs'), entry('build/index.mjs'), entry('package.json')],
      })),
    ],
    [
      'an unsorted list',
      withManifest(repository('0.5.0'), (m) => ({
        ...m,
        artifacts: [entry('package.json'), entry('build/index.mjs')],
      })),
    ],
    [
      'a releaseChecksum outside CHECKSUM_STATES',
      withManifest(repository('0.5.0'), (m) => ({ ...m, releaseChecksum: 'skipped' })),
    ],
    [
      'releaseChecksum "absent" for a version outside RELEASES_WITHOUT_CHECKSUM',
      repository('0.6.0', 'absent'),
    ],
    ['an unparseable manifest', { ...repository('0.5.0'), [CHECKSUMS_PATH]: '{"algorithm":' }],
  ])('fails %s as [manifest]', (_label, files) => {
    const result = runVerifier(files);

    expectFailure(result, 'manifest');
    expect(findingLines(result).every((line) => line.startsWith('  - [manifest] '))).toBe(true);
  });

  it('names the offending path, digest and version in the details', () => {
    const files = withManifest(repository('0.6.0', 'absent'), (m) => ({
      ...m,
      algorithm: 'md5',
      artifacts: [entry('package.json'), entry('build/./index.mjs', 'XYZ'), entry('package.json')],
    }));

    expect(findingLines(runVerifier(files))).toEqual([
      '  - [manifest] algorithm is "md5"; expected "sha256"',
      '  - [manifest] releaseChecksum "absent" is allowed only for 0.5.0, not 0.6.0',
      '  - [manifest] path "build/./index.mjs" is not package.json ' +
        'or a build/ path without . or .. segments',
      '  - [manifest] build/./index.mjs sha256 "XYZ" is not 64 lower-case hex digits',
      '  - [manifest] path "package.json" is listed more than once',
      '  - [manifest] artifacts are not sorted by path',
    ]);
  });
});

describe('UiToolkitIntegrityVerifier [pin] group', () => {
  it.each([
    ['a package.json spec that is not a release-tarball URL', '^0.5.0'],
    ['a v0.5.0 tag with a 0.5.1 asset name', releaseUrl('0.5.0', '0.5.1')],
  ])('fails %s as [pin]', (_label, spec) => {
    const files = {
      ...repository('0.5.0'),
      'package.json': JSON.stringify({ dependencies: { '@vilnacrm/ui-toolkit': spec } }),
    };
    const result = runVerifier(files);

    expectFailure(result, 'pin');
    expect(findingLines(result)).toEqual([
      `  - [pin] package.json pins @vilnacrm/ui-toolkit to "${spec}", not a release-tarball URL`,
    ]);
  });
});

describe('UiToolkitIntegrityVerifier [drift] group', () => {
  const other = releaseUrl('0.5.1');
  const base = repository('0.5.0');
  const spec = releaseUrl('0.5.0');
  const workspaceLine = `        "@vilnacrm/ui-toolkit": "${spec}",`;
  const packageLinePrefix = `    "@vilnacrm/ui-toolkit": ["@vilnacrm/ui-toolkit@${spec}"`;
  const lock = base[LOCKFILE_PATH] ?? '';

  it.each<[string, Files]>([
    [
      'the package.json dependency mismatched',
      {
        ...base,
        'package.json': JSON.stringify({ dependencies: { '@vilnacrm/ui-toolkit': other } }),
      },
    ],
    ['the bun.lock workspace line mismatched', { ...base, [LOCKFILE_PATH]: lockfile(other, spec) }],
    ['the bun.lock packages entry mismatched', { ...base, [LOCKFILE_PATH]: lockfile(spec, other) }],
    [
      'the manifest tarballUrl mismatched',
      withManifest(base, (m) => ({ ...m, tarballUrl: other })),
    ],
    ['the manifest version mismatched', withManifest(base, (m) => ({ ...m, version: '0.5.1' }))],
    [
      'the gate literal mismatched',
      { ...base, [LOCKFILE_GATE_PATH]: `#!/usr/bin/env sh\nTOOLKIT_URL='${other}'\n` },
    ],
    [
      'the bun.lock workspace line missing',
      { ...base, [LOCKFILE_PATH]: lock.replace(`${workspaceLine}\n`, '') },
    ],
    [
      'the bun.lock workspace line doubled',
      {
        ...base,
        [LOCKFILE_PATH]: lock.replace(workspaceLine, `${workspaceLine}\n${workspaceLine}`),
      },
    ],
    [
      'the bun.lock packages entry missing',
      { ...base, [LOCKFILE_PATH]: lock.replace(packageLinePrefix, '    "other": ["other@1.0.0"') },
    ],
    [
      'the bun.lock packages entry doubled',
      {
        ...base,
        [LOCKFILE_PATH]: lock.replace(
          packageLinePrefix,
          `${packageLinePrefix}, {}],\n${packageLinePrefix}`
        ),
      },
    ],
  ])('fails %s as [drift]', (_label, files) => {
    expectFailure(runVerifier(files), 'drift');
  });
});

describe('UiToolkitIntegrityVerifier [install] group', () => {
  it('fails a missing installed package.json and names the make install remedy', () => {
    const result = runVerifier(without(repository('0.5.0'), `${PACKAGE_ROOT}/package.json`));

    expectFailure(result, 'install');
    expect(result.stderr).toContain(
      'run make install, which runs bun install --frozen-lockfile in the dev container'
    );
  });

  it('fails an installed version other than the pinned one', () => {
    const files = {
      ...repository('0.5.0'),
      [`${PACKAGE_ROOT}/package.json`]: JSON.stringify({ version: '0.4.0' }),
    };

    expect(findingLines(runVerifier(files))).toEqual([
      '  - [install] the installed toolkit is 0.4.0 but package.json pins 0.5.0; run make install',
    ]);
  });

  it('turns a readFile that throws inside the digest loop into an [install] finding', () => {
    const fake = fileSystem(repository('0.5.0'));
    const readFile = jest.fn((filePath: string, encoding?: BufferEncoding) => {
      if (filePath === `${PACKAGE_ROOT}/build/index.mjs`) {
        throw new Error('EIO: i/o error');
      }
      return fake.readFile(filePath, encoding);
    });

    const result = runWith({ readFile, readDir: fake.readDir });

    expect(result.code).toBe(1);
    expect(findingLines(result)).toEqual(['  - [install] verification stopped: EIO: i/o error']);
  });
});

describe('UiToolkitIntegrityVerifier [digest] group', () => {
  it('fails an installed file whose sha256 differs from the manifest', () => {
    const files = { ...repository('0.5.0'), [`${PACKAGE_ROOT}/build/index.mjs`]: 'tampered' };
    const result = runVerifier(files);

    expectFailure(result, 'digest');
    expect(findingLines(result)).toEqual([
      `  - [digest] build/index.mjs hashes to ${sha256('tampered')}; ` +
        `${CHECKSUMS_PATH} records ${sha256('export {};')}`,
    ]);
  });
});

describe('UiToolkitIntegrityVerifier [missing] group', () => {
  it('fails a manifest path that is absent from the install', () => {
    const result = runVerifier(without(repository('0.5.0'), `${PACKAGE_ROOT}/build/index.mjs`));

    expectFailure(result, 'missing');
    expect(findingLines(result)).toEqual([
      `  - [missing] build/index.mjs is in ${CHECKSUMS_PATH} but not installed`,
    ]);
  });
});

describe('UiToolkitIntegrityVerifier [extra] group', () => {
  it.each([
    ['an unlisted root file', 'index.js'],
    ['a nested node_modules/ file', 'node_modules/left-pad/index.js'],
  ])('fails %s across the whole package root', (_label, relativePath) => {
    const files = { ...repository('0.5.0'), [`${PACKAGE_ROOT}/${relativePath}`]: 'extra' };
    const result = runVerifier(files);

    expectFailure(result, 'extra');
    expect(findingLines(result)).toEqual([
      `  - [extra] ${relativePath} is installed but neither in ${CHECKSUMS_PATH} nor unhashed`,
    ]);
  });

  it('fails a symbolic link and reports it without reading it', () => {
    const link = `${PACKAGE_ROOT}/build/escape.mjs`;
    const result = runVerifier(repository('0.5.0'), [link]);

    expectFailure(result, 'extra');
    expect(findingLines(result)).toEqual([
      '  - [extra] build/escape.mjs is not a regular file; it is reported without being read',
    ]);
    expect(result.readFile).not.toHaveBeenCalledWith(link);
    expect(result.readFile).not.toHaveBeenCalledWith(link, 'utf8');
  });
});

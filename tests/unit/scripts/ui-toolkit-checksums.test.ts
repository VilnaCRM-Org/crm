/**
 * @jest-environment node
 */

import UiToolkitChecksumsBuilder from '@scripts/ci/ui-toolkit/ui-toolkit-checksums-builder.mjs';
import UiToolkitInstallSource from '@scripts/ci/ui-toolkit/ui-toolkit-install-source.mjs';
import UI_TOOLKIT_POLICY from '@scripts/ci/ui-toolkit/ui-toolkit-policy.mjs';
import { fileSystem, releaseUrl, sha256, type Files } from '@tests/utils/ui-toolkit-fixtures';

type Manifest = {
  comment: string;
  algorithm: string;
  version: string;
  tarballUrl: string;
  tarballSha256: string;
  releaseChecksum: string;
  artifacts: { path: string; sha256: string }[];
};

const { PACKAGE_ROOT, CHECKSUMS_PATH, DEFAULT_COMMENT } = UI_TOOLKIT_POLICY;
const ASSET_BYTES = 'fake release tarball bytes';
const EXPECTED_PATHS = [
  'build/Golos-OFL.txt',
  'build/assets/Golos.woff2',
  'build/index.mjs',
  'package.json',
];

function repository(version: string, spec = releaseUrl(version)): Files {
  return {
    'package.json': JSON.stringify({ dependencies: { '@vilnacrm/ui-toolkit': spec } }),
    [`${PACKAGE_ROOT}/package.json`]: JSON.stringify({ name: '@vilnacrm/ui-toolkit', version }),
    [`${PACKAGE_ROOT}/LICENSE`]: 'license text',
    [`${PACKAGE_ROOT}/README.md`]: 'readme text',
    [`${PACKAGE_ROOT}/build/index.mjs`]: 'export {};',
    [`${PACKAGE_ROOT}/build/assets/Golos.woff2`]: 'font bytes',
    [`${PACKAGE_ROOT}/build/Golos-OFL.txt`]: 'font licence',
  };
}

function respond(body: string | null, status: number): () => Promise<Response> {
  return () => Promise.resolve(new Response(body, { status }));
}

function reject(message: string): () => Promise<Response> {
  return () => Promise.reject(new Error(message));
}

function fetchWith(tarball: () => Promise<Response>, sidecar: () => Promise<Response>): jest.Mock {
  return jest.fn((url: string) => (url.endsWith('.sha256') ? sidecar() : tarball()));
}

function sidecarFor(version: string, digest = sha256(ASSET_BYTES), asset = version): string {
  return `${digest}  vilnacrm-ui-toolkit-${asset}.tgz\n`;
}

async function runBuilder(
  files: Files,
  fetch: jest.Mock,
  links: string[] = []
): Promise<{ code: number; stdout: string; stderr: string; writeFile: jest.Mock }> {
  const { readFile, readDir } = fileSystem(files, links);
  const writeFile = jest.fn();
  const stdout = { write: jest.fn() };
  const stderr = { write: jest.fn() };
  const builder = new UiToolkitChecksumsBuilder({ readFile, readDir, writeFile, fetch });
  const code = await builder.run({ stdout, stderr });
  return {
    code,
    stdout: stdout.write.mock.calls.join(''),
    stderr: stderr.write.mock.calls.join(''),
    writeFile,
  };
}

function writtenManifest(writeFile: jest.Mock): Manifest {
  expect(writeFile).toHaveBeenCalledTimes(1);
  const [target, text] = writeFile.mock.calls[0] as [string, string];
  expect(target).toBe(CHECKSUMS_PATH);
  const manifest = JSON.parse(text) as Manifest;
  expect(text).toBe(`${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

function expectRefusal(
  result: { code: number; stderr: string; writeFile: jest.Mock },
  tag: string
): void {
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(`  - [${tag}] `);
  expect(result.writeFile).not.toHaveBeenCalled();
}

describe('UiToolkitChecksumsBuilder refusals', () => {
  it.each([
    ['a semver range', '^0.5.0'],
    ['a v0.5.0 tag with a 0.5.1 asset', releaseUrl('0.5.0', '0.5.1')],
  ])('refuses %s as [pin] before any download or write', async (_label, spec) => {
    const fetch = fetchWith(respond(ASSET_BYTES, 200), respond(null, 404));
    const result = await runBuilder(repository('0.5.0', spec), fetch);

    expectRefusal(result, 'pin');
    expect(result.stderr).toContain(spec);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a package.json without a dependencies map as [pin]', async () => {
    const files = { ...repository('0.5.0'), 'package.json': '{}' };
    const fetch = fetchWith(respond(ASSET_BYTES, 200), respond(null, 404));
    const result = await runBuilder(files, fetch);

    expectRefusal(result, 'pin');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses an installed version other than the pinned one as [install]', async () => {
    const files = {
      ...repository('0.5.0'),
      [`${PACKAGE_ROOT}/package.json`]: JSON.stringify({ version: '0.4.0' }),
    };
    const fetch = fetchWith(respond(ASSET_BYTES, 200), respond(null, 404));
    const result = await runBuilder(files, fetch);

    expectRefusal(result, 'install');
    expect(result.stderr).toContain('0.4.0');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a missing installed package as [install] and names make install', async () => {
    const { [`${PACKAGE_ROOT}/package.json`]: _installed, ...files } = repository('0.5.0');
    const fetch = fetchWith(respond(ASSET_BYTES, 200), respond(null, 404));
    const result = await runBuilder(files, fetch);

    expectRefusal(result, 'install');
    expect(result.stderr).toContain('run make install');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['the tarball request rejects', reject('network down'), respond(null, 404), 'network down'],
    ['the tarball request answers 404', respond(null, 404), respond(null, 404), 'HTTP 404'],
    ['the .sha256 request rejects', respond(ASSET_BYTES, 200), reject('reset'), 'reset'],
    ['the .sha256 request answers 500', respond(ASSET_BYTES, 200), respond(null, 500), 'HTTP 500'],
  ])('refuses as [download] when %s', async (_label, tarball, sidecar, detail) => {
    const result = await runBuilder(repository('0.5.0'), fetchWith(tarball, sidecar));

    expectRefusal(result, 'download');
    expect(result.stderr).toContain(detail);
  });

  it.each([
    ['a malformed .sha256 body', '0.6.0', respond('not a checksum line\n', 200)],
    [
      'a .sha256 body naming another asset',
      '0.6.0',
      respond(sidecarFor('0.6.0', sha256(ASSET_BYTES), '0.6.1'), 200),
    ],
    [
      'a .sha256 body carrying another digest',
      '0.6.0',
      respond(sidecarFor('0.6.0', sha256('other bytes')), 200),
    ],
    ['a .sha256 404 for a release that must publish one', '0.6.0', respond(null, 404)],
  ])('refuses %s as [checksum]', async (_label, version, sidecar) => {
    const result = await runBuilder(
      repository(version),
      fetchWith(respond(ASSET_BYTES, 200), sidecar)
    );

    expectRefusal(result, 'checksum');
  });

  it('refuses an installed tree with a symbolic link as [install] and never reads it', async () => {
    const link = `${PACKAGE_ROOT}/build/escape.mjs`;
    const { readFile, readDir } = fileSystem(repository('0.5.0'), [link]);
    const writeFile = jest.fn();
    const stderr = { write: jest.fn() };
    const builder = new UiToolkitChecksumsBuilder({
      readFile,
      readDir,
      writeFile,
      fetch: fetchWith(respond(ASSET_BYTES, 200), respond(null, 404)),
    });

    await expect(builder.run({ stdout: { write: jest.fn() }, stderr })).resolves.toBe(1);
    expect(stderr.write.mock.calls.join('')).toContain('[install] build/escape.mjs');
    expect(readFile).not.toHaveBeenCalledWith(link);
    expect(writeFile).not.toHaveBeenCalled();
  });
});

describe('UiToolkitChecksumsBuilder writes', () => {
  it('writes the v0.5.0 shape with "absent" and keeps the existing comment', async () => {
    const files = {
      ...repository('0.5.0'),
      [CHECKSUMS_PATH]: JSON.stringify({ comment: 'Reviewed digests.', version: '9.9.9' }),
    };
    const fetch = fetchWith(respond(ASSET_BYTES, 200), respond(null, 404));
    const result = await runBuilder(files, fetch);

    expect(result.code).toBe(0);
    expect(fetch.mock.calls).toEqual([[releaseUrl('0.5.0')], [`${releaseUrl('0.5.0')}.sha256`]]);
    const manifest = writtenManifest(result.writeFile);
    expect(manifest).toEqual({
      comment: 'Reviewed digests.',
      algorithm: 'sha256',
      version: '0.5.0',
      tarballUrl: releaseUrl('0.5.0'),
      tarballSha256: sha256(ASSET_BYTES),
      releaseChecksum: 'absent',
      artifacts: EXPECTED_PATHS.map((path) => ({
        path,
        sha256: sha256(repository('0.5.0')[`${PACKAGE_ROOT}/${path}`] ?? ''),
      })),
    });
    expect(result.stdout).toBe(
      `ui-toolkit checksums: wrote ${CHECKSUMS_PATH} ` +
        '(v0.5.0, 4 artifacts, releaseChecksum absent)\n'
    );
    expect(result.stderr).toBe('');
  });

  it('writes releaseChecksum "matched" for a later release whose .sha256 agrees', async () => {
    const files = {
      ...repository('0.6.0'),
      [CHECKSUMS_PATH]: JSON.stringify({ comment: 'Reviewed digests.' }),
    };
    const result = await runBuilder(
      files,
      fetchWith(respond(ASSET_BYTES, 200), respond(sidecarFor('0.6.0'), 200))
    );

    expect(result.code).toBe(0);
    const manifest = writtenManifest(result.writeFile);
    expect(manifest).toMatchObject({
      comment: 'Reviewed digests.',
      version: '0.6.0',
      tarballUrl: releaseUrl('0.6.0'),
      tarballSha256: sha256(ASSET_BYTES),
      releaseChecksum: 'matched',
    });
    expect(manifest.artifacts.map(({ path }) => path)).toEqual(EXPECTED_PATHS);
  });

  it.each([
    ['no manifest exists yet', repository('0.5.0')],
    [
      'the existing manifest carries no comment',
      { ...repository('0.5.0'), [CHECKSUMS_PATH]: JSON.stringify({ version: '0.5.0' }) },
    ],
  ])('writes the default comment when %s', async (_label, files) => {
    const result = await runBuilder(
      files,
      fetchWith(respond(ASSET_BYTES, 200), respond(null, 404))
    );

    expect(result.code).toBe(0);
    expect(writtenManifest(result.writeFile).comment).toBe(DEFAULT_COMMENT);
  });
});

describe('UiToolkitInstallSource', () => {
  it('reports a symbolic link as a non-regular entry by its path and never reads it', () => {
    const link = `${PACKAGE_ROOT}/build/escape.mjs`;
    const { readFile, readDir } = fileSystem(repository('0.5.0'), [link]);
    const source = new UiToolkitInstallSource({ readFile, readDir });

    const tree = source.listTree();

    expect(tree.findings).toEqual([
      {
        className: 'extra',
        detail: 'build/escape.mjs is not a regular file; it is reported without being read',
      },
    ]);
    expect(tree.files).not.toContain('build/escape.mjs');
    expect([...tree.files].sort()).toEqual(['LICENSE', 'README.md', ...EXPECTED_PATHS].sort());
    expect(readFile).not.toHaveBeenCalled();
  });

  it('hashes one installed file from its raw bytes', () => {
    const { readFile, readDir } = fileSystem(repository('0.5.0'));
    const source = new UiToolkitInstallSource({ readFile, readDir });

    expect(source.digest('build/index.mjs')).toBe(sha256('export {};'));
    expect(readFile).toHaveBeenCalledWith(`${PACKAGE_ROOT}/build/index.mjs`);
  });
});

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

type Release = { immutable?: unknown; assets?: unknown };

const { PACKAGE_ROOT, CHECKSUMS_PATH, DEFAULT_COMMENT, RELEASE_API_URL } = UI_TOOLKIT_POLICY;
const ACCEPT_HEADERS = { headers: { Accept: 'application/vnd.github+json' } };
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

function fetchWith(tarball: () => Promise<Response>, release: () => Promise<Response>): jest.Mock {
  return jest.fn((url: string) => (url.startsWith(RELEASE_API_URL) ? release() : tarball()));
}

function releaseApiUrl(version: string): string {
  return `https://api.github.com/repos/VilnaCRM-Org/ui-toolkit/releases/tags/v${version}`;
}

function releaseFor(version: string, overrides: Release = {}): Release {
  return {
    immutable: true,
    assets: [
      { name: 'provenance.intoto.jsonl', digest: `sha256:${sha256('provenance')}` },
      { name: `vilnacrm-ui-toolkit-${version}.tgz`, digest: `sha256:${sha256(ASSET_BYTES)}` },
    ],
    ...overrides,
  };
}

function assetWith(version: string, digest: unknown): Release {
  return { assets: [{ name: `vilnacrm-ui-toolkit-${version}.tgz`, digest }] };
}

function releaseJson(release: unknown): () => Promise<Response> {
  return respond(JSON.stringify(release), 200);
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
  const builder = new UiToolkitChecksumsBuilder({
    readFile,
    readDir,
    writeFile,
    fetch,
    token: undefined,
  });
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
    const fetch = fetchWith(respond(ASSET_BYTES, 200), releaseJson(releaseFor('0.5.0')));
    const result = await runBuilder(repository('0.5.0', spec), fetch);

    expectRefusal(result, 'pin');
    expect(result.stderr).toContain(spec);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a package.json without a dependencies map as [pin]', async () => {
    const files = { ...repository('0.5.0'), 'package.json': '{}' };
    const fetch = fetchWith(respond(ASSET_BYTES, 200), releaseJson(releaseFor('0.5.0')));
    const result = await runBuilder(files, fetch);

    expectRefusal(result, 'pin');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses an installed version other than the pinned one as [install]', async () => {
    const files = {
      ...repository('0.5.0'),
      [`${PACKAGE_ROOT}/package.json`]: JSON.stringify({ version: '0.4.0' }),
    };
    const fetch = fetchWith(respond(ASSET_BYTES, 200), releaseJson(releaseFor('0.5.0')));
    const result = await runBuilder(files, fetch);

    expectRefusal(result, 'install');
    expect(result.stderr).toContain('0.4.0');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses a missing installed package as [install] and names make install', async () => {
    const { [`${PACKAGE_ROOT}/package.json`]: _installed, ...files } = repository('0.5.0');
    const fetch = fetchWith(respond(ASSET_BYTES, 200), releaseJson(releaseFor('0.5.0')));
    const result = await runBuilder(files, fetch);

    expectRefusal(result, 'install');
    expect(result.stderr).toContain('run make install');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [
      'the tarball request rejects',
      reject('network down'),
      respond(null, 404),
      `${releaseUrl('0.6.0')}: network down`,
    ],
    [
      'the tarball request answers 404',
      respond(null, 404),
      respond(null, 404),
      `${releaseUrl('0.6.0')}: answered HTTP 404`,
    ],
    [
      'the release API request rejects',
      respond(ASSET_BYTES, 200),
      reject('reset'),
      `${releaseApiUrl('0.6.0')}: reset`,
    ],
    [
      'the release API answers 404',
      respond(ASSET_BYTES, 200),
      respond(null, 404),
      `${releaseApiUrl('0.6.0')}: answered HTTP 404`,
    ],
    [
      'the release API answers 403',
      respond(ASSET_BYTES, 200),
      respond(null, 403),
      `${releaseApiUrl('0.6.0')}: answered HTTP 403`,
    ],
  ])('refuses as [download] when %s', async (_label, tarball, release, detail) => {
    const result = await runBuilder(repository('0.6.0'), fetchWith(tarball, release));

    expectRefusal(result, 'download');
    expect(result.stderr).toContain(detail);
  });

  it.each<[string, () => Promise<Response>, string]>([
    ['a body that is not JSON', respond('not json', 200), 'the body is not JSON'],
    [
      'a release that is not immutable',
      releaseJson(releaseFor('0.6.0', { immutable: false })),
      'the release is not immutable, so its asset digests are not a stable anchor',
    ],
    [
      'a release without an immutable field',
      releaseJson({ assets: releaseFor('0.6.0').assets }),
      'the release is not immutable, so its asset digests are not a stable anchor',
    ],
    [
      'a JSON null body',
      releaseJson(null),
      'the release is not immutable, so its asset digests are not a stable anchor',
    ],
    [
      'a release that lists only another asset',
      releaseJson(releaseFor('0.6.0', assetWith('0.6.1', `sha256:${sha256(ASSET_BYTES)}`))),
      'the release lists no asset named vilnacrm-ui-toolkit-0.6.0.tgz',
    ],
    [
      'a release whose assets field is not a list',
      releaseJson(releaseFor('0.6.0', { assets: {} })),
      'the release lists no asset named vilnacrm-ui-toolkit-0.6.0.tgz',
    ],
    [
      'a release whose asset list holds a null entry',
      releaseJson(releaseFor('0.6.0', { assets: [null] })),
      'the release lists no asset named vilnacrm-ui-toolkit-0.6.0.tgz',
    ],
    [
      'an asset whose digest is null',
      releaseJson(releaseFor('0.6.0', assetWith('0.6.0', null))),
      'vilnacrm-ui-toolkit-0.6.0.tgz carries no digest',
    ],
    [
      'an asset without a digest field',
      releaseJson(releaseFor('0.6.0', { assets: [{ name: 'vilnacrm-ui-toolkit-0.6.0.tgz' }] })),
      'vilnacrm-ui-toolkit-0.6.0.tgz carries no digest',
    ],
    [
      'an asset whose digest is bare hex',
      releaseJson(releaseFor('0.6.0', assetWith('0.6.0', sha256(ASSET_BYTES)))),
      `vilnacrm-ui-toolkit-0.6.0.tgz digest "${sha256(ASSET_BYTES)}" ` +
        'is not sha256: and 64 lower-case hex digits',
    ],
    [
      'an asset whose digest names another algorithm',
      releaseJson(releaseFor('0.6.0', assetWith('0.6.0', `sha512:${sha256(ASSET_BYTES)}`))),
      `vilnacrm-ui-toolkit-0.6.0.tgz digest "sha512:${sha256(ASSET_BYTES)}" ` +
        'is not sha256: and 64 lower-case hex digits',
    ],
    [
      'an asset whose digest records other bytes',
      releaseJson(releaseFor('0.6.0', assetWith('0.6.0', `sha256:${sha256('other bytes')}`))),
      `vilnacrm-ui-toolkit-0.6.0.tgz records sha256:${sha256('other bytes')}, ` +
        `but the asset hashes to sha256:${sha256(ASSET_BYTES)}`,
    ],
  ])('refuses %s as [checksum] naming the release API URL', async (_label, release, reason) => {
    const result = await runBuilder(
      repository('0.6.0'),
      fetchWith(respond(ASSET_BYTES, 200), release)
    );

    expectRefusal(result, 'checksum');
    expect(result.stderr).toBe(
      `ui-toolkit checksums: REFUSED (${CHECKSUMS_PATH} unchanged)\n` +
        `  - [checksum] ${releaseApiUrl('0.6.0')}: ${reason}\n`
    );
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
      fetch: fetchWith(respond(ASSET_BYTES, 200), releaseJson(releaseFor('0.5.0'))),
      token: undefined,
    });

    await expect(builder.run({ stdout: { write: jest.fn() }, stderr })).resolves.toBe(1);
    expect(stderr.write.mock.calls.join('')).toContain('[install] build/escape.mjs');
    expect(readFile).not.toHaveBeenCalledWith(link);
    expect(writeFile).not.toHaveBeenCalled();
  });
});

describe('UiToolkitChecksumsBuilder writes', () => {
  it('writes "matched" when the release digest agrees and keeps the comment', async () => {
    const files = {
      ...repository('0.6.0'),
      [CHECKSUMS_PATH]: JSON.stringify({ comment: 'Reviewed digests.', version: '9.9.9' }),
    };
    const fetch = fetchWith(respond(ASSET_BYTES, 200), releaseJson(releaseFor('0.6.0')));
    const result = await runBuilder(files, fetch);

    expect(result.code).toBe(0);
    expect(fetch.mock.calls).toEqual([
      [releaseUrl('0.6.0'), {}],
      [releaseApiUrl('0.6.0'), ACCEPT_HEADERS],
    ]);
    const manifest = writtenManifest(result.writeFile);
    expect(manifest).toEqual({
      comment: 'Reviewed digests.',
      algorithm: 'sha256',
      version: '0.6.0',
      tarballUrl: releaseUrl('0.6.0'),
      tarballSha256: sha256(ASSET_BYTES),
      releaseChecksum: 'matched',
      artifacts: EXPECTED_PATHS.map((path) => ({
        path,
        sha256: sha256(repository('0.6.0')[`${PACKAGE_ROOT}/${path}`] ?? ''),
      })),
    });
    expect(result.stdout).toBe(
      `ui-toolkit checksums: wrote ${CHECKSUMS_PATH} ` +
        '(v0.6.0, 4 artifacts, releaseChecksum matched)\n'
    );
    expect(result.stderr).toBe('');
  });

  it.each([
    ['a token', 'ghs_example', { ...ACCEPT_HEADERS.headers, Authorization: 'Bearer ghs_example' }],
    ['an empty token', '', ACCEPT_HEADERS.headers],
    ['no token', undefined, ACCEPT_HEADERS.headers],
  ])('asks the release API with %s', async (_label, token, headers) => {
    const { readFile, readDir } = fileSystem(repository('0.6.0'));
    const fetch = fetchWith(respond(ASSET_BYTES, 200), releaseJson(releaseFor('0.6.0')));
    const builder = new UiToolkitChecksumsBuilder({
      readFile,
      readDir,
      writeFile: jest.fn(),
      fetch,
      token,
    });

    await expect(
      builder.run({ stdout: { write: jest.fn() }, stderr: { write: jest.fn() } })
    ).resolves.toBe(0);
    expect(fetch).toHaveBeenCalledWith(releaseApiUrl('0.6.0'), { headers });
    expect(fetch).toHaveBeenCalledWith(releaseUrl('0.6.0'), {});
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
      fetchWith(respond(ASSET_BYTES, 200), releaseJson(releaseFor('0.5.0')))
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

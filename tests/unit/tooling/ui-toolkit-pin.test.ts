/**
 * @jest-environment node
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import UiToolkitPinSource from '@scripts/ci/ui-toolkit/ui-toolkit-pin-source.mjs';
import UI_TOOLKIT_POLICY from '@scripts/ci/ui-toolkit/ui-toolkit-policy.mjs';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const {
  PACKAGE_JSON_PATH,
  LOCKFILE_PATH,
  CHECKSUMS_PATH,
  LOCKFILE_GATE_PATH,
  WORKSPACE_LINE_PATTERN,
  PACKAGE_LINE_PATTERN,
  GATE_LITERAL_PATTERN,
  RELEASES_WITHOUT_CHECKSUM,
} = UI_TOOLKIT_POLICY;
const OTHER_URL =
  'https://github.com/VilnaCRM-Org/ui-toolkit/releases/download/' +
  'v0.5.1/vilnacrm-ui-toolkit-0.5.1.tgz';

type Edit = [file: string, change: (text: string) => string];

function readRepositoryFile(filePath: string, encoding: BufferEncoding): string {
  return readFileSync(path.join(REPO_ROOT, filePath), encoding);
}

function pinnedSpec(): string {
  const pin = new UiToolkitPinSource({ readFile: readRepositoryFile }).readPackagePin();
  return String(pin.spec);
}

function editedSource(edits: Edit[]): UiToolkitPinSource {
  const changes = new Map(edits);
  const readFile = (filePath: string, encoding: BufferEncoding): string => {
    const change = changes.get(filePath) ?? ((text: string): string => text);
    return change(readRepositoryFile(filePath, encoding));
  };
  return new UiToolkitPinSource({ readFile });
}

function swapIn(pattern: RegExp): (text: string) => string {
  return (text) => text.replace(pattern, (line) => line.replace(pinnedSpec(), OTHER_URL));
}

function drop(pattern: RegExp): (text: string) => string {
  return (text) => text.replace(pattern, '');
}

function double(pattern: RegExp): (text: string) => string {
  return (text) => text.replace(pattern, (line) => `${line}\n${line}`);
}

function editManifest(field: 'tarballUrl' | 'version', value: string): Edit {
  return [
    CHECKSUMS_PATH,
    (text): string => JSON.stringify({ ...JSON.parse(text), [field]: value }, null, 2),
  ];
}

describe('ui-toolkit pin statements in the real repository', () => {
  it('reports zero drift across the five pin statements', () => {
    const source = new UiToolkitPinSource({ readFile: readRepositoryFile });

    expect(source.compareStatements()).toEqual([]);
  });

  it('captures the version that the committed manifest names', () => {
    const manifest = JSON.parse(readRepositoryFile(CHECKSUMS_PATH, 'utf8')) as {
      version: string;
      tarballUrl: string;
    };
    const pin = new UiToolkitPinSource({ readFile: readRepositoryFile }).readPackagePin();

    expect(pin).toEqual({ spec: manifest.tarballUrl, version: manifest.version });
  });

  it('reports exactly one drift finding when the gate literal is swapped for v0.5.1', () => {
    const source = editedSource([[LOCKFILE_GATE_PATH, swapIn(GATE_LITERAL_PATTERN)]]);

    expect(source.compareStatements()).toEqual([
      {
        className: 'drift',
        detail:
          `${LOCKFILE_GATE_PATH} TOOLKIT_URL is "${OTHER_URL}"; ` +
          `${PACKAGE_JSON_PATH} pins "${pinnedSpec()}"`,
      },
    ]);
  });

  it('keeps RELEASES_WITHOUT_CHECKSUM at exactly one frozen release', () => {
    expect(RELEASES_WITHOUT_CHECKSUM).toEqual(['0.5.0']);
    expect(Object.isFrozen(RELEASES_WITHOUT_CHECKSUM)).toBe(true);
  });
});

describe('ui-toolkit pin drift cases', () => {
  it.each<[string, Edit[], number]>([
    [
      'the package.json dependency mismatched',
      [[PACKAGE_JSON_PATH, (text): string => text.replace(pinnedSpec(), OTHER_URL)]],
      5,
    ],
    [
      'the package.json dependency not a release URL',
      [[PACKAGE_JSON_PATH, (text): string => text.replace(pinnedSpec(), '^0.5.1')]],
      5,
    ],
    [
      'the bun.lock workspace line mismatched',
      [[LOCKFILE_PATH, swapIn(WORKSPACE_LINE_PATTERN)]],
      1,
    ],
    ['the bun.lock packages entry mismatched', [[LOCKFILE_PATH, swapIn(PACKAGE_LINE_PATTERN)]], 1],
    ['the manifest tarballUrl mismatched', [editManifest('tarballUrl', OTHER_URL)], 1],
    ['the manifest version mismatched', [editManifest('version', '0.5.1')], 1],
    ['the gate literal mismatched', [[LOCKFILE_GATE_PATH, swapIn(GATE_LITERAL_PATTERN)]], 1],
    ['the bun.lock workspace line missing', [[LOCKFILE_PATH, drop(WORKSPACE_LINE_PATTERN)]], 1],
    ['the bun.lock workspace line doubled', [[LOCKFILE_PATH, double(WORKSPACE_LINE_PATTERN)]], 1],
    ['the bun.lock packages entry missing', [[LOCKFILE_PATH, drop(PACKAGE_LINE_PATTERN)]], 1],
    ['the bun.lock packages entry doubled', [[LOCKFILE_PATH, double(PACKAGE_LINE_PATTERN)]], 1],
    ['the gate literal missing', [[LOCKFILE_GATE_PATH, drop(GATE_LITERAL_PATTERN)]], 1],
    ['the gate literal doubled', [[LOCKFILE_GATE_PATH, double(GATE_LITERAL_PATTERN)]], 1],
  ])('reports drift when %s', (_label, edits, count) => {
    const findings = editedSource(edits).compareStatements();

    expect(findings).toHaveLength(count);
    expect(findings.map(({ className }) => className)).toEqual(Array(count).fill('drift'));
  });
});

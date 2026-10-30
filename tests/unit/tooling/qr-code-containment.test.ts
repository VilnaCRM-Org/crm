// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const SETTINGS_ROOT = 'src/modules/user/features/settings';
const ENCODER_OWNER = `${SETTINGS_ROOT}/components/qr-code-image/index.tsx`;

const toPosix = (filePath: string): string =>
  path.relative(repoRoot, filePath).split(path.sep).join('/');

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [toPosix(full)];
  });

const sources = walk(path.join(repoRoot, 'src')).filter((file) => /\.(ts|tsx)$/.test(file));
const read = (file: string): string => fs.readFileSync(path.join(repoRoot, file), 'utf8');
const importersOf = (pattern: RegExp): string[] =>
  sources.filter((file) => pattern.test(read(file)));

describe('QR code containment', () => {
  it('lets only qr-code-image import qrcode-generator', () => {
    expect(importersOf(/from\s+'qrcode-generator'|import\(\s*'qrcode-generator'/)).toEqual([
      ENCODER_OWNER,
    ]);
  });

  it('lets only the settings feature import the QR image and the clipboard hook', () => {
    const outsiders = importersOf(/qr-code-image|use-copy-to-clipboard/).filter(
      (file) => !file.startsWith(`${SETTINGS_ROOT}/`)
    );

    expect(outsiders).toEqual([]);
  });

  it('keeps unsafe sinks out of the QR image source', () => {
    const source = read(ENCODER_OWNER);

    expect(source).not.toMatch(/dangerouslySetInnerHTML|data:|eval\(|new Function|fetch\(|XMLHttp/);
  });

  it('pins qrcode-generator exactly in dependencies and the decoder in devDependencies', () => {
    const manifest = JSON.parse(read('package.json')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(manifest.dependencies['qrcode-generator']).toBe('2.0.4');
    expect(manifest.devDependencies['jsqr']).toBe('1.4.0');
    expect(manifest.dependencies['jsqr']).toBeUndefined();
    expect(manifest.devDependencies['qrcode-generator']).toBeUndefined();
  });
});

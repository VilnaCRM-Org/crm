import fs from 'fs';
import path from 'path';

const readPublicIndex = (): string =>
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'public/index.html'), 'utf-8');
const publicDir = path.resolve(__dirname, '..', '..', '..', 'public');
const readPublicJson = <T>(filename: string): T =>
  JSON.parse(fs.readFileSync(path.join(publicDir, filename), 'utf-8')) as T;

const RUNTIME_CONFIG_BLOCK = /<script[^>]*\bid="app-runtime-config"[^>]*>([\s\S]*?)<\/script>/;

const readRuntimeConfigJson = (indexHtml: string): string => {
  const match = RUNTIME_CONFIG_BLOCK.exec(indexHtml);

  if (!match) {
    throw new Error(
      'public/index.html is missing the <script id="app-runtime-config"> block that ' +
        'src/config/runtime/app-config-source.ts reads synchronously at boot (issue #145).'
    );
  }

  return match[1];
};

describe('public index shell', () => {
  it('does not load the Inter font stylesheet from a third-party host', () => {
    const indexHtml = readPublicIndex();

    expect(indexHtml).not.toContain('https://rsms.me/inter/inter.css');
  });

  it('does not use CRA PUBLIC_URL placeholders for shell assets', () => {
    const indexHtml = readPublicIndex();

    expect(indexHtml).not.toContain('%PUBLIC_URL%');
  });

  it('links to the recommended PWA and favicon assets', () => {
    const indexHtml = readPublicIndex();

    expect(indexHtml).toContain('href="/site.webmanifest"');
    expect(indexHtml).not.toContain('href="/manifest.json"');
    expect(indexHtml).toContain('href="/favicon.svg"');
    expect(indexHtml).toContain('href="/favicon-16x16.png"');
    expect(indexHtml).toContain('href="/favicon-32x32.png"');
    expect(indexHtml).toContain('href="/apple-touch-icon.png"');
    expect(indexHtml).toContain('href="/safari-pinned-tab.svg"');
  });

  it('ships the inline runtime configuration block the app reads at boot', () => {
    const indexHtml = readPublicIndex();

    expect(indexHtml).toContain('id="app-runtime-config"');
    expect(indexHtml).toContain('type="application/json"');

    const parsed = JSON.parse(readRuntimeConfigJson(indexHtml)) as unknown;

    expect(typeof parsed).toBe('object');
    expect(parsed).not.toBeNull();
    expect(Array.isArray(parsed)).toBe(false);

    const { flags } = parsed as { flags?: unknown };

    expect(typeof flags).toBe('object');
    expect(flags).not.toBeNull();
    expect(Array.isArray(flags)).toBe(false);
  });

  it('ships a single manifest file with install metadata', () => {
    const manifest = readPublicJson<{
      id?: string;
      scope?: string;
      lang?: string;
      dir?: string;
      display_override?: string[];
    }>('site.webmanifest');

    expect(fs.existsSync(path.join(publicDir, 'manifest.json'))).toBe(false);
    expect(manifest.id).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.lang).toBe('en');
    expect(manifest.dir).toBe('ltr');
    expect(manifest.display_override).toEqual([
      'window-controls-overlay',
      'standalone',
      'minimal-ui',
    ]);
  });

  it('ships distinct any and maskable icons that resolve to real public files', () => {
    const manifestPath = path.join(publicDir, 'site.webmanifest');

    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
      icons?: Array<{ src: string; purpose?: string }>;
    };

    expect(manifest.icons?.length).toBeGreaterThan(0);

    const anyIcons = (manifest.icons ?? []).filter((icon) => icon.purpose === 'any');
    const maskableIcons = (manifest.icons ?? []).filter((icon) => icon.purpose === 'maskable');

    expect(anyIcons).toHaveLength(2);
    expect(maskableIcons).toHaveLength(2);
    expect(anyIcons.map((icon) => icon.src)).toEqual([
      '/android-chrome-192x192.png',
      '/android-chrome-512x512.png',
    ]);
    expect(maskableIcons.map((icon) => icon.src)).toEqual([
      '/maskable-icon-192x192.png',
      '/maskable-icon-512x512.png',
    ]);

    for (const icon of manifest.icons ?? []) {
      const relativePath = icon.src.replace(/^\//, '');

      expect(fs.existsSync(path.join(publicDir, relativePath))).toBe(true);
    }
  });
});

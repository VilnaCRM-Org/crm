// @jest-environment node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const cssFiles = [
  'src/config/fonts/golos.css',
  'src/config/fonts/inter.css',
] as const;
const publicIndexPath = path.join(projectRoot, 'public/index.html');
const authCriticalFonts = [
  'src/assets/fonts/golos/Golos-Text_Regular.woff2',
  'src/assets/fonts/golos/Golos-Text_Medium.woff2',
  'src/assets/fonts/golos/Golos-Text_Bold.woff2',
  'src/assets/fonts/inter/Inter-Medium.woff2',
] as const;

describe('local font assets', () => {
  it('declares local fonts as woff2 assets', () => {
    const fontSrcPattern = /src:\s*url\('([^']+)'\)\s*format\('([^']+)'\);/g;

    for (const relativeCssPath of cssFiles) {
      const absoluteCssPath = path.join(projectRoot, relativeCssPath);
      const css = fs.readFileSync(absoluteCssPath, 'utf8');
      const matches = [...css.matchAll(fontSrcPattern)];

      expect(matches.length).toBeGreaterThan(0);

      for (const [, fontPath, format] of matches) {
        const resolvedFontPath = path.resolve(path.dirname(absoluteCssPath), fontPath);

        expect(fontPath.endsWith('.woff2')).toBe(true);
        expect(format.toLowerCase()).toBe('woff2');
        expect(fs.existsSync(resolvedFontPath)).toBe(true);
      }

      expect(css).not.toContain('.ttf');
      expect(css.toLowerCase()).not.toContain('truetype');
    }
  });

  it('does not hardcode font preload tags in the public shell', () => {
    const indexHtml = fs.readFileSync(publicIndexPath, 'utf8');
    const preloadPattern =
      /<link\s+rel="preload"\s+href="([^"]+)"\s+as="font"\s+type="([^"]+)"\s+crossorigin\s*\/>/g;
    const preloadMatches = [...indexHtml.matchAll(preloadPattern)];

    expect(preloadMatches).toEqual([]);
  });

  it('does not reference ttf font assets in the public shell', () => {
    const indexHtml = fs.readFileSync(publicIndexPath, 'utf8');

    expect(indexHtml).not.toContain('.ttf');
    expect(indexHtml).not.toContain('font/ttf');
  });

  it('keeps auth-critical font transfer within the mobile performance budget', () => {
    const totalBytes = authCriticalFonts.reduce((sum, relativeFontPath) => {
      const absoluteFontPath = path.join(projectRoot, relativeFontPath);
      return sum + fs.statSync(absoluteFontPath).size;
    }, 0);

    expect(totalBytes).toBeLessThanOrEqual(125000);
  });
});

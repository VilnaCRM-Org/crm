// @jest-environment node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const cssFiles = [
  'src/config/fonts/golos.css',
  'src/config/fonts/inter.css',
] as const;
const publicIndexPath = path.join(projectRoot, 'public/index.html');

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

  it('preloads local fonts as woff2 assets when preload tags are present', () => {
    const indexHtml = fs.readFileSync(publicIndexPath, 'utf8');
    const preloadPattern =
      /<link\s+rel="preload"\s+href="([^"]+)"\s+as="font"\s+type="([^"]+)"\s+crossorigin\s*\/>/g;
    const preloadMatches = [...indexHtml.matchAll(preloadPattern)];

    expect(preloadMatches.length).toBeGreaterThan(0);

    for (const [, href, type] of preloadMatches) {
      expect(href.endsWith('.woff2')).toBe(true);
      expect(type).toBe('font/woff2');
    }

    expect(indexHtml).not.toContain('.ttf');
    expect(indexHtml).not.toContain('font/ttf');
  });

  it('preloads the auth-critical Golos and Inter weights in the public shell', () => {
    const indexHtml = fs.readFileSync(publicIndexPath, 'utf8');
    const preloadPattern =
      /<link\s+rel="preload"\s+href="([^"]+)"\s+as="font"\s+type="([^"]+)"\s+crossorigin\s*\/>/g;
    const preloadHrefs = [...indexHtml.matchAll(preloadPattern)].map(([, href]) => href);

    expect(preloadHrefs).toEqual([
      '/static/font/Golos-Text_Regular.woff2',
      '/static/font/Golos-Text_Medium.woff2',
      '/static/font/Golos-Text_SemiBold.woff2',
      '/static/font/Inter-Regular.woff2',
      '/static/font/Inter-Medium.woff2',
    ]);
  });

});

// @jest-environment node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFile(relativePath)) as T;

describe('performance serving config', () => {
  it('rebuilds the production image before starting the prod stack', () => {
    const makefile = readFile('Makefile');
    const startProdTarget = makefile.match(/start-prod:.*?\n((?:\t.*\n)+)/m)?.[1];

    expect(startProdTarget).toBeDefined();
    expect(startProdTarget).toContain('up -d --build');
  });

  it('ships immutable cache headers for built static assets', () => {
    const serveConfig = readJson<{
      headers?: Array<{
        source?: string;
        headers?: Array<{ key?: string; value?: string }>;
      }>;
    }>('serve.json');

    const staticAssetRule = serveConfig.headers?.find((rule) => rule.source === '/static/**');

    expect(staticAssetRule).toBeDefined();
    expect(staticAssetRule?.headers).toContainEqual({
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    });
  });

  it('loads the explicit serve config in the production image', () => {
    const dockerfile = readFile('Dockerfile');

    expect(dockerfile).toContain('COPY --chown=node:node serve.json ./serve.json');
    expect(dockerfile).toContain('"/app/serve.json"');
  });

  it('does not inject preload hints for every async chunk into the HTML shell', () => {
    const rsbuildConfigSource = readFile('rsbuild.config.ts');

    expect(rsbuildConfigSource).not.toContain('preload: true');
  });

  it('does not enable global async chunk prefetching for the HTML shell', () => {
    const rsbuildConfigSource = readFile('rsbuild.config.ts');

    expect(rsbuildConfigSource).not.toContain('prefetch: {');
    expect(rsbuildConfigSource).not.toContain("type: 'async-chunks'");
  });

  it('duplicates the built HTML shell to 404.html for static website SPA fallbacks', () => {
    const rsbuildConfigSource = readFile('rsbuild.config.ts');

    expect(rsbuildConfigSource).toContain('404.html');
    expect(rsbuildConfigSource).toContain('index.html');
    expect(rsbuildConfigSource).toContain('copyFile');
  });

});

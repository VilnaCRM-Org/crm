/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';

import {
  pluginSpaFallbackDocument,
  SPA_FALLBACK_DOCUMENT,
  SPA_SHELL_DOCUMENT,
} from '@scripts/spa-fallback-document-plugin';

type AfterBuildHook = () => void;

const setUp = (plugin: RsbuildPlugin, distPath: string): AfterBuildHook[] => {
  const hooks: AfterBuildHook[] = [];
  const api = {
    context: { distPath },
    onAfterBuild: (hook: AfterBuildHook) => {
      hooks.push(hook);
    },
  } as unknown as RsbuildPluginAPI;

  void plugin.setup(api);

  return hooks;
};

describe('pluginSpaFallbackDocument (issue #309)', () => {
  it('names the documents a static host serves for the shell and for a missing key', () => {
    expect(SPA_SHELL_DOCUMENT).toBe('index.html');
    expect(SPA_FALLBACK_DOCUMENT).toBe('404.html');
    expect(pluginSpaFallbackDocument().name).toBe('crm:spa-fallback-document');
  });

  it('writes nothing until the build has emitted its assets', () => {
    const distPath = mkdtempSync(path.join(tmpdir(), 'spa-fallback-'));

    expect(setUp(pluginSpaFallbackDocument(), distPath)).toHaveLength(1);
    expect(existsSync(path.join(distPath, '404.html'))).toBe(false);
  });

  it('copies the built shell byte for byte into 404.html after the build', () => {
    const distPath = mkdtempSync(path.join(tmpdir(), 'spa-fallback-'));
    const shell = Buffer.from('<!doctype html><html lang="uk"><body><div id="root"></div> ');
    writeFileSync(path.join(distPath, 'index.html'), shell);

    const [afterBuild] = setUp(pluginSpaFallbackDocument(), distPath);
    afterBuild?.();

    expect(readFileSync(path.join(distPath, '404.html')).equals(shell)).toBe(true);
  });

  it('fails the build when there is no shell to copy', () => {
    const distPath = mkdtempSync(path.join(tmpdir(), 'spa-fallback-'));
    const [afterBuild] = setUp(pluginSpaFallbackDocument(), distPath);

    expect(() => afterBuild?.()).toThrow(/ENOENT/);
  });
});

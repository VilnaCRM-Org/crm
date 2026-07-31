// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

import AppConfigSchema from '@/config/runtime/app-config-schema';
import featureFlagService from '@/config/runtime/feature-flag-service';

import { FLAG_ENV_PREFIX, renderAppConfig, toCamelCase } from '../../../scripts/render-app-config';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const SHELL = 'public/index.html';
const SCHEMA = 'src/config/runtime/app-config-schema.ts';
const UNION = 'src/config/runtime/types/feature-flag.ts';
const RENDERER = 'scripts/render-app-config.js';
const DOCS = 'docs/feature-flags.md';

const CONFIG_BLOCK = /<script[^>]*\bid="app-runtime-config"[^>]*>([\s\S]*?)<\/script>/;

const parseConfigBlock = (html: string): { flags?: Record<string, unknown> } => {
  const match = CONFIG_BLOCK.exec(html);

  if (!match) {
    throw new Error(
      `${SHELL} has no <script id="app-runtime-config"> block. The runtime configuration ` +
        'contract (issue #145) starts there — restore the block before changing anything else.'
    );
  }

  return JSON.parse(match[1]) as { flags?: Record<string, unknown> };
};

const shellFlagNames = (): string[] =>
  Object.keys(parseConfigBlock(readFile(SHELL)).flags ?? {}).sort();

const schemaFlagNames = (): string[] =>
  Object.keys(AppConfigSchema.shape.flags.unwrap().shape).sort();

const unionFlagNames = (): string[] => {
  const declaration = /export type FeatureFlag\s*=\s*([^;]+);/.exec(readFile(UNION));

  if (!declaration) {
    throw new Error(
      `${UNION} no longer declares "export type FeatureFlag = ...". That union is what makes an ` +
        'unknown flag name a compile error, so it cannot be removed or renamed.'
    );
  }

  return Array.from(declaration[1].matchAll(/'([^']+)'/g), (match) => match[1]).sort();
};

const registeredFlagNames = (): string[] => [...featureFlagService.names()].sort();

const appConfigEnvKeys = (relativePath: string): string[] =>
  readFile(relativePath)
    .split('\n')
    .map((line) => /^(APP_CONFIG_[A-Z0-9_]*)=/.exec(line.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => match[1])
    .sort();

const urlSettings = (): Array<{ envVar: string; key: string }> => {
  const block = /const URL_SETTINGS = \[([\s\S]*?)\];/.exec(readFile(RENDERER));

  if (!block) {
    throw new Error(
      `${RENDERER} no longer declares a URL_SETTINGS array. It is the list of APP_CONFIG_* URL ` +
        'variables the container entrypoint renders into the HTML shell.'
    );
  }

  return Array.from(block[1].matchAll(/envVar:\s*'([^']+)',\s*key:\s*'([^']+)'/g), (match) => ({
    envVar: match[1],
    key: match[2],
  }));
};

// A feature flag is declared in four places that no compiler or bundler ties together:
// the committed JSON block in the HTML shell, the zod schema, the FeatureFlag union, and
// FEATURE_FLAG_DEFAULTS. Adding a flag to three of them ships a flag that silently cannot be
// turned on (or one the container entrypoint rejects at start-up). This suite is the tie.
describe('runtime configuration contract', () => {
  it('declares the same flags in the HTML shell, the zod schema and the flag service', () => {
    const registered = registeredFlagNames();

    expect(registered.length).toBeGreaterThan(0);
    expect({ [SHELL]: shellFlagNames(), [SCHEMA]: schemaFlagNames() }).toEqual({
      [SHELL]: registered,
      [SCHEMA]: registered,
    });
  });

  it('keeps the FeatureFlag union in step with FEATURE_FLAG_DEFAULTS', () => {
    expect({ [UNION]: unionFlagNames() }).toEqual({ [UNION]: registeredFlagNames() });
  });

  it('maps every APP_CONFIG_FLAG_* variable declared in .env onto a registered flag', () => {
    const shellHtml = readFile(SHELL);
    const flagEnvKeys = appConfigEnvKeys('.env').filter((key) => key.startsWith(FLAG_ENV_PREFIX));
    const namedFlags = flagEnvKeys
      .map((envVar) => toCamelCase(envVar.slice(FLAG_ENV_PREFIX.length)))
      .sort();

    // Bijection: every declared variable names a real flag, and every flag is operable.
    expect(namedFlags).toEqual(registeredFlagNames());

    for (const envVar of flagEnvKeys) {
      // The renderer rejects a variable naming a flag absent from the committed block, so this
      // reproduces the check that fails container start rather than degrading silently.
      expect(() => renderAppConfig(shellHtml, { [envVar]: 'true' })).not.toThrow();
    }
  });

  it('declares the same APP_CONFIG_* keys in .env and .env.example', () => {
    const declared = appConfigEnvKeys('.env');

    expect(declared.length).toBeGreaterThan(0);
    expect(appConfigEnvKeys('.env.example')).toEqual(declared);
  });

  it('declares every URL setting the renderer reads in .env, matching the schema keys', () => {
    const settings = urlSettings();
    const declared = appConfigEnvKeys('.env');
    const schemaKeys = Object.keys(AppConfigSchema.shape)
      .filter((key) => key !== 'flags')
      .sort();

    expect(settings.length).toBeGreaterThan(0);
    // An undeclared variable is invisible to docker-compose and to `make check-env-sync`.
    expect(settings.filter((setting) => !declared.includes(setting.envVar))).toEqual([]);
    // A renderer key the schema does not know would be rejected by the strictObject at boot.
    expect(settings.map((setting) => setting.key).sort()).toEqual(schemaKeys);
  });

  it('documents every registered feature flag in the feature-flag guide', () => {
    const guide = readFile(DOCS);

    expect(registeredFlagNames().filter((flag) => !guide.includes(flag))).toEqual([]);
  });
});

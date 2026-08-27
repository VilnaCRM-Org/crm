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

// Both the id AND the JSON type are part of the contract: a block that loses `application/json`
// would become an executable script, so matching the id alone would let that regression pass.
const CONFIG_BLOCK = new RegExp(
  '<script(?=[^>]*\\sid="app-runtime-config")' +
    '(?=[^>]*\\stype="application/json")[^>]*>([\\s\\S]*?)</script>'
);

const parseConfigBlock = (html: string): { flags?: Record<string, unknown> } => {
  const json = CONFIG_BLOCK.exec(html)?.[1];

  if (json === undefined) {
    throw new Error(
      `${SHELL} has no <script id="app-runtime-config"> block. The runtime configuration ` +
        'contract (issue #145) starts there — restore the block before changing anything else.'
    );
  }

  return JSON.parse(json) as { flags?: Record<string, unknown> };
};

const shellFlagNames = (): string[] =>
  Object.keys(parseConfigBlock(readFile(SHELL)).flags ?? {}).sort();

const schemaFlagNames = (): string[] =>
  Object.keys(AppConfigSchema.shape.flags.unwrap().shape).sort();

const unionFlagNames = (): string[] => {
  const members = /export type FeatureFlag\s*=\s*([^;]+);/.exec(readFile(UNION))?.[1];

  if (members === undefined) {
    throw new Error(
      `${UNION} no longer declares "export type FeatureFlag = ...". That union is what makes an ` +
        'unknown flag name a compile error, so it cannot be removed or renamed.'
    );
  }

  return Array.from(members.matchAll(/'([^']+)'/g), ([, name]) => name)
    .filter((name): name is string => name !== undefined)
    .sort();
};

const registeredFlagNames = (): string[] => [...featureFlagService.names()].sort();

const appConfigEnvKeys = (relativePath: string): string[] =>
  readFile(relativePath)
    .split('\n')
    .map((line) => /^(APP_CONFIG_[A-Z0-9_]*)=/.exec(line.trim())?.[1])
    .filter((key): key is string => key !== undefined)
    .sort();

const urlSettings = (): Array<{ envVar: string; key: string }> => {
  const body = /const URL_SETTINGS = \[([\s\S]*?)\];/.exec(readFile(RENDERER))?.[1];

  if (body === undefined) {
    throw new Error(
      `${RENDERER} no longer declares a URL_SETTINGS array. It is the list of APP_CONFIG_* URL ` +
        'variables the container entrypoint renders into the HTML shell.'
    );
  }

  return [...body.matchAll(/envVar:\s*'([^']+)',\s*key:\s*'([^']+)'/g)].flatMap(
    ([, envVar, key]) => (envVar === undefined || key === undefined ? [] : [{ envVar, key }])
  );
};

const ROUTE_CONTRACTS = [
  'src/routes/app-routes.ts',
  'src/modules/user/features/auth/routes/index.ts',
];

const isRouteRegistered = (routePathKey: string): boolean =>
  ROUTE_CONTRACTS.map(readFile).some((source) =>
    new RegExp(`path:\\s*ROUTE_PATHS\\.${routePathKey}\\b`).test(source)
  );

const shippedFlagDefault = (flag: string): unknown =>
  (parseConfigBlock(readFile(SHELL)).flags ?? {})[flag];

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

  // Three independent validators decide whether a runtime URL is acceptable: the zod schema in
  // the browser, `assertHttpUrl` in the container entrypoint, and `isHttpUrl` on the paint path.
  // If they disagree, a value can pass container start and then blow up in the browser (or the
  // reverse). This pins that they accept exactly the same set — including the single-label Docker
  // hostnames this repo actually deploys with, which `z.httpUrl()` silently rejects.
  it.each([
    ['http://localhost:4000/graphql', true],
    ['http://prod:3001', true],
    ['http://mockoon:8080/api', true],
    ['http://127.0.0.1:8080', true],
    ['https://api.example.com/graphql', true],
    ['mailto:someone@example.com', false],
    ['ftp://files.example/api', false],
    ['javascript:alert(1)', false],
    ['not-a-url', false],
    ['/api', false],
  ])('accepts %s in the schema and the renderer alike (%s)', (url, accepted) => {
    const schemaAccepts = AppConfigSchema.safeParse({ graphqlUrl: url }).success;
    const rendererAccepts = ((): boolean => {
      try {
        renderAppConfig(readFile(SHELL), { APP_CONFIG_GRAPHQL_URL: url });
        return true;
      } catch {
        return false;
      }
    })();

    expect({ schemaAccepts, rendererAccepts }).toEqual({
      schemaAccepts: accepted,
      rendererAccepts: accepted,
    });
  });

  // The sign-in control `forgotPassword` gates links to ROUTE_PATHS.passwordRecovery. Shipping
  // that flag enabled before the route is registered would send an already-locked-out user to the
  // not-found page, so this makes the rollout precondition in docs/feature-flags.md a build gate
  // rather than a promise: the shipped default and the route registration have to move together.
  it('never ships forgotPassword enabled while its recovery route is unregistered', () => {
    // Guard the probe itself: a registered route must read as registered, an absent one must not.
    expect(isRouteRegistered('signIn')).toBe(true);
    expect(isRouteRegistered('notARealRouteKey')).toBe(false);

    const enabledWithoutRoute =
      shippedFlagDefault('forgotPassword') === true && !isRouteRegistered('passwordRecovery');

    expect(enabledWithoutRoute).toBe(false);
  });
});

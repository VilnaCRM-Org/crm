import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import EnvSchema from '@/config/env/env-schema';

// Each zod schema field maps to the environment variable it is read from (raw-env.ts
// snapshot()). NODE_ENV is provided by the runtime/bundler, not declared in the dotenv
// files, so it maps to null. This mapping is asserted to stay in lockstep with the schema,
// so adding or removing a schema field fails this test until .env.example is updated too.
const SCHEMA_KEY_TO_ENV_VAR: Record<string, string | null> = {
  nodeEnv: null,
  graphqlUrl: 'REACT_APP_GRAPHQL_URL',
  mockoonUrl: 'REACT_APP_MOCKOON_URL',
  lhciPreloadedAuthToken: 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN',
  mainLanguage: 'REACT_APP_MAIN_LANGUAGE',
  fallbackLanguage: 'REACT_APP_FALLBACK_LANGUAGE',
  release: 'REACT_APP_RELEASE',
  sentryDsn: 'REACT_APP_SENTRY_DSN',
  sentryEnvironment: 'REACT_APP_SENTRY_ENVIRONMENT',
};

describe('env schema <-> .env.example sync', () => {
  const exampleContent = readFileSync(join(process.cwd(), '.env.example'), 'utf8');

  it('maps every schema field to an env var (catches an added or removed schema key)', () => {
    expect(Object.keys(SCHEMA_KEY_TO_ENV_VAR).sort()).toEqual(Object.keys(EnvSchema.shape).sort());
  });

  it('declares every schema-backed variable in .env.example', () => {
    Object.values(SCHEMA_KEY_TO_ENV_VAR)
      .filter((envVar): envVar is string => envVar !== null)
      .forEach((envVar) => {
        expect(exampleContent).toMatch(new RegExp(`^${envVar}=`, 'm'));
      });
  });
});

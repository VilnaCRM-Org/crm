import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import DemoSessionIssuer from './demo-session-issuer.mjs';
import LocalDemoAccount from './local-demo-account.mjs';

const STACK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../docker/local-stack');

const issuer = new DemoSessionIssuer({
  fetch: globalThis.fetch,
  graphqlUrl: process.env.USER_SERVICE_GRAPHQL_URL ?? 'http://localhost:8081/api/graphql',
  templatePath: resolve(STACK_DIR, 'sign-in.template.json'),
  generatedPath: resolve(STACK_DIR, 'generated/sign-in.json'),
  demo: new LocalDemoAccount().credentials(),
});

console.log(await issuer.run());

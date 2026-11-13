import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import DemoSessionIssuer from './demo-session-issuer.mjs';

const STACK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../docker/local-stack');

const issuer = new DemoSessionIssuer({
  fetch: globalThis.fetch,
  graphqlUrl: process.env.USER_SERVICE_GRAPHQL_URL ?? 'http://localhost:8081/api/graphql',
  templatePath: resolve(STACK_DIR, 'sign-in.template.json'),
  generatedPath: resolve(STACK_DIR, 'generated/sign-in.json'),
  demo: {
    email: process.env.LOCAL_DEMO_EMAIL ?? 'demo@vilnacrm.com',
    password: process.env.LOCAL_DEMO_PASSWORD ?? 'Demo1234',
    name: 'Demo User',
  },
});

console.log(await issuer.run());

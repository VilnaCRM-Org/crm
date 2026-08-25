// scripts/ci/print-eslint-policy-config.mjs
//
// Resolves the effective flat-config for a fixed set of representative source paths and
// prints one JSON blob to stdout. Consumed by tests/unit/config/eslint-policy.test.ts via a
// single child_process spawn (issue #165).
//
// WHY A CHILD PROCESS: jest.config.ts runs CJS Jest with no --experimental-vm-modules, and
// ESLint v9 loads the flat `eslint.config.mjs` via a native dynamic import() that fails inside
// Jest's vm context. Resolving the config in a plain `node` process here sidesteps that
// entirely; the test only parses this blob and asserts on it.
import { ESLint } from 'eslint';

// One representative real path per load-bearing override scope in eslint.config.mjs,
// including the hook EXEMPTION so a config edit that accidentally applies the no-static gate
// (issue #100) to hooks also goes red.
const SAMPLES = [
  'src/services/https-client/fetch-https-client.ts', // non-hook logic .ts — no-static gate (#100)
  'src/modules/user/features/auth/components/form-section/components/form-field.tsx', // component
  'src/modules/user/types/api-errors/validation-error.ts', // type-only file — type-purity gate (#88)
  'src/modules/user/features/auth/stores/use-auth-token.ts', // hook — must stay EXEMPT from #100
];

const eslint = new ESLint({ cwd: process.cwd() });
const entries = await Promise.all(
  SAMPLES.map(async (file) => [file, await eslint.calculateConfigForFile(file)])
);
process.stdout.write(JSON.stringify(Object.fromEntries(entries)));

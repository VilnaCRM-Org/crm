import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STACK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../docker/local-stack');
const TEMPLATE_PATH = resolve(STACK_DIR, 'sign-in.template.json');
const GENERATED_PATH = resolve(STACK_DIR, 'generated/sign-in.json');

const GRAPHQL_URL = process.env.USER_SERVICE_GRAPHQL_URL ?? 'http://localhost:8081/api/graphql';
const DEMO_EMAIL = process.env.LOCAL_DEMO_EMAIL ?? 'demo@vilnacrm.com';
const DEMO_PASSWORD = process.env.LOCAL_DEMO_PASSWORD ?? 'Demo1234';
const DEMO_NAME = 'Demo User';
const MINIMUM_REMAINING_SECONDS = 3600;

const CREATE_USER = `mutation CreateUser($input: createUserInput!) {
  createUser(input: $input) { user { id } }
}`;

const SIGN_IN_USER = `mutation SignInUser($input: signInUserInput!) {
  signInUser(input: $input) { user { success twoFactorEnabled accessToken } }
}`;

async function graphql(query, input) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { input } }),
  });
  return response.json();
}

function secondsRemaining(token) {
  const payload = token.split('.')[1] ?? '';
  const { exp = 0 } = JSON.parse(Buffer.from(payload, 'base64url').toString() || '{}');
  return exp - Math.floor(Date.now() / 1000);
}

function reusableToken() {
  if (!existsSync(GENERATED_PATH)) return null;
  const body = JSON.parse(readFileSync(GENERATED_PATH, 'utf8')).routes[0].responses[0].body;
  const token = JSON.parse(body).data.signInUser.user.accessToken;
  return secondsRemaining(token) > MINIMUM_REMAINING_SECONDS ? token : null;
}

async function issueToken() {
  await graphql(CREATE_USER, {
    email: DEMO_EMAIL,
    initials: DEMO_NAME,
    password: DEMO_PASSWORD,
    clientMutationId: randomUUID(),
  });
  const signIn = await graphql(SIGN_IN_USER, {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    rememberMe: true,
    clientMutationId: randomUUID(),
  });
  const token = signIn.data?.signInUser?.user?.accessToken;
  if (typeof token === 'string' && token !== '') return token;
  const reason = JSON.stringify(signIn.errors ?? signIn);
  throw new Error(
    `user-service refused the demo sign-in: ${reason}. If you changed the demo password, ` +
      'run again with LOCAL_DEMO_PASSWORD set to the new one.'
  );
}

function writeEnvironment(token) {
  const environment = readFileSync(TEMPLATE_PATH, 'utf8')
    .replaceAll('__ACCESS_TOKEN__', token)
    .replaceAll('__DEMO_EMAIL__', DEMO_EMAIL);
  mkdirSync(dirname(GENERATED_PATH), { recursive: true });
  writeFileSync(GENERATED_PATH, environment, { mode: 0o644 });
}

const reused = reusableToken();
writeEnvironment(reused ?? (await issueToken()));
console.log(
  `${reused === null ? 'Issued' : 'Reused'} the demo session token for ${DEMO_EMAIL} (${GENERATED_PATH})`
);

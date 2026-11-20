/**
 * @jest-environment node
 */
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { parse } from 'yaml';

import DemoSessionIssuer from '@scripts/local-stack/demo-session-issuer.mjs';
import { buildEmail, buildFullName, buildPassword } from '@tests/builders';
import { assertInstanceOf } from '@tests/utils/assert-result';

interface RecordedBody {
  readonly query: string;
  readonly variables: { readonly input: Record<string, unknown> };
}

interface RecordedCall {
  readonly url: string;
  readonly body: RecordedBody;
}

interface GeneratedEnvironment {
  readonly routes: readonly { readonly responses: readonly { readonly body: string }[] }[];
}

interface SignInBody {
  readonly data: { readonly signInUser: { readonly user: { readonly accessToken: string } } };
}

const NOW_MS = 1_800_000_000_000;
const NOW_SECONDS = NOW_MS / 1000;
const GRAPHQL_URL = 'http://user-service.test/api/graphql';
const REAL_TEMPLATE = resolve(__dirname, '../../../docker/local-stack/sign-in.template.json');

const TEMPLATE = JSON.stringify({
  routes: [
    {
      responses: [
        {
          body: JSON.stringify({
            data: { signInUser: { user: { accessToken: '__ACCESS_TOKEN__' } } },
          }),
          rules: [{ target: 'body', value: '__DEMO_EMAIL__' }],
        },
      ],
    },
  ],
});

const segment = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');

const jwtExpiringIn = (seconds: number): string =>
  `${segment({ alg: 'HS256' })}.${segment({ exp: NOW_SECONDS + seconds })}.signature`;

const generatedFile = (token: string, email: string): string =>
  TEMPLATE.replaceAll('__ACCESS_TOKEN__', token).replaceAll('__DEMO_EMAIL__', email);

const tokenIn = (path: string): string => {
  const environment: GeneratedEnvironment = JSON.parse(readFileSync(path, 'utf8'));
  const signIn: SignInBody = JSON.parse(environment.routes[0]?.responses[0]?.body ?? '');
  return signIn.data.signInUser.user.accessToken;
};

interface DemoAccount {
  readonly email: string;
  readonly password: string;
  readonly name: string;
}

interface FetchAnswer {
  readonly json: () => Promise<unknown>;
}

interface Harness {
  readonly issuer: DemoSessionIssuer;
  readonly calls: RecordedCall[];
  readonly demo: DemoAccount;
  readonly generatedPath: string;
  readonly fetch: jest.Mock<Promise<FetchAnswer>, [string, { body: string }]>;
}

function harness(answers: readonly unknown[], templatePath?: string): Harness {
  const directory = mkdtempSync(join(tmpdir(), 'demo-session-'));
  const template = templatePath ?? join(directory, 'sign-in.template.json');
  if (templatePath === undefined) writeFileSync(template, TEMPLATE);
  const generatedPath = join(directory, 'generated', 'sign-in.json');
  const demo: DemoAccount = {
    email: buildEmail(),
    password: buildPassword(),
    name: buildFullName(),
  };
  const calls: RecordedCall[] = [];
  const fetch = jest.fn(async (url: string, init: { body: string }): Promise<FetchAnswer> => {
    const body: RecordedBody = JSON.parse(init.body);
    calls.push({ url, body });
    const answer = answers[calls.length - 1];
    return { json: async (): Promise<unknown> => answer };
  });
  const issuer = new DemoSessionIssuer({
    fetch,
    graphqlUrl: GRAPHQL_URL,
    templatePath: template,
    generatedPath,
    demo,
    now: (): number => NOW_MS,
  });
  return { issuer, calls, demo, generatedPath, fetch };
}

const existing: unknown = { data: { createUser: null }, errors: [{ message: 'already exists' }] };

const created: unknown = { data: { createUser: { user: { id: '01JB' } } } };

const signedIn = (accessToken: unknown): unknown => ({
  data: { signInUser: { user: { success: true, twoFactorEnabled: false, accessToken } } },
});

describe('DemoSessionIssuer', () => {
  describe('secondsRemaining', () => {
    it('reads exp from the JWT payload against the injected clock', () => {
      const { issuer } = harness([]);

      expect(issuer.secondsRemaining(jwtExpiringIn(7200))).toBe(7200);
      expect(issuer.secondsRemaining(jwtExpiringIn(-5))).toBe(-5);
    });

    it('treats a token without a payload or an exp as already expired', () => {
      const { issuer } = harness([]);

      expect(issuer.secondsRemaining('opaque')).toBe(-NOW_SECONDS);
      expect(issuer.secondsRemaining(`${segment({})}.${segment({ sub: 'x' })}.s`)).toBe(
        -NOW_SECONDS
      );
    });
  });

  describe('run', () => {
    it('reuses a token with more than an hour left once the demo user already exists', async () => {
      const { issuer, calls, demo, generatedPath } = harness([existing]);
      const token = jwtExpiringIn(3601);
      issuer.writeEnvironment(token);

      const message = await issuer.run();

      expect(calls).toHaveLength(1);
      expect(calls[0]?.body.query).toContain('mutation CreateUser');
      expect(tokenIn(generatedPath)).toBe(token);
      expect(message).toBe(`Reused the demo session token for ${demo.email} (${generatedPath})`);
    });

    it('issues a new token when the demo user had to be created again', async () => {
      const fresh = jwtExpiringIn(86_400);
      const { issuer, calls, generatedPath } = harness([created, signedIn(fresh)]);
      issuer.writeEnvironment(jwtExpiringIn(86_400 * 2));

      const message = await issuer.run();

      expect(calls).toHaveLength(2);
      expect(tokenIn(generatedPath)).toBe(fresh);
      expect(message.startsWith('Issued the demo session token for ')).toBe(true);
    });

    it('issues a new token when the generated one belongs to another demo e-mail', async () => {
      const fresh = jwtExpiringIn(86_400);
      const { issuer, calls, demo, generatedPath } = harness([existing, signedIn(fresh)]);
      issuer.writeEnvironment(jwtExpiringIn(86_400 * 2));
      writeFileSync(generatedPath, generatedFile(jwtExpiringIn(86_400 * 2), buildEmail()));

      await issuer.run();

      expect(calls).toHaveLength(2);
      expect(readFileSync(generatedPath, 'utf8')).toBe(generatedFile(fresh, demo.email));
    });

    it('issues a new token when the generated one has an hour or less left', async () => {
      const fresh = jwtExpiringIn(86_400);
      const { issuer, calls, generatedPath } = harness([existing, signedIn(fresh)]);
      issuer.writeEnvironment(jwtExpiringIn(3600));

      const message = await issuer.run();

      expect(calls).toHaveLength(2);
      expect(tokenIn(generatedPath)).toBe(fresh);
      expect(message.startsWith('Issued the demo session token for ')).toBe(true);
    });

    it('creates the demo user, then signs in with remember-me at the configured URL', async () => {
      const fresh = jwtExpiringIn(86_400);
      const { issuer, calls, demo, generatedPath } = harness([{ data: {} }, signedIn(fresh)]);

      await issuer.run();

      expect(calls.map((call) => call.url)).toEqual([GRAPHQL_URL, GRAPHQL_URL]);
      expect(calls[0]?.body.query).toContain('mutation CreateUser');
      expect(calls[0]?.body.variables.input).toEqual({
        email: demo.email,
        initials: demo.name,
        password: demo.password,
        clientMutationId: expect.any(String),
      });
      expect(calls[1]?.body.query).toContain('mutation SignInUser');
      expect(calls[1]?.body.variables.input).toEqual({
        email: demo.email,
        password: demo.password,
        rememberMe: true,
        clientMutationId: expect.any(String),
      });
      expect(readFileSync(generatedPath, 'utf8')).toBe(generatedFile(fresh, demo.email));
      expect(statSync(generatedPath).mode & 0o777).toBe(0o600);
    });

    it('tightens a generated file another run left world-readable to owner-only', async () => {
      const fresh = jwtExpiringIn(86_400);
      const { issuer, generatedPath } = harness([existing, signedIn(fresh)]);
      mkdirSync(dirname(generatedPath), { recursive: true });
      writeFileSync(generatedPath, generatedFile(jwtExpiringIn(60), buildEmail()), {
        mode: 0o644,
      });
      chmodSync(generatedPath, 0o644);

      await issuer.run();

      expect(statSync(generatedPath).mode & 0o777).toBe(0o600);
      expect(tokenIn(generatedPath)).toBe(fresh);
    });

    it('names two-factor authentication when sign-in answers with a challenge', async () => {
      const challenge: unknown = {
        data: {
          signInUser: { user: { success: true, twoFactorEnabled: true, accessToken: null } },
        },
      };
      const { issuer, demo, generatedPath } = harness([{ data: {} }, challenge]);

      const failure = await issuer.run().catch((caught: unknown) => caught);

      assertInstanceOf(failure, Error);
      expect(failure.message).toBe(
        `${demo.email} has two-factor authentication enabled, so user-service answered the demo ` +
          'sign-in with a challenge instead of a token. Disable it for that account, or run ' +
          'again with LOCAL_DEMO_EMAIL set to an account without it.'
      );
      expect(existsSync(generatedPath)).toBe(false);
    });

    it('substitutes every placeholder of the committed template', async () => {
      const fresh = jwtExpiringIn(86_400);
      const { issuer, demo, generatedPath } = harness(
        [{ data: {} }, signedIn(fresh)],
        REAL_TEMPLATE
      );

      await issuer.run();

      const written = readFileSync(generatedPath, 'utf8');
      expect(written).not.toMatch(/__[A-Z_]+__/u);
      expect(written).toContain(demo.email);
      expect(tokenIn(generatedPath)).toBe(fresh);
    });

    it.each([
      ['GraphQL errors', { errors: [{ message: 'Invalid credentials.' }] }, 'Invalid credentials.'],
      ['an empty token', signedIn(''), '"accessToken":""'],
      ['a missing token', signedIn(null), '"accessToken":null'],
    ])('refuses %s and writes nothing', async (_name, answer, reason) => {
      const { issuer, generatedPath } = harness([{ data: {} }, answer]);

      const failure = await issuer.run().catch((caught: unknown) => caught);

      assertInstanceOf(failure, Error);
      expect(failure.message).toContain('user-service refused the demo sign-in: ');
      expect(failure.message).toContain(reason);
      expect(failure.message).toContain('LOCAL_DEMO_PASSWORD');
      expect(existsSync(generatedPath)).toBe(false);
    });
  });
});

describe('local stack sign-in mock healthcheck', () => {
  interface ComposeService {
    readonly healthcheck?: { readonly test?: readonly string[]; readonly disable?: boolean };
  }
  interface TemplateRoute {
    readonly method: string;
    readonly endpoint: string;
    readonly responses: readonly {
      readonly statusCode: number;
      readonly rules: readonly unknown[];
    }[];
  }

  const compose = parse(
    readFileSync(resolve(__dirname, '../../../docker-compose.local-stack.yml'), 'utf8')
  ) as { services: Record<string, ComposeService> };
  const template = JSON.parse(readFileSync(REAL_TEMPLATE, 'utf8')) as {
    routes: readonly TemplateRoute[];
    rootChildren: readonly { uuid: string }[];
  };

  it('probes a path the mock answers itself instead of proxying to user-service', () => {
    const probe = compose.services['sign-in-mock']?.healthcheck?.test ?? [];
    const path = new URL(probe.at(-1) ?? '').pathname.slice(1);
    const route = template.routes.find((candidate) => candidate.endpoint === path);

    expect(probe.slice(0, 2)).toEqual(['CMD', 'wget']);
    expect(route?.method).toBe('get');
    expect(route?.responses).toEqual([expect.objectContaining({ statusCode: 200, rules: [] })]);
    expect(template.rootChildren).toHaveLength(template.routes.length);
  });

  it('keeps the demo sign-in as the first route the issuer reads', () => {
    expect(template.routes[0]?.endpoint).toBe('api/graphql');
  });

  it('gives the gateway a probe of its own', () => {
    const probe = compose.services.gateway?.healthcheck?.test ?? [];
    const nginx = readFileSync(
      resolve(__dirname, '../../../docker/local-stack/nginx.conf'),
      'utf8'
    );

    expect(probe.at(-1)).toBe('http://127.0.0.1/healthz');
    expect(nginx).toMatch(/location = \/healthz \{\s+access_log off;\s+return 200;\s+\}/u);
  });
});

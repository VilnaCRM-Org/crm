/**
 * @jest-environment node
 */
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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
    it('reuses a generated token with more than an hour left, calling nothing', async () => {
      const { issuer, fetch, demo, generatedPath } = harness([]);
      const token = jwtExpiringIn(3601);
      issuer.writeEnvironment(token);

      const message = await issuer.run();

      expect(fetch).not.toHaveBeenCalled();
      expect(tokenIn(generatedPath)).toBe(token);
      expect(message).toBe(`Reused the demo session token for ${demo.email} (${generatedPath})`);
    });

    it('issues a new token when the generated one has an hour or less left', async () => {
      const fresh = jwtExpiringIn(86_400);
      const { issuer, calls, generatedPath } = harness([{ data: {} }, signedIn(fresh)]);
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
      expect(statSync(generatedPath).mode & 0o777).toBe(0o644);
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

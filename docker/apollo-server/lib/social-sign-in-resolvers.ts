import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';

// Local stand-in for the user-service social sign-in mutations declared in
// src/api/contracts/pending/social-sign-in.graphql (specs/social-sign-in).
//
// OAUTH_MODE=mock sends every provider to the Mockoon-hosted consent page (one link per
// outcome); OAUTH_MODE=provider sends a provider whose OAUTH_<PROVIDER>_CLIENT_ID is set to its
// real consent screen. Completion never exchanges the code, so no client secret is ever read.

const PROVIDERS = ['google', 'github', 'facebook', 'twitter'] as const;
type SocialProvider = (typeof PROVIDERS)[number];

interface InitiateInput {
  clientMutationId?: string | null;
  provider: string;
}

interface CompleteInput {
  clientMutationId?: string | null;
  provider: string;
  code: string;
  state: string;
}

interface InitiatePayload {
  user: { id: string; authorizationUrl: string; state: string };
  clientMutationId: string | null;
}

interface CompletePayload {
  user: {
    id: string;
    success: boolean;
    twoFactorEnabled: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    pendingSessionId: string | null;
  };
  clientMutationId: string | null;
}

interface IssuedState {
  provider: SocialProvider;
  expiresAt: number;
}

interface Scenario {
  errorCode: string;
  status: number;
  message: string;
}

const AUTHORIZE: Record<SocialProvider, { base: string; params: Record<string, string> }> = {
  google: {
    base: 'https://accounts.google.com/o/oauth2/v2/auth',
    params: { response_type: 'code', scope: 'openid email profile', prompt: 'select_account' },
  },
  github: {
    base: 'https://github.com/login/oauth/authorize',
    params: { scope: 'read:user user:email' },
  },
  facebook: { base: 'https://www.facebook.com/v19.0/dialog/oauth', params: { scope: 'email' } },
  twitter: {
    base: 'https://x.com/i/oauth2/authorize',
    params: {
      response_type: 'code',
      scope: 'users.read tweet.read',
      code_challenge: 'mock-challenge',
      code_challenge_method: 'plain',
    },
  },
};

// Codes the Mockoon consent page links to; any other code (a real provider's) signs in.
const SCENARIOS = new Map<string, Scenario>(
  Object.entries({
    'mock-expired': { errorCode: 'state_expired', status: 422, message: 'OAuth state expired' },
    'mock-unverified': {
      errorCode: 'unverified_provider_email',
      status: 422,
      message: 'Provider email is not verified',
    },
    'mock-no-email': {
      errorCode: 'provider_email_unavailable',
      status: 422,
      message: 'Provider returned no email address',
    },
    'mock-duplicate': {
      errorCode: 'duplicate_email',
      status: 409,
      message: 'Email address matches multiple local users; automatic linking is blocked.',
    },
    'mock-unavailable': {
      errorCode: 'provider_unavailable',
      status: 503,
      message: 'OAuth provider error: mock provider is unavailable.',
    },
  })
);

const STATE_TTL_MS = 10 * 60 * 1000;
const MAX_ISSUED_STATES = 1000;
const issuedStates = new Map<string, IssuedState>();

const reject = (errorCode: string, status: number, message: string): never => {
  throw new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT', status, error_code: errorCode },
  });
};

const isSocialProvider = (value: string): value is SocialProvider =>
  (PROVIDERS as readonly string[]).includes(value);

const spaOrigin = (): string =>
  (process.env.OAUTH_SPA_ORIGIN || 'http://localhost:3000').replace(/\/+$/, '');

const consentHost = (): string =>
  (process.env.REACT_APP_MOCKOON_URL || 'http://localhost:8080').replace(/\/+$/, '');

const clientIdOf = (provider: SocialProvider): string =>
  process.env.OAUTH_MODE === 'provider'
    ? (process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`] ?? '').trim()
    : '';

export const authorizationUrlFor = (provider: SocialProvider, state: string): string => {
  const redirectUri = `${spaOrigin()}/auth/callback/${provider}`;
  const clientId = clientIdOf(provider);
  if (clientId === '') {
    const query = new URLSearchParams({ state, redirect_uri: redirectUri });
    return `${consentHost()}/__mock-oauth/${provider}/authorize?${query.toString()}`;
  }
  const { base, params } = AUTHORIZE[provider];
  const query = new URLSearchParams({
    ...params,
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${base}?${query.toString()}`;
};

const signedIn = (): CompletePayload['user'] => ({
  id: `/api/users/${uuidv4()}`,
  success: true,
  twoFactorEnabled: false,
  accessToken: `mock-access-${uuidv4()}`,
  refreshToken: `mock-refresh-${uuidv4()}`,
  pendingSessionId: null,
});

const pendingTwoFactor = (): CompletePayload['user'] => ({
  id: `/api/users/${uuidv4()}`,
  success: true,
  twoFactorEnabled: true,
  accessToken: null,
  refreshToken: null,
  pendingSessionId: uuidv4(),
});

const dropStates = (states: string[]): void =>
  states.forEach((state) => issuedStates.delete(state));

const issueState = (provider: SocialProvider): string => {
  const excess = Math.max(0, issuedStates.size + 1 - MAX_ISSUED_STATES);
  dropStates([...issuedStates.keys()].slice(0, excess));
  const state = uuidv4();
  issuedStates.set(state, { provider, expiresAt: Date.now() + STATE_TTL_MS });
  return state;
};

const consumeState = (input: CompleteInput): void => {
  const issued = issuedStates.get(input.state);
  if (issued === undefined) {
    return reject('invalid_state', 422, 'Invalid or already consumed OAuth state');
  }
  issuedStates.delete(input.state);
  if (issued.expiresAt <= Date.now()) reject('state_expired', 422, 'OAuth state expired');
  if (issued.provider !== input.provider) {
    reject(
      'provider_mismatch',
      400,
      `Provider mismatch: expected ${issued.provider}, got ${input.provider}`
    );
  }
};

export const socialSignInResolvers = {
  Mutation: {
    initiateSocialSignInUser: async (
      _: unknown,
      { input }: { input: InitiateInput }
    ): Promise<InitiatePayload> => {
      if (!isSocialProvider(input.provider)) {
        reject('unsupported_provider', 400, `Unsupported OAuth provider "${input.provider}".`);
      }
      const provider = input.provider as SocialProvider;
      const state = issueState(provider);
      return {
        user: {
          id: `/api/oauth/states/${state}`,
          authorizationUrl: authorizationUrlFor(provider, state),
          state,
        },
        clientMutationId: input.clientMutationId ?? null,
      };
    },
    completeSocialSignInUser: async (
      _: unknown,
      { input }: { input: CompleteInput }
    ): Promise<CompletePayload> => {
      if (input.code.trim() === '') {
        reject('missing_oauth_parameters', 400, 'Missing OAuth code or state');
      }
      consumeState(input);
      const scenario = SCENARIOS.get(input.code);
      if (scenario) reject(scenario.errorCode, scenario.status, scenario.message);
      const user = input.code === 'mock-2fa' ? pendingTwoFactor() : signedIn();
      return { user, clientMutationId: input.clientMutationId ?? null };
    },
  },
};

export const __socialTest__ = { issuedStates, issueState };

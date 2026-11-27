import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';

import { authorizationUrlFor, isSocialProvider } from './social-sign-in-resolvers';
import type { SocialProvider } from './social-sign-in-resolvers';

// Local stand-in for the user-service linking operations declared in
// src/api/contracts/pending/social-account-linking.graphql (specs/social-account-linking). The
// mock user always has a password, so it never refuses the last sign-in method.

interface ProviderInput {
  clientMutationId?: string | null;
  provider: string;
}

interface CompleteLinkInput extends ProviderInput {
  code: string;
  state: string;
}

interface ChangedPayload {
  user: { id: string; success: boolean };
  clientMutationId: string | null;
}

interface InitiateLinkPayload {
  user: { id: string; authorizationUrl: string; state: string };
  clientMutationId: string | null;
}

interface IssuedLink {
  provider: SocialProvider;
  expiresAt: number;
}

const REFUSALS = new Map<string, [errorCode: string, status: number, message: string]>([
  ['mock-expired', ['state_expired', 422, 'OAuth state expired']],
  [
    'mock-duplicate',
    ['identity_linked_to_other_user', 409, 'The provider account is linked to another user.'],
  ],
  ['mock-unavailable', ['provider_unavailable', 503, 'The mock provider is unavailable.']],
]);

const STATE_TTL_MS = 10 * 60 * 1000;
const MAX_PENDING_LINKS = 1000;
const pendingLinks = new Map<string, IssuedLink>();
const linkedProviders = new Set<SocialProvider>();

const reject = (errorCode: string, status: number, message: string): never => {
  throw new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT', status, error_code: errorCode },
  });
};

const providerOf = ({ provider }: ProviderInput): SocialProvider =>
  isSocialProvider(provider)
    ? provider
    : reject('unsupported_provider', 400, `Unsupported OAuth provider "${provider}".`);

const rejectLinked = (provider: SocialProvider): void => {
  if (linkedProviders.has(provider)) {
    reject('provider_already_linked', 409, 'A provider account is already linked.');
  }
};

const rejectBlankCode = ({ code }: CompleteLinkInput): void => {
  if (code.trim() === '') reject('missing_oauth_parameters', 400, 'Missing OAuth code or state');
};

const changedPayload = (input: ProviderInput): ChangedPayload => ({
  user: { id: '/api/users/social-links', success: true },
  clientMutationId: input.clientMutationId ?? null,
});

const issueLink = (provider: SocialProvider): string => {
  const excess = Math.max(0, pendingLinks.size + 1 - MAX_PENDING_LINKS);
  [...pendingLinks.keys()].slice(0, excess).forEach((state) => pendingLinks.delete(state));
  const state = `link.${uuidv4()}`;
  pendingLinks.set(state, { provider, expiresAt: Date.now() + STATE_TTL_MS });
  return state;
};

const consumeLink = (input: CompleteLinkInput, provider: SocialProvider): void => {
  const issued = pendingLinks.get(input.state);
  pendingLinks.delete(input.state);
  if (issued?.provider !== provider) {
    return reject('invalid_state', 422, 'Invalid or already consumed OAuth state');
  }
  if (issued.expiresAt <= Date.now()) reject('state_expired', 422, 'OAuth state expired');
};

export const socialLinkResolvers = {
  Query: {
    linkedSocialProviders: async (): Promise<SocialProvider[]> => [...linkedProviders],
  },
  Mutation: {
    initiateSocialLinkUser: async (
      _: unknown,
      { input }: { input: ProviderInput }
    ): Promise<InitiateLinkPayload> => {
      const provider = providerOf(input);
      rejectLinked(provider);
      const state = issueLink(provider);
      return {
        user: {
          id: `/api/oauth/links/${state}`,
          authorizationUrl: authorizationUrlFor(provider, state),
          state,
        },
        clientMutationId: input.clientMutationId ?? null,
      };
    },
    completeSocialLinkUser: async (
      _: unknown,
      { input }: { input: CompleteLinkInput }
    ): Promise<ChangedPayload> => {
      const provider = providerOf(input);
      rejectBlankCode(input);
      consumeLink(input, provider);
      const refusal = REFUSALS.get(input.code);
      if (refusal) reject(...refusal);
      rejectLinked(provider);
      linkedProviders.add(provider);
      return changedPayload(input);
    },
    unlinkSocialProviderUser: async (
      _: unknown,
      { input }: { input: ProviderInput }
    ): Promise<ChangedPayload> => {
      linkedProviders.delete(providerOf(input));
      return changedPayload(input);
    },
  },
};

export const clearSocialLinks = (): void => {
  pendingLinks.clear();
  linkedProviders.clear();
};

export const __socialLinkTest__ = { pendingLinks, issueLink };

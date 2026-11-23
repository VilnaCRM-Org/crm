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

const REFUSALS: Record<string, [errorCode: string, status: number, message: string]> = {
  'mock-expired': ['state_expired', 422, 'OAuth state expired'],
  'mock-duplicate': [
    'identity_linked_to_other_user',
    409,
    'The provider account is linked to another user.',
  ],
  'mock-unavailable': ['provider_unavailable', 503, 'The mock provider is unavailable.'],
};

const pendingLinks = new Map<string, SocialProvider>();
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

const changedPayload = (input: ProviderInput): ChangedPayload => ({
  user: { id: '/api/users/social-links', success: true },
  clientMutationId: input.clientMutationId ?? null,
});

const consumeLink = (input: CompleteLinkInput, provider: SocialProvider): void => {
  const issued = pendingLinks.get(input.state);
  pendingLinks.delete(input.state);
  if (issued !== provider) reject('invalid_state', 422, 'Invalid or already consumed OAuth state');
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
      if (linkedProviders.has(provider)) {
        reject('provider_already_linked', 409, 'A provider account is already linked.');
      }
      const state = `link.${uuidv4()}`;
      pendingLinks.set(state, provider);
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
      consumeLink(input, provider);
      const refusal = REFUSALS[input.code];
      if (refusal) reject(...refusal);
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

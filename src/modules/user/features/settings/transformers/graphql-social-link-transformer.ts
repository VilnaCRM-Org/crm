import type { ApolloError } from '@apollo/client';
import { inject, injectable } from 'tsyringe';

import type {
  CompleteSocialLinkMutation,
  InitiateSocialLinkMutation,
  LinkedSocialProvidersQuery,
  UnlinkSocialProviderMutation,
} from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';

import type { SocialLinkChangedPayload } from '../types/social-link/changed-payload';
import type {
  SocialLinkChangeOutcome,
  SocialLinkFailedOutcome,
  SocialLinkFailureKind,
  SocialLinkFailureOutcome,
  SocialLinksListedOutcome,
  SocialLinksReadFailedOutcome,
  SocialLinkStartOutcome,
} from '../types/social-link/outcome';
import {
  CompleteSocialLinkResultSchema,
  InitiateSocialLinkResultSchema,
  LinkedSocialProvidersResultSchema,
  UnlinkSocialProviderResultSchema,
} from '../utils/response-schemas';

const FAILURE_KINDS = new Map<string, SocialLinkFailureKind>([
  ['identity_linked_to_other_user', 'already_linked'],
  ['provider_already_linked', 'provider_linked'],
  ['last_sign_in_method', 'last_method'],
  ['invalid_state', 'expired'],
  ['state_expired', 'expired'],
  ['provider_unavailable', 'unavailable'],
]);

const REASON_KINDS = new Map<UserServiceFailureReason, SocialLinkFailureKind>([
  ['network', 'unavailable'],
  ['server', 'unavailable'],
  ['rate_limited', 'unavailable'],
]);

const GENERIC: SocialLinkFailedOutcome = { kind: 'failed', reason: 'generic' };

@injectable()
export default class GraphQLSocialLinkTransformer {
  constructor(
    @inject(AUTH_TOKENS.UserServiceErrorTransformer)
    private readonly errors: UserServiceErrorTransformer
  ) {}

  public toLinked(payload: LinkedSocialProvidersQuery): SocialLinksListedOutcome {
    const { linkedSocialProviders } = LinkedSocialProvidersResultSchema.parse(payload);
    return { kind: 'listed', linked: { items: linkedSocialProviders } };
  }

  public toListFailure({ reason }: UserServiceFailure): SocialLinksReadFailedOutcome {
    return {
      kind: 'failed',
      reason: reason === 'unauthenticated' ? 'session_ended' : 'unavailable',
    };
  }

  public toStart(payload: InitiateSocialLinkMutation | null): SocialLinkStartOutcome {
    const user = InitiateSocialLinkResultSchema.parse(payload)?.initiateSocialLinkUser?.user;
    return user ? { kind: 'started', ...user } : GENERIC;
  }

  public toCompleted(payload: CompleteSocialLinkMutation | null): SocialLinkChangeOutcome {
    return this.changed(CompleteSocialLinkResultSchema.parse(payload)?.completeSocialLinkUser);
  }

  public toUnlinked(payload: UnlinkSocialProviderMutation | null): SocialLinkChangeOutcome {
    return this.changed(UnlinkSocialProviderResultSchema.parse(payload)?.unlinkSocialProviderUser);
  }

  public failure(caught: unknown, signal: AbortSignal): UserServiceFailure {
    return this.errors.normalize(caught, signal);
  }

  public toFailure(error: unknown, { reason }: UserServiceFailure): SocialLinkFailureOutcome {
    if (reason === 'aborted' || reason === 'unauthenticated') return { kind: 'aborted' };
    const { graphQLErrors } = Object(error) as Partial<ApolloError>;
    const code = String(graphQLErrors?.[0]?.extensions?.error_code);
    return {
      kind: 'failed',
      reason: FAILURE_KINDS.get(code) ?? REASON_KINDS.get(reason) ?? 'generic',
    };
  }

  private changed(payload: SocialLinkChangedPayload | null | undefined): SocialLinkChangeOutcome {
    return payload?.user?.success === true ? { kind: 'changed' } : GENERIC;
  }
}

import type { ApolloError } from '@apollo/client';
import { injectable } from 'tsyringe';

import type {
  CompleteSocialLinkMutation,
  InitiateSocialLinkMutation,
  LinkedSocialProvidersQuery,
  UnlinkSocialProviderMutation,
} from '@/api/generated/graphql';
import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';

import type {
  LinkedProviderSet,
  SocialLinkChangeOutcome,
  SocialLinkFailureKind,
  SocialLinkFailureOutcome,
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

@injectable()
export default class GraphQLSocialLinkTransformer {
  public toLinked(payload: LinkedSocialProvidersQuery): LinkedProviderSet {
    return { items: LinkedSocialProvidersResultSchema.parse(payload).linkedSocialProviders };
  }

  public toStart(payload: InitiateSocialLinkMutation | null): SocialLinkStartOutcome {
    const { user } = InitiateSocialLinkResultSchema.parse(payload).initiateSocialLinkUser;
    return { kind: 'started', ...user };
  }

  public toCompleted(payload: CompleteSocialLinkMutation | null): SocialLinkChangeOutcome {
    CompleteSocialLinkResultSchema.parse(payload);
    return { kind: 'changed' };
  }

  public toUnlinked(payload: UnlinkSocialProviderMutation | null): SocialLinkChangeOutcome {
    UnlinkSocialProviderResultSchema.parse(payload);
    return { kind: 'changed' };
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
}

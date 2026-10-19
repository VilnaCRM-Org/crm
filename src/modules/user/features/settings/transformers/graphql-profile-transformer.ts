import { injectable } from 'tsyringe';

import type {
  CurrentUserQuery,
  ResendEmailToUserMutation,
  UpdateUserInput,
  UpdateUserMutation,
} from '@/api/generated/graphql';
import type {
  FieldViolation,
  FieldViolationSet,
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';

import type {
  ProfileFailedOutcome,
  ProfileFailureReason,
  ProfileFieldError,
  ProfileFieldErrorSet,
  ProfileInvalidOutcome,
  ProfileReadOutcome,
  ProfileResendOutcome,
  ProfileUpdateOutcome,
} from '../types/user-profile/outcome';
import type { ProfileChange } from '../types/user-profile/profile-change';
import type { UserNode } from '../types/user-profile/user-node';
import {
  CurrentUserResultSchema,
  ResendEmailResultSchema,
  UpdateUserResultSchema,
} from '../utils/response-schemas';

const FAILURE_REASONS = new Map<UserServiceFailureReason, ProfileFailureReason>([
  ['unauthenticated', 'session_ended'],
  ['access_denied', 'session_ended'],
  ['rate_limited', 'rate_limited'],
  ['network', 'transient'],
  ['server', 'transient'],
  ['aborted', 'transient'],
]);

const VIOLATION_FIELDS = new Map<string, ProfileFieldError>([
  ['initials:other', { field: 'fullName', reason: 'name_rejected' }],
  ['email:other', { field: 'email', reason: 'email_invalid' }],
  ['email:taken', { field: 'email', reason: 'email_taken' }],
  ['password:other', { field: 'currentPassword', reason: 'password_not_accepted' }],
  ['newPassword:other', { field: 'newPassword', reason: 'new_password_rejected' }],
]);

const REJECTED: ProfileFailedOutcome = { kind: 'failed', reason: 'rejected' };

@injectable()
export default class GraphQLProfileTransformer {
  public toUpdateInput(change: ProfileChange): UpdateUserInput {
    return {
      id: change.id,
      password: change.currentPassword,
      ...(change.fullName === undefined ? {} : { initials: change.fullName.trim() }),
      ...(change.email === undefined ? {} : { email: change.email }),
      ...(change.newPassword === undefined ? {} : { newPassword: change.newPassword }),
    };
  }

  public toReadOutcome(data: CurrentUserQuery | null | undefined): ProfileReadOutcome {
    const parsed = CurrentUserResultSchema.safeParse(data);
    return this.toUserOutcome(parsed.success ? parsed.data?.users?.edges?.[0]?.node : null);
  }

  public toUpdateOutcome(data: UpdateUserMutation | null | undefined): ProfileUpdateOutcome {
    const parsed = UpdateUserResultSchema.safeParse(data);
    return this.toUserOutcome(parsed.success ? parsed.data?.updateUser?.user : null);
  }

  public toResendOutcome(data: ResendEmailToUserMutation | null | undefined): ProfileResendOutcome {
    const parsed = ResendEmailResultSchema.safeParse(data);
    const user = parsed.success ? parsed.data?.resendEmailToUser?.user : null;
    return user ? { kind: 'confirmed', confirmed: user.confirmed } : REJECTED;
  }

  public invalid(failure: UserServiceFailure): ProfileInvalidOutcome | null {
    if (failure.reason === 'invalid_password') {
      return {
        kind: 'invalid',
        errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
      };
    }
    const errors = failure.reason === 'violation' ? this.fieldErrors(failure.violations) : null;
    return errors === null ? null : { kind: 'invalid', errors };
  }

  public failed(failure: UserServiceFailure): ProfileFailedOutcome {
    return { kind: 'failed', reason: FAILURE_REASONS.get(failure.reason) ?? 'rejected' };
  }

  private toUserOutcome(node: UserNode | null | undefined): ProfileReadOutcome {
    if (!node) return REJECTED;
    const { id, initials, email, confirmed } = node;
    return { kind: 'ok', user: { id, fullName: initials, email, confirmed } };
  }

  private fieldErrors({ items, complete }: FieldViolationSet): ProfileFieldErrorSet | null {
    if (!complete || items.length === 0) return null;
    const found: ProfileFieldError[] = [];
    for (const violation of items) {
      const error = this.fieldErrorOf(violation);
      if (error === undefined) return null;
      found.push(error);
    }
    return { items: found };
  }

  private fieldErrorOf(violation: FieldViolation): ProfileFieldError | undefined {
    return VIOLATION_FIELDS.get(`${violation.path}:${violation.reason}`);
  }
}

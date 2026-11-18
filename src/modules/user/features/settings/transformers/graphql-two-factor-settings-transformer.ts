import { injectable } from 'tsyringe';

import type {
  ConfirmTwoFactorUserMutation,
  DisableTwoFactorUserMutation,
  RegenerateRecoveryCodesUserMutation,
  SetupTwoFactorUserMutation,
} from '@/api/generated/graphql';
import type {
  RecoveryCodeSet,
  TwoFactorSettingsEntity,
} from '@/modules/user/types/user/two-factor-settings-entity';
import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';

import type {
  TwoFactorSettingsChangedOutcome,
  TwoFactorSettingsFailedOutcome,
  TwoFactorSettingsFailureReason,
  TwoFactorSettingsOutcome,
} from '../types/two-factor/outcome';
import {
  ConfirmTwoFactorResultSchema,
  DisableTwoFactorResultSchema,
  RegenerateRecoveryCodesResultSchema,
  SetupTwoFactorResultSchema,
} from '../utils/response-schemas';

const FAILURE_REASONS = new Map<UserServiceFailureReason, TwoFactorSettingsFailureReason>([
  ['already_enabled', 'already_enabled'],
  ['not_enabled', 'not_enabled'],
  ['setup_not_initiated', 'setup_not_initiated'],
  ['invalid_code', 'invalid_code'],
  ['violation', 'invalid_code'],
  ['reauth_required', 'reauth_required'],
  ['unauthenticated', 'session_ended'],
  ['access_denied', 'session_ended'],
  ['rate_limited', 'rate_limited'],
  ['network', 'network'],
  ['aborted', 'network'],
]);

const SERVER_FAILURE: TwoFactorSettingsFailedOutcome = { kind: 'failed', reason: 'server' };

const DISABLED: TwoFactorSettingsEntity = {
  status: 'disabled',
  otpauthUri: null,
  secret: null,
  recoveryCodes: null,
};

@injectable()
export default class GraphQLTwoFactorSettingsTransformer {
  public toEnrolmentOutcome(
    payload: SetupTwoFactorUserMutation | null | undefined
  ): TwoFactorSettingsOutcome {
    const parsed = SetupTwoFactorResultSchema.safeParse(payload);
    const user = parsed.success ? parsed.data?.setupTwoFactorUser?.user : null;
    if (!user) return SERVER_FAILURE;
    return this.changed({ ...DISABLED, otpauthUri: user.otpauthUri, secret: user.secret });
  }

  public toRecoveryCodesOutcome(
    payload: ConfirmTwoFactorUserMutation | RegenerateRecoveryCodesUserMutation | null | undefined
  ): TwoFactorSettingsOutcome {
    const confirmed = ConfirmTwoFactorResultSchema.safeParse(payload);
    if (confirmed.success && confirmed.data) {
      return this.enabledWith(confirmed.data.confirmTwoFactorUser?.user);
    }
    const regenerated = RegenerateRecoveryCodesResultSchema.safeParse(payload);
    return this.enabledWith(
      regenerated.success ? regenerated.data?.regenerateRecoveryCodesUser?.user : null
    );
  }

  public toDisabledOutcome(
    payload: DisableTwoFactorUserMutation | null | undefined
  ): TwoFactorSettingsOutcome {
    const parsed = DisableTwoFactorResultSchema.safeParse(payload);
    const user = parsed.success ? parsed.data?.disableTwoFactorUser?.user : null;
    return user?.success === true ? this.changed(DISABLED) : SERVER_FAILURE;
  }

  public toFailureOutcome(failure: UserServiceFailure): TwoFactorSettingsFailedOutcome {
    const reason = FAILURE_REASONS.get(failure.reason);
    return reason === undefined ? SERVER_FAILURE : { kind: 'failed', reason };
  }

  private enabledWith(
    user: { readonly recoveryCodes: readonly string[] } | null | undefined
  ): TwoFactorSettingsOutcome {
    if (!user) return SERVER_FAILURE;
    const recoveryCodes: RecoveryCodeSet = {
      items: user.recoveryCodes.map((value) => ({ value })),
    };
    return this.changed({ status: 'enabled', otpauthUri: null, secret: null, recoveryCodes });
  }

  private changed(settings: TwoFactorSettingsEntity): TwoFactorSettingsChangedOutcome {
    return { kind: 'changed', settings };
  }
}

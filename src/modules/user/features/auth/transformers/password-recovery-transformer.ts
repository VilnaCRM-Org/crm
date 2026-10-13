import { injectable } from 'tsyringe';

import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import type { UserServiceFailure } from '@/modules/user/types/user-service/user-service-failure';
import type {
  RecoveryConfirmedOutcome,
  RecoveryFailedOutcome,
  RecoveryFailureReason,
  RecoverySentOutcome,
  RecoveryStep,
} from '@auth/types/password-recovery/outcome';

const TOKEN_VIOLATION = 'token_violation';
const MASK = '*****';
const CONFIRMED_OUTCOME: RecoveryConfirmedOutcome = { kind: 'confirmed' };

const STEP_REASONS = {
  request: new Map<string, RecoveryFailureReason>([
    ['violation', 'invalid_email'],
    ['refused', 'rate_limited'],
  ]),
  confirm: new Map<string, RecoveryFailureReason>([
    ['violation', 'policy_rejected'],
    [TOKEN_VIOLATION, 'invalid_link'],
    ['refused', 'invalid_link'],
  ]),
};

const SHARED_REASONS = new Map<string, RecoveryFailureReason>([
  ['rate_limited', 'rate_limited'],
  ['network', 'network'],
  ['aborted', 'network'],
]);

const RETRYABLE_REASONS: ReadonlySet<RecoveryFailureReason> = new Set(['network', 'server']);

@injectable()
export default class PasswordRecoveryTransformer {
  public toSentOutcome(dto: RestorePasswordDto): RecoverySentOutcome {
    return { kind: 'sent', maskedEmail: this.mask(dto.email) };
  }

  public toConfirmedOutcome(): RecoveryConfirmedOutcome {
    return CONFIRMED_OUTCOME;
  }

  public fromFailure(step: RecoveryStep, failure: UserServiceFailure): RecoveryFailedOutcome {
    const key = this.isTokenViolation(failure) ? TOKEN_VIOLATION : failure.reason;
    const reason = STEP_REASONS[step].get(key) ?? SHARED_REASONS.get(key) ?? 'server';
    return { kind: 'failed', failure: { reason, retryable: RETRYABLE_REASONS.has(reason) } };
  }

  private isTokenViolation(failure: UserServiceFailure): boolean {
    return (
      failure.reason === 'violation' && failure.violations.items.some((v) => v.path === 'token')
    );
  }

  private mask(email: string): string {
    const at = email.lastIndexOf('@');
    if (at < 0) return MASK;
    const local = email.slice(0, at);
    return `${local.slice(0, local.length >= 6 ? 3 : 1)}${MASK}${email.slice(at)}`;
  }
}

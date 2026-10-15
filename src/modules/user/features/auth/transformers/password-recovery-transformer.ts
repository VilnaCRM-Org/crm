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

const MASK = '*****';
const LONG_LOCAL_PART_MIN = 6;
const LONG_VISIBLE_PREFIX = 3;
const SHORT_VISIBLE_PREFIX = 1;
const CONFIRMED_OUTCOME: RecoveryConfirmedOutcome = { kind: 'confirmed' };

const STEP_REASONS = {
  request: new Map<string, RecoveryFailureReason>([
    ['violation', 'invalid_email'],
    ['refused', 'rate_limited'],
  ]),
  confirm: new Map<string, RecoveryFailureReason>([
    ['violation', 'policy_rejected'],
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
    const reason = this.reasonOf(step, failure);
    return { kind: 'failed', failure: { reason, retryable: RETRYABLE_REASONS.has(reason) } };
  }

  private reasonOf(step: RecoveryStep, failure: UserServiceFailure): RecoveryFailureReason {
    if (this.isTokenViolation(failure)) return 'invalid_link';
    const { reason } = failure;
    return STEP_REASONS[step].get(reason) ?? SHARED_REASONS.get(reason) ?? 'server';
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
    const visible =
      local.length >= LONG_LOCAL_PART_MIN ? LONG_VISIBLE_PREFIX : SHORT_VISIBLE_PREFIX;
    return `${local.slice(0, visible)}${MASK}${email.slice(at)}`;
  }
}

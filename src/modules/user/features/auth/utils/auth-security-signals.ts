import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import SECURITY_EVENT_TOKENS from '@/services/security-events/tokens';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type {
  AuthFailureReason,
  SecurityEventRecorder,
} from '@/services/types/security-events/security-event';
import type { AuthError } from '@auth/types/auth-error';
import type { LoginResult, RegisterResult } from '@auth/types/auth-repository';

const TOO_MANY_REQUESTS = 429;

const KNOWN_REASONS: ReadonlySet<string> = new Set<AuthFailureReason>([
  'authentication',
  'validation',
  'conflict',
  'server',
  'network',
]);

@injectable()
export default class AuthSecuritySignals {
  constructor(
    @inject(SECURITY_EVENT_TOKENS.SecurityEventReporter)
    private readonly recorder: SecurityEventRecorder,
    @inject(OBSERVABILITY_TOKENS.ObservabilityService)
    private readonly observability: ObservabilityService
  ) {}

  public loginSettled(result: LoginResult): void {
    if (result.ok) {
      this.observability.setUser({ id: uuidv4() });
      return;
    }
    if (result.error.aborted) return;
    this.loginFailed(result.error);
  }

  public registerSettled(result: RegisterResult): void {
    if (result.ok || result.error.aborted) return;
    this.registerFailed(result.error);
  }

  public loginFailed(error: unknown): void {
    this.recorder.authFailure('login', this.reasonOf(error));
  }

  public registerFailed(error: unknown): void {
    this.recorder.authFailure('registration', this.reasonOf(error));
  }

  private reasonOf(error: unknown): AuthFailureReason {
    if (this.statusOf(error) === TOO_MANY_REQUESTS) return 'rate_limited';
    const kind = (error as Partial<AuthError> | null | undefined)?.kind;
    return KNOWN_REASONS.has(kind as string) ? (kind as AuthFailureReason) : 'unknown';
  }

  private statusOf(error: unknown): number | undefined {
    const status = (error as { status?: unknown } | null | undefined)?.status;
    return typeof status === 'number' ? status : undefined;
  }
}

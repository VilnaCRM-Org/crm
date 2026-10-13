import type { Dispatch } from 'react';

import type { FormErrorAction } from '@/components/types/ui-form';
import type { AbortableSubmit } from '@/hooks/types/use-abortable-submit';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import type { RecoveryFailure, ResetPasswordOutcome } from '@auth/types/password-recovery/outcome';

export type ResetPasswordStep = 'form' | 'sent';

export interface ResetPasswordCallbacks {
  submit(dto: RestorePasswordDto): Promise<void>;
  retry(): Promise<void>;
  backToForm(): void;
}

export interface ResetPasswordView {
  readonly step: ResetPasswordStep;
  readonly submittedEmail: string;
  readonly maskedEmail: string | null;
  readonly failure: RecoveryFailure | null;
}

export interface ResetPasswordState extends ResetPasswordView {
  readonly isSubmitting: boolean;
  readonly callbacks: ResetPasswordCallbacks;
}

export interface ResetPasswordSubmitted {
  readonly type: 'submitted';
  readonly email: string;
}

export interface ResetPasswordSettled {
  readonly type: 'settled';
  readonly outcome: ResetPasswordOutcome | null;
}

export interface ResetPasswordBack {
  readonly type: 'back';
}

export type ResetPasswordAction = ResetPasswordSubmitted | ResetPasswordSettled | ResetPasswordBack;

export interface ResetPasswordCallbackDeps {
  readonly dispatch: Dispatch<ResetPasswordAction>;
  readonly submitter: AbortableSubmit<RestorePasswordDto, ResetPasswordOutcome>;
  readonly submittedEmail: string;
}

export interface RecoveryFailureBanner {
  readonly error: string | null;
  readonly errorAction?: FormErrorAction | undefined;
}

import type { Dispatch } from 'react';

import type { AbortableSubmit } from '@/hooks/types/use-abortable-submit';
import type { CreateNewPasswordDto } from '@/modules/user/types/user/create-new-password-dto';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import type PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import type {
  CreateNewPasswordOutcome,
  RecoveryFailure,
  ResetPasswordOutcome,
} from '@auth/types/password-recovery/outcome';

export type ResetPasswordStep = 'form' | 'sent';

export interface ResetPasswordCallbacks {
  submit(dto: RestorePasswordDto): Promise<void>;
  dismissFailure(): void;
  backToForm(): void;
}

export interface ResetPasswordView {
  readonly step: ResetPasswordStep;
  readonly submittedEmail: string;
  readonly maskedEmail: string | null;
  readonly failure: RecoveryFailure | null;
  readonly returned: boolean;
}

export interface ResetPasswordState extends ResetPasswordView {
  readonly isSubmitting: boolean;
  readonly callbacks: ResetPasswordCallbacks;
}

export interface ResetPasswordSubmitted {
  readonly type: 'submitted';
}

export interface ResetPasswordSettled {
  readonly type: 'settled';
  readonly email: string;
  readonly outcome: ResetPasswordOutcome | null;
}

export interface ResetPasswordBack {
  readonly type: 'back';
}

export interface ResetPasswordDismissed {
  readonly type: 'dismissed';
}

export type ResetPasswordAction =
  ResetPasswordSubmitted | ResetPasswordSettled | ResetPasswordBack | ResetPasswordDismissed;

export interface ResetPasswordCallbackDeps {
  readonly dispatch: Dispatch<ResetPasswordAction>;
  readonly submitter: AbortableSubmit<RestorePasswordDto, ResetPasswordOutcome>;
}

export interface RecoveryFailureBanner {
  readonly error: string | null;
  readonly retry: boolean;
}

export interface CreateNewPasswordCallbacks {
  submit(dto: CreateNewPasswordDto): Promise<void>;
  dismissFailure(): void;
}

export interface CreateNewPasswordInvalidState {
  readonly view: 'invalid';
}

export interface CreateNewPasswordFormState {
  readonly view: 'form';
  readonly failure: RecoveryFailure | null;
  readonly isSubmitting: boolean;
  readonly callbacks: CreateNewPasswordCallbacks;
}

export type CreateNewPasswordState = CreateNewPasswordInvalidState | CreateNewPasswordFormState;

export type RecoveryProviderStep<TDto, TOutcome> = (
  provider: PasswordRecoveryProvider,
  dto: TDto,
  signal: AbortSignal
) => Promise<TOutcome>;

export interface CreateNewPasswordViewState {
  readonly failure: RecoveryFailure | null;
  readonly linkInvalid: boolean;
  settle(outcome: CreateNewPasswordOutcome | null): void;
  clearFailure(): void;
}

export interface CreateNewPasswordCallbackDeps {
  readonly submitter: AbortableSubmit<CreateNewPasswordDto, CreateNewPasswordOutcome>;
  readonly viewState: CreateNewPasswordViewState;
}

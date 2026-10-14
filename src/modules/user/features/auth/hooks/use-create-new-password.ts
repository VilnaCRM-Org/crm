import { useState } from 'react';
import { type NavigateFunction, useNavigate } from 'react-router';

import useAbortableSubmit from '@/hooks/use-abortable-submit';
import type { CreateNewPasswordDto } from '@/modules/user/types/user/create-new-password-dto';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import useRecoveryRun from '@auth/hooks/use-recovery-run';
import type { AuthProviderLoader } from '@auth/stores';
import type {
  CreateNewPasswordOutcome,
  RecoveryFailure,
} from '@auth/types/password-recovery/outcome';
import type {
  CreateNewPasswordCallbackDeps,
  CreateNewPasswordCallbacks,
  CreateNewPasswordInvalidState,
  CreateNewPasswordState,
  CreateNewPasswordViewDeps,
  CreateNewPasswordViewState,
  RecoveryProviderStep,
  ResetTokenHandle,
} from '@auth/types/password-recovery/state';

const PASSWORD_RESET_ARRIVAL: RedirectNavigationState = {
  focusMain: true,
  notice: 'password_reset',
};

const INVALID_LINK: CreateNewPasswordInvalidState = { view: 'invalid' };

const CONFIRM_STEP: RecoveryProviderStep<CreateNewPasswordDto, CreateNewPasswordOutcome> = (
  provider,
  dto,
  signal
) => provider.confirmReset(dto, signal);

function nextFailure(outcome: CreateNewPasswordOutcome): RecoveryFailure | null {
  return outcome.kind === 'failed' && outcome.failure.reason !== 'invalid_link'
    ? outcome.failure
    : null;
}

function goToSignIn(navigate: NavigateFunction): void {
  navigate(ROUTE_PATHS.signIn, { replace: true, state: PASSWORD_RESET_ARRIVAL });
}

function discardLink({ resetToken, submitter }: CreateNewPasswordViewDeps): void {
  submitter.forget();
  resetToken.discard();
}

function useCreateNewPasswordView(deps: CreateNewPasswordViewDeps): CreateNewPasswordViewState {
  const navigate = useNavigate();
  const [failure, setFailure] = useState<RecoveryFailure | null>(null);

  const settle = (outcome: CreateNewPasswordOutcome | null): void => {
    if (outcome === null) return;
    if (outcome.kind === 'confirmed') goToSignIn(navigate);
    else if (outcome.failure.reason === 'invalid_link') discardLink(deps);
    setFailure(nextFailure(outcome));
  };

  return { failure, settle, clearFailure: (): void => setFailure(null) };
}

function useCreateNewPasswordCallbacks({
  submitter,
  viewState,
}: CreateNewPasswordCallbackDeps): CreateNewPasswordCallbacks {
  return {
    submit: async ({ token, newPassword }: CreateNewPasswordDto): Promise<void> => {
      viewState.clearFailure();
      viewState.settle(await submitter.submit({ token, newPassword }));
    },
    retry: async (): Promise<void> => {
      viewState.clearFailure();
      viewState.settle(await submitter.retry());
    },
  };
}

export default function useCreateNewPassword(
  loader: AuthProviderLoader,
  resetToken: ResetTokenHandle
): CreateNewPasswordState {
  const submitter = useAbortableSubmit(useRecoveryRun(loader, CONFIRM_STEP));
  const viewState = useCreateNewPasswordView({ resetToken, submitter });
  const callbacks = useCreateNewPasswordCallbacks({ submitter, viewState });
  const { token } = resetToken;
  if (token === null) return INVALID_LINK;

  return {
    view: 'form',
    token,
    failure: viewState.failure,
    isSubmitting: submitter.isSubmitting,
    callbacks,
  };
}

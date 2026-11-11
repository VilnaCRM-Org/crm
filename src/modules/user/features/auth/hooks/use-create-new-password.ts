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
  CreateNewPasswordViewState,
  RecordedRecoveryFailure,
  RecoveryProviderStep,
} from '@auth/types/password-recovery/state';

const PASSWORD_RESET_ARRIVAL: RedirectNavigationState = {
  focusMain: true,
  notice: 'password_reset',
};

const INVALID_LINK: CreateNewPasswordInvalidState = { view: 'invalid' };

const NO_FAILURE: RecordedRecoveryFailure = { failure: null, failureOccurrence: 0 };

const CONFIRM_STEP: RecoveryProviderStep<CreateNewPasswordDto, CreateNewPasswordOutcome> = (
  provider,
  dto,
  signal
) => provider.confirmReset(dto, signal);

function nextFailure(outcome: CreateNewPasswordOutcome): RecoveryFailure | null {
  return outcome.kind === 'failed' ? outcome.failure : null;
}

function recordFailure(
  current: RecordedRecoveryFailure,
  failure: RecoveryFailure | null
): RecordedRecoveryFailure {
  return failure === null
    ? { ...current, failure }
    : { failure, failureOccurrence: current.failureOccurrence + 1 };
}

function goToSignIn(navigate: NavigateFunction): void {
  navigate(ROUTE_PATHS.signIn, { replace: true, state: PASSWORD_RESET_ARRIVAL });
}

function useCreateNewPasswordView(): CreateNewPasswordViewState {
  const navigate = useNavigate();
  const [recorded, setRecorded] = useState(NO_FAILURE);
  const [linkInvalid, setLinkInvalid] = useState(false);

  const settle = (outcome: CreateNewPasswordOutcome | null): void => {
    if (outcome === null) return;
    if (outcome.kind === 'confirmed') goToSignIn(navigate);
    else if (outcome.failure.reason === 'invalid_link') setLinkInvalid(true);
    setRecorded((current) => recordFailure(current, nextFailure(outcome)));
  };

  return {
    ...recorded,
    linkInvalid,
    settle,
    clearFailure: (): void => setRecorded((current) => recordFailure(current, null)),
  };
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
    dismissFailure: viewState.clearFailure,
  };
}

export default function useCreateNewPassword(loader: AuthProviderLoader): CreateNewPasswordState {
  const submitter = useAbortableSubmit(useRecoveryRun(loader, CONFIRM_STEP));
  const viewState = useCreateNewPasswordView();
  const callbacks = useCreateNewPasswordCallbacks({ submitter, viewState });
  if (viewState.linkInvalid) return INVALID_LINK;

  return {
    view: 'form',
    failure: viewState.failure,
    failureOccurrence: viewState.failureOccurrence,
    isSubmitting: submitter.isSubmitting,
    callbacks,
  };
}

import { useReducer } from 'react';

import useAbortableSubmit from '@/hooks/use-abortable-submit';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import useRecoveryRun from '@auth/hooks/use-recovery-run';
import type { AuthProviderLoader } from '@auth/stores';
import type { ResetPasswordOutcome } from '@auth/types/password-recovery/outcome';
import type {
  RecoveryProviderStep,
  ResetPasswordAction,
  ResetPasswordCallbackDeps,
  ResetPasswordCallbacks,
  ResetPasswordSettled,
  ResetPasswordState,
  ResetPasswordView,
} from '@auth/types/password-recovery/state';

const INITIAL_VIEW: ResetPasswordView = {
  step: 'form',
  submittedEmail: '',
  maskedEmail: null,
  failure: null,
};

const REQUEST_STEP: RecoveryProviderStep<RestorePasswordDto, ResetPasswordOutcome> = (
  provider,
  dto,
  signal
) => provider.requestReset(dto, signal);

function settle(
  view: ResetPasswordView,
  { email, outcome }: ResetPasswordSettled
): ResetPasswordView {
  if (outcome === null) return view;
  const accepted = { ...view, submittedEmail: email };
  return outcome.kind === 'sent'
    ? { ...accepted, step: 'sent', maskedEmail: outcome.maskedEmail }
    : { ...accepted, failure: outcome.failure };
}

function reduceResetPassword(
  view: ResetPasswordView,
  action: ResetPasswordAction
): ResetPasswordView {
  if (action.type === 'submitted') return { ...view, failure: null };
  if (action.type === 'back') return { ...view, step: 'form', failure: null };
  return settle(view, action);
}

function useResetCallbacks(deps: ResetPasswordCallbackDeps): ResetPasswordCallbacks {
  const { dispatch, submitter } = deps;
  const settleWith = async (
    email: string,
    pending: Promise<ResetPasswordOutcome | null>
  ): Promise<void> => {
    dispatch({ type: 'submitted' });
    dispatch({ type: 'settled', email, outcome: await pending });
  };

  return {
    submit: (dto: RestorePasswordDto): Promise<void> => {
      const email = dto.email.trim();
      return settleWith(email, submitter.submit({ email }));
    },
    retry: (): Promise<void> => settleWith(deps.submittedEmail, submitter.retry()),
    backToForm: (): void => dispatch({ type: 'back' }),
  };
}

export default function useResetPassword(loader: AuthProviderLoader): ResetPasswordState {
  const [view, dispatch] = useReducer(reduceResetPassword, INITIAL_VIEW);
  const submitter = useAbortableSubmit(useRecoveryRun(loader, REQUEST_STEP));
  const callbacks = useResetCallbacks({ dispatch, submitter, submittedEmail: view.submittedEmail });

  return { ...view, isSubmitting: submitter.isSubmitting, callbacks };
}

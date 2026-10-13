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

function settle(view: ResetPasswordView, outcome: ResetPasswordOutcome | null): ResetPasswordView {
  if (outcome === null) return view;
  return outcome.kind === 'sent'
    ? { ...view, step: 'sent', maskedEmail: outcome.maskedEmail }
    : { ...view, failure: outcome.failure };
}

function reduceResetPassword(
  view: ResetPasswordView,
  action: ResetPasswordAction
): ResetPasswordView {
  if (action.type === 'submitted') return { ...view, submittedEmail: action.email, failure: null };
  if (action.type === 'back') return { ...view, step: 'form', failure: null };
  return settle(view, action.outcome);
}

function useResetCallbacks(deps: ResetPasswordCallbackDeps): ResetPasswordCallbacks {
  const { dispatch, submitter } = deps;
  const settleWith = async (pending: Promise<ResetPasswordOutcome | null>): Promise<void> =>
    dispatch({ type: 'settled', outcome: await pending });

  return {
    submit: (dto: RestorePasswordDto): Promise<void> => {
      const email = dto.email.trim();
      dispatch({ type: 'submitted', email });
      return settleWith(submitter.submit({ email }));
    },
    retry: (): Promise<void> => {
      dispatch({ type: 'submitted', email: deps.submittedEmail });
      return settleWith(submitter.retry());
    },
    backToForm: (): void => dispatch({ type: 'back' }),
  };
}

export default function useResetPassword(loader: AuthProviderLoader): ResetPasswordState {
  const [view, dispatch] = useReducer(reduceResetPassword, INITIAL_VIEW);
  const submitter = useAbortableSubmit(useRecoveryRun(loader, REQUEST_STEP));
  const callbacks = useResetCallbacks({ dispatch, submitter, submittedEmail: view.submittedEmail });

  return { ...view, isSubmitting: submitter.isSubmitting, callbacks };
}

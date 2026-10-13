import { useCallback, useReducer } from 'react';

import useAbortableSubmit from '@/hooks/use-abortable-submit';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import type PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type {
  RecoveryFailedOutcome,
  ResetPasswordOutcome,
} from '@auth/types/password-recovery/outcome';
import type {
  ResetPasswordAction,
  ResetPasswordCallbackDeps,
  ResetPasswordCallbacks,
  ResetPasswordState,
  ResetPasswordView,
} from '@auth/types/password-recovery/state';

const LOAD_FAILURE: RecoveryFailedOutcome = {
  kind: 'failed',
  failure: { reason: 'network', retryable: true },
};

const INITIAL_VIEW: ResetPasswordView = {
  step: 'form',
  submittedEmail: '',
  maskedEmail: null,
  failure: null,
};

async function requestReset(
  loader: AuthProviderLoader,
  dto: RestorePasswordDto,
  signal: AbortSignal
): Promise<ResetPasswordOutcome> {
  let provider: PasswordRecoveryProvider;
  try {
    provider = await loader.resolve<PasswordRecoveryProvider>(AUTH_TOKENS.PasswordRecoveryProvider);
  } catch {
    return LOAD_FAILURE;
  }
  return provider.requestReset(dto, signal);
}

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
  const run = useCallback(
    (dto: RestorePasswordDto, signal: AbortSignal): Promise<ResetPasswordOutcome> =>
      requestReset(loader, dto, signal),
    [loader]
  );
  const submitter = useAbortableSubmit(run);
  const callbacks = useResetCallbacks({ dispatch, submitter, submittedEmail: view.submittedEmail });

  return { ...view, isSubmitting: submitter.isSubmitting, callbacks };
}

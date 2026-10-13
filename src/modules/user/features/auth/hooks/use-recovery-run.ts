import { useCallback } from 'react';

import type { AbortableRun } from '@/hooks/types/use-abortable-submit';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type { RecoveryFailedOutcome } from '@auth/types/password-recovery/outcome';
import type { RecoveryProviderStep } from '@auth/types/password-recovery/state';

const LOAD_FAILURE: RecoveryFailedOutcome = {
  kind: 'failed',
  failure: { reason: 'network', retryable: true },
};

export default function useRecoveryRun<TDto, TOutcome>(
  loader: AuthProviderLoader,
  step: RecoveryProviderStep<TDto, TOutcome>
): AbortableRun<TDto, TOutcome | RecoveryFailedOutcome> {
  return useCallback(
    async (dto: TDto, signal: AbortSignal): Promise<TOutcome | RecoveryFailedOutcome> => {
      let provider: PasswordRecoveryProvider;
      try {
        provider = await loader.resolve<PasswordRecoveryProvider>(
          AUTH_TOKENS.PasswordRecoveryProvider
        );
      } catch {
        return LOAD_FAILURE;
      }
      return step(provider, dto, signal);
    },
    [loader, step]
  );
}

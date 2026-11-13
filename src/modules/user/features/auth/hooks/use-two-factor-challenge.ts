import { useState } from 'react';
import type { Dispatch } from 'react';
import { useLocation, useNavigate } from 'react-router';

import TwoFactorCodeNormalizer from '@/modules/user/lib/two-factor-code-normalizer';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import useChallengeSubmit from '@auth/hooks/use-challenge-submit';
import useChallengeView, { fieldErrorOf } from '@auth/hooks/use-challenge-view';
import type { AuthProviderLoader } from '@auth/stores';
import type {
  ChallengeAction,
  ChallengeCallbackDeps,
  ChallengeSender,
  ChallengeSubmitter,
  TwoFactorChallengeCallbacks,
  TwoFactorChallengeProps,
} from '@auth/types/two-factor/challenge-view';

function useChallengeSubmitter(loader: AuthProviderLoader): ChallengeSubmitter {
  const navigate = useNavigate();
  const from = (useLocation().state as RedirectNavigationState | null)?.from;
  return useChallengeSubmit({ loader, navigate, from });
}

function useChallengeSender(
  submitter: ChallengeSubmitter,
  dispatch: Dispatch<ChallengeAction>
): ChallengeSender {
  const send = async (dto: TwoFactorDto, value: string): Promise<void> => {
    dispatch({ type: 'submitted', value });
    dispatch({ type: 'settled', result: await submitter.submit(dto) });
  };
  return { send };
}

function useChallengeCallbacks(deps: ChallengeCallbackDeps): TwoFactorChallengeCallbacks {
  const { normalizer, view, dispatch, sender } = deps;
  return {
    submit: (dto: TwoFactorDto): void => {
      const code = normalizer.normalize(dto.twoFactorCode, view.mode);
      if (code !== null) void sender.send({ twoFactorCode: code }, dto.twoFactorCode);
      else {
        const fieldError = fieldErrorOf(dto.twoFactorCode, view.mode);
        dispatch({ type: 'rejected', value: dto.twoFactorCode, fieldError });
      }
    },
    switchMode: (): void => dispatch({ type: 'switched' }),
  };
}

export default function useTwoFactorChallenge(loader: AuthProviderLoader): TwoFactorChallengeProps {
  const [normalizer] = useState(() => new TwoFactorCodeNormalizer());
  const { view, dispatch } = useChallengeView();
  const submitter = useChallengeSubmitter(loader);
  const sender = useChallengeSender(submitter, dispatch);
  const callbacks = useChallengeCallbacks({ normalizer, view, dispatch, sender });
  return { state: { ...view, isSubmitting: submitter.isSubmitting }, callbacks };
}

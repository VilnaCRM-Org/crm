import { createElement } from 'react';

import useSubmitRetry from '@/hooks/use-submit-retry';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import ChallengeNote from '@auth/components/two-factor/challenge-note';
import ModeToggle from '@auth/components/two-factor/mode-toggle';
import useChallengeBanner from '@auth/hooks/use-challenge-banner';
import useChallengeCopy from '@auth/hooks/use-challenge-copy';
import type { ChallengeFormProps } from '@auth/types/two-factor/challenge-components';
import type { TwoFactorChallengeProps } from '@auth/types/two-factor/challenge-view';

const DEFAULT_VALUES = { twoFactorCode: '' };

export default function useChallengeFormProps({
  state,
  callbacks,
}: TwoFactorChallengeProps): ChallengeFormProps {
  const copy = useChallengeCopy(state.mode);
  const { submitRef, retry } = useSubmitRetry();
  const banner = useChallengeBanner(state.banner, retry);
  const focusOnMount = useFocusOnMount<HTMLElement>();

  return {
    onSubmit: callbacks.submit,
    defaultValues: DEFAULT_VALUES,
    error: banner.error,
    errorAction: banner.action,
    errorOccurrence: state.bannerOccurrence,
    submitRef,
    submitLabel: copy.submitLabel,
    submittingLabel: copy.submittingLabel,
    title: copy.title,
    titleRef: focusOnMount,
    subtitle: copy.subtitle,
    footer: createElement(ModeToggle, {
      mode: state.mode,
      busy: state.isSubmitting,
      onSwitch: callbacks.switchMode,
    }),
    notice: createElement(ChallengeNote, { text: copy.note }),
  };
}

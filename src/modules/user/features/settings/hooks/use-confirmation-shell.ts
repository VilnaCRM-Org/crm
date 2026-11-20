import useSubmitRetry from '@/hooks/use-submit-retry';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { ConfirmationShell } from '../types/hooks/confirmation-shell';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useTwoFactorBanner from './use-two-factor-banner';

export default function useConfirmationShell({ view }: TwoFactorSettingsProps): ConfirmationShell {
  const { submitRef, retry } = useSubmitRetry();
  const banner = useTwoFactorBanner(view.banner, retry);
  const titleRef = useFocusOnMount<HTMLElement>();

  return {
    error: banner.error,
    errorAction: banner.action,
    errorOccurrence: view.bannerOccurrence,
    submitRef,
    titleRef,
  };
}

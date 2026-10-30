import { useTranslation } from 'react-i18next';

import useSubmitRetry from '@/hooks/use-submit-retry';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { DisableFormProps } from '../types/components/two-factor-settings';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useTwoFactorBanner from './use-two-factor-banner';

const DEFAULT_VALUES = { twoFactorCode: '' };

export default function useDisableFormProps({
  view,
  callbacks,
}: TwoFactorSettingsProps): DisableFormProps {
  const { t } = useTranslation();
  const { submitRef, retry } = useSubmitRetry();
  const banner = useTwoFactorBanner(view.banner, retry);
  const titleRef = useFocusOnMount<HTMLElement>();

  return {
    onSubmit: callbacks.disable,
    defaultValues: DEFAULT_VALUES,
    error: banner.error,
    errorAction: banner.action,
    errorOccurrence: view.bannerOccurrence,
    submitRef,
    title: t('settings.two_factor.disable.title'),
    titleRef,
    subtitle: t('settings.two_factor.disable.description'),
    submitLabel: t('settings.two_factor.disable.submit'),
    submittingLabel: t('settings.two_factor.disable.submitting'),
  };
}

import { useTranslation } from 'react-i18next';

import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { SetupFormProps } from '../types/components/two-factor-settings';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useTwoFactorBanner from './use-two-factor-banner';

const DEFAULT_VALUES = { twoFactorCode: '' };

export default function useSetupFormProps({
  view,
  callbacks,
}: TwoFactorSettingsProps): SetupFormProps {
  const { t } = useTranslation();
  const banner = useTwoFactorBanner(view.banner, callbacks.retry);
  const titleRef = useFocusOnMount<HTMLElement>();

  return {
    onSubmit: callbacks.confirm,
    defaultValues: DEFAULT_VALUES,
    error: banner.error,
    errorAction: banner.action,
    title: t('settings.two_factor.setup.title'),
    titleRef,
    subtitle: t('settings.two_factor.setup.subtitle'),
    submitLabel: t('settings.two_factor.confirm.submit'),
    submittingLabel: t('settings.two_factor.confirm.submitting'),
  };
}

import { useTranslation } from 'react-i18next';

import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { RegenerateFormProps } from '../types/components/two-factor-settings';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useTwoFactorBanner from './use-two-factor-banner';

const NO_VALUES = {};

export default function useRegenerateFormProps({
  view,
  callbacks,
}: TwoFactorSettingsProps): RegenerateFormProps {
  const { t } = useTranslation();
  const banner = useTwoFactorBanner(view.banner, callbacks.retry);
  const titleRef = useFocusOnMount<HTMLElement>();

  return {
    onSubmit: callbacks.regenerate,
    defaultValues: NO_VALUES,
    error: banner.error,
    errorAction: banner.action,
    title: t('settings.two_factor.regenerate.title'),
    titleRef,
    subtitle: t('settings.two_factor.regenerate.description'),
    submitLabel: t('settings.two_factor.regenerate.submit'),
    submittingLabel: t('settings.two_factor.regenerate.submitting'),
  };
}

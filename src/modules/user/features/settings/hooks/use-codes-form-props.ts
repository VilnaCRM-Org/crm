import { useTranslation } from 'react-i18next';

import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { CodesFormProps } from '../types/components/two-factor-settings';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

const NO_VALUES = {};

export default function useCodesFormProps(
  { callbacks }: TwoFactorSettingsProps,
  saved: boolean
): CodesFormProps {
  const { t } = useTranslation();
  const titleRef = useFocusOnMount<HTMLElement>();

  return {
    onSubmit: callbacks.done,
    defaultValues: NO_VALUES,
    title: t('settings.two_factor.codes.title'),
    titleRef,
    subtitle: t('settings.two_factor.codes.subtitle'),
    submitLabel: t('settings.two_factor.codes.done'),
    submittingLabel: t('settings.two_factor.codes.submitting'),
    submitBlockedReason: saved ? undefined : t('settings.two_factor.codes.blocked'),
  };
}

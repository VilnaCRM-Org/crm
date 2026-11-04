import { useTranslation } from 'react-i18next';

import type { RegenerateFormProps } from '../types/components/two-factor-settings';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useConfirmationShell from './use-confirmation-shell';

const NO_VALUES = {};

export default function useRegenerateFormProps(props: TwoFactorSettingsProps): RegenerateFormProps {
  const { t } = useTranslation();
  const shell = useConfirmationShell(props);

  return {
    ...shell,
    onSubmit: props.callbacks.regenerate,
    defaultValues: NO_VALUES,
    title: t('settings.two_factor.regenerate.title'),
    subtitle: t('settings.two_factor.regenerate.description'),
    submitLabel: t('settings.two_factor.regenerate.submit'),
    submittingLabel: t('settings.two_factor.regenerate.submitting'),
  };
}

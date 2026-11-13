import { useTranslation } from 'react-i18next';

import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import type { ConfirmationFormProps } from '../types/components/two-factor-settings';
import type { ConfirmationCopy } from '../types/hooks/confirmation-copy';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useConfirmationShell from './use-confirmation-shell';

const DEFAULT_VALUES = { twoFactorCode: '' };

export default function useCodeFormProps(
  props: TwoFactorSettingsProps,
  onSubmit: ConfirmationFormProps<TwoFactorDto>['onSubmit'],
  copy: ConfirmationCopy
): ConfirmationFormProps<TwoFactorDto> {
  const { t } = useTranslation();
  const shell = useConfirmationShell(props);

  return {
    ...shell,
    onSubmit,
    defaultValues: DEFAULT_VALUES,
    title: t(copy.title),
    subtitle: t(copy.subtitle),
    submitLabel: t(copy.submit),
    submittingLabel: t(copy.submitting),
  };
}

import type { SetupFormProps } from '../types/components/two-factor-settings';
import type { ConfirmationCopy } from '../types/hooks/confirmation-copy';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useCodeFormProps from './use-code-form-props';

const COPY: ConfirmationCopy = {
  title: 'settings.two_factor.setup.title',
  subtitle: 'settings.two_factor.setup.subtitle',
  submit: 'settings.two_factor.confirm.submit',
  submitting: 'settings.two_factor.confirm.submitting',
};

export default function useSetupFormProps(props: TwoFactorSettingsProps): SetupFormProps {
  return useCodeFormProps(props, props.callbacks.confirm, COPY);
}

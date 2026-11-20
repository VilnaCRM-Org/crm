import type { DisableFormProps } from '../types/components/two-factor-settings';
import type { ConfirmationCopy } from '../types/hooks/confirmation-copy';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useCodeFormProps from './use-code-form-props';

const COPY: ConfirmationCopy = {
  title: 'settings.two_factor.disable.title',
  subtitle: 'settings.two_factor.disable.description',
  submit: 'settings.two_factor.disable.submit',
  submitting: 'settings.two_factor.disable.submitting',
};

export default function useDisableFormProps(props: TwoFactorSettingsProps): DisableFormProps {
  return useCodeFormProps(props, props.callbacks.disable, COPY);
}

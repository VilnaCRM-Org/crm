import type { TFunction } from 'i18next';

import type { RegistrationView } from '@auth/components/form-section/types';
import type formValidators from '@auth/components/form-section/validations';
import type useRegistrationForm from '@auth/hooks/use-registration-form';

export interface RegistrationFormProps {
  onViewChange?: (view: RegistrationView) => void;
}

export type RegistrationFormState = ReturnType<typeof useRegistrationForm>;
export type Validators = ReturnType<typeof formValidators.create>;

export interface RegistrationNotificationPanelProps {
  form: RegistrationFormState;
  t: TFunction;
}

export interface RegistrationFormPanelProps extends RegistrationNotificationPanelProps {
  validators: Validators;
}

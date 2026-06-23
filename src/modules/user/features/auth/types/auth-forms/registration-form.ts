import type { RegistrationView } from '@auth/components/form-section/types';
import type formValidators from '@auth/components/form-section/validations';
import type useRegistrationForm from '@auth/hooks/use-registration-form';

export type RegistrationFormProps = {
  onViewChange?: (view: RegistrationView) => void;
};

export type RegistrationFormState = ReturnType<typeof useRegistrationForm>;
export type Validators = ReturnType<typeof formValidators.create>;

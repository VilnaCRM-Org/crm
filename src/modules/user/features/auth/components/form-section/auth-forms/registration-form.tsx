import UIForm from '@/components/ui-form';
import { ApolloError } from '@apollo/client';
import { useTranslation } from 'react-i18next';

import { useCreateUser, buildCreateUserInput } from '@/modules/user/features/auth/hooks';
import { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';
import getSubmitLabelKey from '@/modules/user/features/auth/utils/get-submit-label-key';
import normalizeRegistrationData from '@/modules/user/features/auth/utils/normalize-registration-data';

import FormField from '../components/form-field';
import PasswordField from '../components/password-field';
import { createValidators } from '../validations';

function getErrorMessage(error: ApolloError | undefined, t: (key: string) => string): string | null {
  if (!error) return null;

  const graphQLError = error.graphQLErrors[0];
  if (graphQLError?.extensions?.code === 'CONFLICT') {
    return t('sign_up.errors.email_used');
  }

  return t('sign_up.errors.signup_error');
}

export default function RegistrationForm(): JSX.Element {
  const { t } = useTranslation();
  const [createUser, { loading: isSubmitting, error, reset }] = useCreateUser();

  const errorMessage = getErrorMessage(error, t);

  const handleRegister = async (data: RegisterUserDto): Promise<void> => {
    const normalizedData = normalizeRegistrationData(data);
    const input = buildCreateUserInput(normalizedData);

    try {
      await createUser({ variables: { input } });
      reset();
    } catch {
      // Error is handled by Apollo's error state
    }
  };

  const validators = createValidators(t);

  return (
    <UIForm<RegisterUserDto>
      onSubmit={handleRegister}
      defaultValues={{ fullName: '', email: '', password: '' }}
      error={errorMessage}
      isSubmitting={isSubmitting}
      resetOnSuccess
      submitLabel={t(getSubmitLabelKey('sign_up', isSubmitting))}
      title={t('sign_up.title')}
      subtitle={t('sign_up.subtitle')}
    >
      <FormField<RegisterUserDto>
        name="fullName"
        label={t('sign_up.form.name_input.label')}
        placeholder={t('sign_up.form.name_input.placeholder')}
        type="text"
        autoComplete="off"
        rules={{ required: t('sign_up.form.name_input.required'), validate: validators.fullName }}
      />
      <FormField<RegisterUserDto>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="off"
        rules={{ required: t('sign_up.form.email_input.required'), validate: validators.email }}
      />
      <PasswordField<RegisterUserDto>
        label={t('sign_up.form.password_input.label')}
        placeholder={t('sign_up.form.password_input.placeholder')}
        autoComplete="new-password"
        rules={{ required: t('sign_up.form.password_input.required'), validate: validators.password }}
      />
    </UIForm>
  );
}

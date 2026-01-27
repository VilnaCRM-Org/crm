import UIForm from '@/components/UIForm';
import { ApolloError } from '@apollo/client';
import { useTranslation } from 'react-i18next';

import { useCreateUser, buildCreateUserInput } from '@/modules/User/features/Auth/api/hooks';
import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';
import normalizeRegistrationData from '@/modules/User/features/Auth/utils/normalizeRegistrationData';

import FormField from '../components/FormField';
import PasswordField from '../components/PasswordField';
import { createValidators } from '../Validations';

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
      />
    </UIForm>
  );
}

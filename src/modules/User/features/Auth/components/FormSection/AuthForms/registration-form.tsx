import UIForm from '@/components/UIForm';
import { Box } from '@mui/material';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';


import FormField from '@/modules/User/features/Auth/components/FormSection/components/FormField';
import PasswordField from '@/modules/User/features/Auth/components/FormSection/components/PasswordField';
import { RegistrationView } from '@/modules/User/features/Auth/components/FormSection/types';
import { createValidators } from '@/modules/User/features/Auth/components/FormSection/Validations';
import useRegistrationForm from '@/modules/User/features/Auth/hooks/use-registration-form';
import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';
import loadRegistrationNotification from '@/modules/User/features/Auth/utils/load-registration-notification';

type RegistrationFormProps = {
  onViewChange?: (view: RegistrationView) => void;
};

const RegistrationNotification = lazy(loadRegistrationNotification);

export default function RegistrationForm({ onViewChange }: RegistrationFormProps): JSX.Element {
  const { t } = useTranslation();
  const {
    view,
    errorText,
    formKey,
    isSubmitting,
    handleRegister,
    handleSuccessShown,
    handleBackToForm,
    handleRetry,
  } = useRegistrationForm(onViewChange);

  const validators = createValidators(t);

  return (
    <>
      <Box
        key={formKey}
        ref={(el: HTMLDivElement | null) => {
          if (el) {
            if (view !== 'form') el.setAttribute('inert', '');
            else el.removeAttribute('inert');
          }
        }}
      >
        <UIForm<RegisterUserDto>
          onSubmit={handleRegister}
          defaultValues={{ fullName: '', email: '', password: '' }}
          error={null}
          isSubmitting={isSubmitting}
          isSubmitDisabled={view !== 'form'}
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
            placeholder={t('sign_up.form.password_input.placeholder')}
            label={t('sign_up.form.password_input.label')}
            autoComplete="off"
          />
        </UIForm>
      </Box>

      {view !== 'form' ? (
        <Suspense fallback={null}>
          <RegistrationNotification
            view={view}
            errorText={errorText}
            isSubmitting={isSubmitting}
            onShown={handleSuccessShown}
            onBack={handleBackToForm}
            onRetry={handleRetry}
          />
        </Suspense>
      ) : null}
    </>
  );
}

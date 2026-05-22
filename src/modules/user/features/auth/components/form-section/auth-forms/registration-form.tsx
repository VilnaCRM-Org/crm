import { Box } from '@mui/material';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import FormField from '@auth/components/form-section/components/form-field';
import PasswordField from '@auth/components/form-section/components/password-field';
import { RegistrationView } from '@auth/components/form-section/types';
import { createValidators } from '@auth/components/form-section/validations';
import useRegistrationForm from '@auth/hooks/use-registration-form';
import { RegisterUserDto } from '@auth/types/credentials';
import getSubmitLabelKey from '@auth/utils/get-submit-label-key';
import loadRegistrationNotification from '@auth/utils/load-registration-notification';

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
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (boxRef.current) {
      if (view !== 'form') boxRef.current.setAttribute('inert', '');
      else boxRef.current.removeAttribute('inert');
    }
  }, [view]);

  return (
    <>
      <Box key={formKey} ref={boxRef}>
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
            rules={{
              required: t('sign_up.form.name_input.required'),
              validate: validators.fullName,
            }}
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

import UIForm from '@/components/ui-form';
import { Box } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCreateUser, buildCreateUserInput } from '../../../hooks';
import { RegisterUserDto } from '../../../types/credentials';
import getSubmitLabelKey from '../../../utils/get-submit-label-key';
import normalizeRegistrationData from '../../../utils/normalize-registration-data';
import FormField from '../components/form-field';
import PasswordField from '../components/password-field';
import type { RegistrationView } from '../types';
import { createValidators } from '../validations';

import getRegistrationErrorMessage from './registration-error';
import RegistrationNotification from './registration-notification';

type RegistrationFormProps = {
  onViewChange?: (view: RegistrationView) => void;
};

function EmailErrorSync({ emailError }: { emailError: string | null }): null {
  const { setError, clearErrors, getFieldState } = useFormContext<RegisterUserDto>();

  useEffect(() => {
    if (emailError) {
      setError('email', { type: 'server', message: emailError });
      return;
    }

    const currentError = getFieldState('email').error;
    if (currentError?.type === 'server') {
      clearErrors('email');
    }
  }, [emailError, setError, clearErrors, getFieldState]);

  return null;
}

export default function RegistrationForm({ onViewChange }: RegistrationFormProps): JSX.Element {
  const { t } = useTranslation();
  const [createUser, { loading: isSubmitting, error, reset }] = useCreateUser();
  const lastSubmittedDataRef = useRef<RegisterUserDto | null>(null);
  const [view, setView] = useState<RegistrationView>('form');
  const [notificationErrorText, setNotificationErrorText] = useState<string>('');
  const [formKey, setFormKey] = useState(0);

  const { formError, emailError } = getRegistrationErrorMessage(error, t);

  useEffect(() => {
    onViewChange?.(view);
  }, [onViewChange, view]);

  useEffect(() => {
    if (emailError) {
      setView('form');
      setNotificationErrorText('');
    }
  }, [emailError]);

  useEffect(() => {
    if (!formError) return;
    setNotificationErrorText(formError);
    setView('error');
  }, [formError]);

  const handleRegister = useCallback(
    async (data: RegisterUserDto): Promise<boolean> => {
      lastSubmittedDataRef.current = data;
      const normalizedData = normalizeRegistrationData(data);
      const input = buildCreateUserInput(normalizedData);

      try {
        await createUser({ variables: { input } });
        reset();
        setNotificationErrorText('');
        setView('success');
        return true;
      } catch {
        return false;
      }
    },
    [createUser, reset]
  );

  const handleBackToForm = useCallback(() => {
    if (view === 'success') {
      setFormKey((prev) => prev + 1);
    }
    setView('form');
    setNotificationErrorText('');
    lastSubmittedDataRef.current = null;
    reset();
  }, [reset, view]);

  const handleRetry = useCallback(async () => {
    if (!lastSubmittedDataRef.current) return;
    reset();
    await handleRegister(lastSubmittedDataRef.current);
  }, [handleRegister, reset]);

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
          resetOnSuccess
          submitLabel={t(getSubmitLabelKey('sign_up', isSubmitting))}
          title={t('sign_up.title')}
          subtitle={t('sign_up.subtitle')}
        >
          <EmailErrorSync emailError={emailError} />
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
            label={t('sign_up.form.password_input.label')}
            placeholder={t('sign_up.form.password_input.placeholder')}
            autoComplete="new-password"
            rules={{
              required: t('sign_up.form.password_input.required'),
              validate: validators.password,
            }}
          />
        </UIForm>
      </Box>

      {view !== 'form' && (
        <RegistrationNotification
          view={view}
          errorText={notificationErrorText}
          isSubmitting={isSubmitting}
          onBack={handleBackToForm}
          onRetry={handleRetry}
        />
      )}
    </>
  );
}

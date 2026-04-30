import UIForm from '@/components/UIForm';
import type { TFunction } from 'i18next';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import InertBox from '@/modules/User/features/Auth/components/form-section/inert-box';
import type { RegistrationView } from '@/modules/User/features/Auth/components/form-section/types';
import { createValidators } from '@/modules/User/features/Auth/components/form-section/validations';
import useRegistrationForm from '@/modules/User/features/Auth/hooks/use-registration-form';
import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';
import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';
import loadRegistrationNotification from '@/modules/User/features/Auth/utils/load-registration-notification';

import RegistrationFormFields from './registration-form-fields';

type RegistrationFormProps = {
  onViewChange?: (view: RegistrationView) => void;
};

const RegistrationNotification = lazy(loadRegistrationNotification);

const DEFAULT_VALUES: RegisterUserDto = { fullName: '', email: '', password: '' };

type RegistrationFormState = ReturnType<typeof useRegistrationForm>;
type Validators = ReturnType<typeof createValidators>;

function RegistrationFormPanel({
  form,
  t,
  validators,
}: {
  form: RegistrationFormState;
  t: TFunction;
  validators: Validators;
}): JSX.Element {
  return (
    <InertBox id={`reg-form-${form.formKey}`} inert={form.view !== 'form'}>
      <UIForm<RegisterUserDto>
        onSubmit={form.handleRegister}
        defaultValues={DEFAULT_VALUES}
        error={null}
        isSubmitting={form.isSubmitting}
        isSubmitDisabled={form.view !== 'form'}
        submitLabel={t(getSubmitLabelKey('sign_up', form.isSubmitting))}
        title={t('sign_up.title')}
        subtitle={t('sign_up.subtitle')}
      >
        <RegistrationFormFields t={t} validators={validators} />
      </UIForm>
    </InertBox>
  );
}

function RegistrationNotificationPanel({
  form,
}: {
  form: RegistrationFormState;
}): JSX.Element | null {
  if (form.view === 'form') return null;
  return (
    <Suspense fallback={null}>
      <RegistrationNotification
        view={form.view}
        errorText={form.errorText}
        isSubmitting={form.isSubmitting}
        onShown={form.handleSuccessShown}
        onBack={form.handleBackToForm}
        onRetry={form.handleRetry}
      />
    </Suspense>
  );
}

export default function RegistrationForm({ onViewChange }: RegistrationFormProps): JSX.Element {
  const { t } = useTranslation();
  const form = useRegistrationForm(onViewChange);
  const validators = createValidators(t);

  return (
    <>
      <RegistrationFormPanel form={form} t={t} validators={validators} />
      <RegistrationNotificationPanel form={form} />
    </>
  );
}

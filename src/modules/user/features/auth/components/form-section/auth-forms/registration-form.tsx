import type { TFunction } from 'i18next';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import InertBox from '@auth/components/form-section/inert-box';
import type { RegistrationView } from '@auth/components/form-section/types';
import formValidators from '@auth/components/form-section/validations';
import useRegistrationForm from '@auth/hooks/use-registration-form';
import { RegisterUserDto } from '@auth/types/credentials';
import submitLabelKey from '@auth/utils/get-submit-label-key';
import registrationNotificationLoader from '@auth/utils/load-registration-notification';

import RegistrationFormFields from './registration-form-fields';

type RegistrationFormProps = {
  onViewChange?: (view: RegistrationView) => void;
};

const RegistrationNotification = lazy(() => registrationNotificationLoader.load());

const DEFAULT_VALUES: RegisterUserDto = { fullName: '', email: '', password: '' };

type RegistrationFormState = ReturnType<typeof useRegistrationForm>;
type Validators = ReturnType<typeof formValidators.create>;

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
    <InertBox key={form.formKey} id={`reg-form-${form.formKey}`} inert={form.view !== 'form'}>
      <UIForm<RegisterUserDto>
        onSubmit={form.handleRegister}
        defaultValues={DEFAULT_VALUES}
        error={null}
        isSubmitting={form.isSubmitting}
        isSubmitDisabled={form.view !== 'form'}
        submitLabel={t(submitLabelKey.resolve('sign_up', form.isSubmitting))}
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
  const validators = formValidators.create(t);

  return (
    <>
      <RegistrationFormPanel form={form} t={t} validators={validators} />
      <RegistrationNotificationPanel form={form} />
    </>
  );
}

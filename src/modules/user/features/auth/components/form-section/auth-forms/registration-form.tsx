import { type JSX, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import RouteFallback from '@/components/route-fallback';
import UIForm from '@/components/ui-form';
import formValidators from '@/modules/user/lib/validations';
import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import InertBox from '@auth/components/form-section/inert-box';
import useRegistrationForm from '@auth/hooks/use-registration-form';
import type {
  RegistrationFormPanelProps,
  RegistrationFormProps,
  RegistrationNotificationPanelProps,
} from '@auth/types/auth-forms/registration-form';
import registrationNotificationLoader from '@auth/utils/load-registration-notification';

import RegistrationFormFields from './registration-form-fields';

const RegistrationNotification = lazy(() => registrationNotificationLoader.load());

const DEFAULT_VALUES: SignUpDto = { fullName: '', email: '', password: '' };

function RegistrationFormPanel({ form, t, validators }: RegistrationFormPanelProps): JSX.Element {
  return (
    <InertBox key={form.formKey} id={`reg-form-${form.formKey}`} inert={form.view !== 'form'}>
      <UIForm<SignUpDto>
        onSubmit={form.handleRegister}
        defaultValues={DEFAULT_VALUES}
        error={null}
        isSubmitting={form.showSubmitLoader}
        submittingAnnouncement={form.isSubmitting}
        isSubmitDisabled={form.view !== 'form'}
        submitLabel={t('sign_up.form.submit_button')}
        submittingLabel={t('sign_up.form.submitting')}
        title={t('sign_up.title')}
        titleComponent="h1"
        subtitle={t('sign_up.subtitle')}
      >
        <RegistrationFormFields t={t} validators={validators} />
      </UIForm>
    </InertBox>
  );
}

function RegistrationNotificationPanel({
  form,
  t,
}: RegistrationNotificationPanelProps): JSX.Element | null {
  if (form.view === 'form') return null;
  return (
    <Suspense
      fallback={<RouteFallback minHeight="auto" message={t('sign_up.form.loading_result')} />}
    >
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
      <RegistrationNotificationPanel form={form} t={t} />
    </>
  );
}

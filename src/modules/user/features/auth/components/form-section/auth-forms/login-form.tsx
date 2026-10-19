import { type JSX, lazy, Suspense, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RouteFallback from '@/components/route-fallback';
import UIForm from '@/components/ui-form';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import InertBox from '@auth/components/form-section/inert-box';
import formValidators from '@auth/components/form-section/validations';
import type {
  FocusEmailOnReturnProps,
  LoginFormPanelProps,
  LoginFormProps,
  LoginNotificationPanelProps,
} from '@auth/types/auth-forms/login-form';
import registrationNotificationLoader from '@auth/utils/load-registration-notification';

import LoginFormFields from './login-form-fields';
import useLoginSubmitter from './use-login-submitter';
import useLoginView from './use-login-view';

const RegistrationNotification = lazy(() => registrationNotificationLoader.load());

const LOGIN_DEFAULTS: SignInDto = { email: '', password: '' };

function FocusEmailOnReturn({ returnCount }: FocusEmailOnReturnProps): null {
  const { setFocus } = useFormContext<SignInDto>();

  useEffect(() => {
    if (returnCount > 0) setFocus('email');
  }, [returnCount, setFocus]);

  return null;
}

function LoginFormPanel({ notice, submitter, viewState, t }: LoginFormPanelProps): JSX.Element {
  const onSubmit = (data: SignInDto): Promise<void> => {
    void registrationNotificationLoader.load();
    return submitter.handleLogin(data);
  };

  return (
    <InertBox id="login-form" inert={viewState.view !== 'form'}>
      <UIForm<SignInDto>
        onSubmit={onSubmit}
        defaultValues={LOGIN_DEFAULTS}
        error={null}
        isSubmitting={submitter.isSubmitting}
        isSubmitDisabled={viewState.view !== 'form'}
        submitLabel={t('sign_in.form.submit_button')}
        submittingLabel={t('sign_in.form.submitting')}
        title={t('sign_in.title')}
        titleComponent="h1"
        subtitle={t('sign_in.subtitle')}
        notice={notice}
      >
        <LoginFormFields t={t} validators={formValidators.create(t)} />
        <FocusEmailOnReturn returnCount={viewState.returnCount} />
      </UIForm>
    </InertBox>
  );
}

function LoginNotificationPanel({
  submitter,
  viewState,
  postLogin,
  t,
}: LoginNotificationPanelProps): JSX.Element | null {
  const { view } = viewState;
  if (view === 'form') return null;
  const backToForm = (): void => {
    submitter.handleBack();
    viewState.back();
  };

  return (
    <Suspense
      fallback={<RouteFallback minHeight="auto" message={t('sign_in.form.loading_result')} />}
    >
      <RegistrationNotification
        flow="signIn"
        view={view}
        errorText={submitter.error}
        isSubmitting={submitter.isSubmitting}
        onBack={view === 'success' ? postLogin.proceed : backToForm}
        onRetry={submitter.handleRetry}
      />
    </Suspense>
  );
}

export default function LoginForm({
  notice,
  postLogin,
  onViewChange,
}: LoginFormProps): JSX.Element {
  const { t } = useTranslation();
  const submitter = useLoginSubmitter(t);
  const viewState = useLoginView({
    error: submitter.error,
    isSubmitting: submitter.isSubmitting,
    signedIn: postLogin.signedIn,
  });

  useEffect(() => {
    onViewChange?.(viewState.view);
  }, [onViewChange, viewState.view]);

  return (
    <>
      <LoginFormPanel notice={notice} submitter={submitter} viewState={viewState} t={t} />
      <LoginNotificationPanel
        submitter={submitter}
        viewState={viewState}
        postLogin={postLogin}
        t={t}
      />
    </>
  );
}

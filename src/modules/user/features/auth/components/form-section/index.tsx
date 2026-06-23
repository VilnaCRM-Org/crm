import { Box } from '@mui/material';
import type { TFunction } from 'i18next';
import { lazy, Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import UITypography from '@/components/ui-typography';
import loginFormLoader from '@auth/utils/load-login-form';

import RegistrationForm from './auth-forms/registration-form';
import AuthProviderButtons from './components/auth-provider-buttons';
import type { FormSectionLayoutProps } from './index.types';
import InertBox from './inert-box';
import styles from './styles';
import type { RegistrationView, AuthMode } from './types';
import useLoginSwitcher, { type LoadLoginErrorKey } from './use-login-switcher';

const LoginForm = lazy(() => loginFormLoader.load());

function getSwitcherLabelKey(mode: AuthMode): string {
  return mode === 'login'
    ? 'sign_up.form.switcher_text_no_account'
    : 'sign_up.form.switcher_text_have_account';
}

function AuthBody({
  mode,
  onViewChange,
}: {
  mode: AuthMode;
  onViewChange: (v: RegistrationView) => void;
}): JSX.Element {
  if (mode === 'login') {
    return (
      <Suspense fallback={<Box aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
    );
  }
  return <RegistrationForm onViewChange={onViewChange} />;
}

function SwitcherButton({
  label,
  disabled,
  onClick,
  onIntent,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  onIntent: () => void;
}): JSX.Element {
  return (
    <UIButton
      sx={styles.formSwitcherButton}
      onClick={onClick}
      onMouseEnter={onIntent}
      onFocus={onIntent}
      onTouchStart={onIntent}
      disabled={disabled}
    >
      {label}
    </UIButton>
  );
}

function SwitcherError({
  loadLoginError,
  t,
}: {
  loadLoginError: LoadLoginErrorKey;
  t: (key: string) => string;
}): JSX.Element | null {
  if (!loadLoginError) return null;
  return (
    <UITypography role="alert" sx={styles.formSwitcherError}>
      {t(loadLoginError)}
    </UITypography>
  );
}

function FormSwitcher({
  mode,
  isLoadingLogin,
  loadLoginError,
  onSwitch,
  onIntent,
  t,
}: {
  mode: AuthMode;
  isLoadingLogin: boolean;
  loadLoginError: LoadLoginErrorKey;
  onSwitch: () => void;
  onIntent: () => void;
  t: TFunction;
}): JSX.Element {
  return (
    <>
      <SwitcherError loadLoginError={loadLoginError} t={t} />
      <SwitcherButton
        label={t(getSwitcherLabelKey(mode))}
        disabled={isLoadingLogin}
        onClick={onSwitch}
        onIntent={onIntent}
      />
    </>
  );
}

function FormSectionLayout({
  mode,
  registrationView,
  onRegistrationViewChange,
  isLoadingLogin,
  loadLoginError,
  onSwitch,
  onIntent,
  t,
}: FormSectionLayoutProps): JSX.Element {
  const showNotification = mode === 'register' && registrationView !== 'form';

  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={styles.formWrapper}>
        <AuthBody mode={mode} onViewChange={onRegistrationViewChange} />
        <InertBox id="auth-provider-buttons-container" inert={showNotification}>
          <AuthProviderButtons />
        </InertBox>
      </Box>
      <FormSwitcher
        mode={mode}
        isLoadingLogin={isLoadingLogin}
        loadLoginError={loadLoginError}
        onSwitch={onSwitch}
        onIntent={onIntent}
        t={t}
      />
    </Box>
  );
}

function useFormSectionViewModel(): FormSectionLayoutProps {
  const [registrationView, setRegistrationView] = useState<RegistrationView>('form');
  const { mode, isLoadingLogin, loadLoginError, handleSwitcherIntent, handleSwitch } =
    useLoginSwitcher();
  const { t } = useTranslation();
  const onRegistrationViewChange = useCallback((view: RegistrationView) => {
    setRegistrationView(view);
  }, []);

  const onSwitch = useCallback(() => {
    setRegistrationView('form');
    handleSwitch();
  }, [handleSwitch]);

  return {
    mode,
    registrationView,
    onRegistrationViewChange,
    isLoadingLogin,
    loadLoginError,
    onSwitch,
    onIntent: handleSwitcherIntent,
    t,
  };
}

export default function FormSection(): JSX.Element {
  const {
    mode,
    registrationView,
    onRegistrationViewChange,
    isLoadingLogin,
    loadLoginError,
    onSwitch,
    onIntent,
    t,
  } = useFormSectionViewModel();

  return (
    <FormSectionLayout
      mode={mode}
      registrationView={registrationView}
      onRegistrationViewChange={onRegistrationViewChange}
      isLoadingLogin={isLoadingLogin}
      loadLoginError={loadLoginError}
      onSwitch={onSwitch}
      onIntent={onIntent}
      t={t}
    />
  );
}

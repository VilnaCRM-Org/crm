import UIButton from '@/components/UIButton';
import UITypography from '@/components/UITypography';
import { Box } from '@mui/material';
import type { TFunction } from 'i18next';
import { lazy, Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RegistrationForm from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-form';
import AuthProviderButtons from '@/modules/User/features/Auth/components/form-section/components/auth-provider-buttons';
import styles from '@/modules/User/features/Auth/components/form-section/styles';
import { RegistrationView } from '@/modules/User/features/Auth/components/form-section/types';
import loadLoginForm from '@/modules/User/features/Auth/utils/load-login-form';

import InertBox from './inert-box';
import type { AuthMode } from './types';
import useLoginSwitcher, { type LoadLoginErrorKey } from './use-login-switcher';

const LoginForm = lazy(loadLoginForm);

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
      data-testid="signup-switcher"
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

export default function FormSection(): JSX.Element {
  const [registrationView, setRegistrationView] = useState<RegistrationView>('form');
  const { mode, isLoadingLogin, loadLoginError, handleSwitcherIntent, handleSwitch } =
    useLoginSwitcher();
  const { t } = useTranslation();

  const onSwitch = useCallback(() => {
    setRegistrationView('form');
    handleSwitch();
  }, [handleSwitch]);

  const showNotification = mode === 'register' && registrationView !== 'form';

  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={styles.formWrapper}>
        <AuthBody mode={mode} onViewChange={setRegistrationView} />
        <InertBox id="auth-provider-buttons-container" inert={showNotification}>
          <AuthProviderButtons />
        </InertBox>
      </Box>
      <FormSwitcher
        mode={mode}
        isLoadingLogin={isLoadingLogin}
        loadLoginError={loadLoginError}
        onSwitch={onSwitch}
        onIntent={handleSwitcherIntent}
        t={t}
      />
    </Box>
  );
}

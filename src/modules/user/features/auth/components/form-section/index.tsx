import UIButton from '@/components/ui-button';
import { Box } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoginForm, RegistrationForm } from './auth-forms';
import AuthProviderButtons from './components/auth-provider-buttons';
import styles from './styles';
import { AuthMode, RegistrationView } from './types';

export default function FormSection(): JSX.Element {
  const [mode, setMode] = useState<AuthMode>('register');
  const [registrationView, setRegistrationView] = useState<RegistrationView>('form');
  const [formHeight, setFormHeight] = useState<number | null>(null);
  const formWrapperRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();

  const handleSwitch = useCallback(() => {
    setRegistrationView('form');
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  }, []);

  const handleRegistrationViewChange = useCallback((view: RegistrationView) => {
    setRegistrationView(view);
  }, []);

  useEffect(() => {
    if (mode !== 'register' || registrationView !== 'form') return undefined;

    const wrapper = formWrapperRef.current;
    if (!wrapper) return undefined;

    const updateFormHeight = (): void => {
      const nextHeight = wrapper.getBoundingClientRect().height;
      if (!nextHeight) return;
      setFormHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateFormHeight();

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(updateFormHeight);
    observer.observe(wrapper);

    return (): void => {
      observer.disconnect();
    };
  }, [mode, registrationView]);

  const showRegistrationReplacement = mode === 'register' && registrationView !== 'form';

  return (
    <Box component="section" sx={styles.formSection}>
      <Box
        ref={formWrapperRef}
        sx={[
          styles.formWrapper,
          showRegistrationReplacement ? styles.formWrapperWithNotification : {},
          showRegistrationReplacement && formHeight
            ? {
                ...(formHeight <= window.innerHeight && {
                  '&&': {
                    '@media (max-width: 374px)': {
                      height: `${formHeight}px`,
                      minHeight: `${formHeight}px`,
                    },
                  },
                }),
                height: `${formHeight}px`,
                minHeight: `${formHeight}px`,
              }
            : {},
        ]}
      >
        {mode === 'login' ? (
          <LoginForm />
        ) : (
          <RegistrationForm onViewChange={handleRegistrationViewChange} />
        )}

        <Box
          ref={(el: HTMLDivElement | null) => {
            if (el) {
              if (showRegistrationReplacement) el.setAttribute('inert', '');
              else el.removeAttribute('inert');
            }
          }}
        >
          <AuthProviderButtons />
        </Box>
      </Box>

      <UIButton
        sx={[
          styles.formSwitcherButton,
          showRegistrationReplacement ? styles.hiddenElement : {},
        ]}
        onClick={handleSwitch}
      >
        {mode === 'login'
          ? t('sign_up.form.switcher_text_no_account')
          : t('sign_up.form.switcher_text_have_account')}
      </UIButton>
    </Box>
  );
}

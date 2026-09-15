import styled from '@emotion/styled';
import { Box } from '@mui/material';
import type { TFunction } from 'i18next';
import type { JSX, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import errorFallbackStyles from '@/components/error-boundary/styles';
import UITypography from '@/components/ui-typography';
import type { RecoveryStrategy } from '@/lib/reliability/types/recoverable-error';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import type { AuthErrorFallbackProps } from '@auth/types/auth-error-boundary';

const DEFAULT_FALLBACK_KEY = 'auth.error.default';

const focusWrapperStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexGrow: 1,
  gap: '1rem',
  padding: '2rem 1rem',
  textAlign: 'center',
  '&:focus:not(:focus-visible)': { outline: 'none' },
} as const;

const RetryButton = styled('button')(errorFallbackStyles.build().button);

const DetailsContainer = styled('details')({
  marginTop: '1rem',
  maxWidth: '36rem',
  textAlign: 'left',
});

const SummaryStyled = styled('summary')({
  cursor: 'pointer',
});

const Message = styled('pre')({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});

const shouldShowErrorDetails = (error: Error | undefined): error is Error =>
  Boolean(error) && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test');

function ErrorDetails({ error }: { error: Error }): JSX.Element {
  const { t } = useTranslation();

  return (
    <DetailsContainer>
      <SummaryStyled>{t('auth.error.details')}</SummaryStyled>
      <Message>{error.message}</Message>
    </DetailsContainer>
  );
}

function resolveCustomContent(
  { error, reset, fallback = DEFAULT_FALLBACK_KEY }: AuthErrorFallbackProps,
  t: TFunction
): ReactNode {
  if (typeof fallback === 'function') return fallback({ error, reset });
  return fallback === DEFAULT_FALLBACK_KEY ? t(DEFAULT_FALLBACK_KEY) : fallback;
}

const EXIT_ONLY_STRATEGIES: readonly RecoveryStrategy[] = ['none', 'navigate-home'];

function resolveAlertContent(props: AuthErrorFallbackProps, t: TFunction): ReactNode {
  if (EXIT_ONLY_STRATEGIES.includes(props.recovery.strategy)) {
    return t('auth.error.unrecoverable');
  }
  if (props.recovery.strategy === 'reload') return t('auth.error.reloadRequired');
  return resolveCustomContent(props, t);
}

function RecoveryAction({ recovery, reset, reload }: AuthErrorFallbackProps): JSX.Element | null {
  const { t } = useTranslation();
  if (EXIT_ONLY_STRATEGIES.includes(recovery.strategy)) return null;
  if (recovery.strategy === 'reload') {
    return reload ? (
      <RetryButton type="button" onClick={reload}>
        {t('auth.error.reload')}
      </RetryButton>
    ) : null;
  }
  return (
    <RetryButton type="button" onClick={reset}>
      {t('auth.error.tryAgain')}
    </RetryButton>
  );
}

export default function AuthErrorFallback(props: AuthErrorFallbackProps): JSX.Element {
  const { error, recovery, reset, reload } = props;
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLDivElement>();

  return (
    <Box ref={focusOnMount} tabIndex={-1} sx={focusWrapperStyles}>
      <UITypography component="h1" variant="h4">
        {t('auth.error.title')}
      </UITypography>
      <div role="alert">{resolveAlertContent(props, t)}</div>
      <RecoveryAction recovery={recovery} reset={reset} reload={reload} />
      {shouldShowErrorDetails(error) && <ErrorDetails error={error} />}
    </Box>
  );
}

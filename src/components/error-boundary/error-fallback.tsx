import styled from '@emotion/styled';
import { type JSX, useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { ErrorFallbackProps } from '@/components/types/error-boundary';
import ROUTE_PATHS from '@/routes/route-paths';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import errorFallbackStyles from './styles';

const styles = errorFallbackStyles.build();

const Container = styled('main')(styles.container);
const MessageBlock = styled('div')(styles.messageBlock);
const Heading = styled('h1')(styles.heading);
const Description = styled('p')(styles.description);
const Actions = styled('div')(styles.actions);
const ActionButton = styled('button')(styles.button);
const ActionLink = styled('a')(styles.link);
const Details = styled('details')(styles.details);

function RecoveryButton({
  recovery,
  reset,
  reload,
}: Pick<ErrorFallbackProps, 'recovery' | 'reset' | 'reload'>): JSX.Element | null {
  const { t } = useTranslation();
  const { strategy } = recovery;

  if (strategy === 'retry' || strategy === 'reset') {
    return (
      <ActionButton type="button" onClick={reset}>
        {t('error_boundary.try_again')}
      </ActionButton>
    );
  }
  if (strategy === 'reload' && reload) {
    return (
      <ActionButton type="button" onClick={reload}>
        {t('error_boundary.reload')}
      </ActionButton>
    );
  }
  return null;
}

function RecoveryActions({
  recovery,
  reset,
  reload,
}: Pick<ErrorFallbackProps, 'recovery' | 'reset' | 'reload'>): JSX.Element {
  const { t } = useTranslation();

  return (
    <Actions>
      <RecoveryButton recovery={recovery} reset={reset} reload={reload} />
      <ActionLink href={ROUTE_PATHS.home}>{t('error_boundary.go_home')}</ActionLink>
    </Actions>
  );
}

function ErrorDiagnostics({ error }: { error?: Error }): JSX.Element | null {
  const { t } = useTranslation();

  if (process.env.NODE_ENV === 'production' || error == null) return null;
  return (
    <Details>
      <summary>{t('error_boundary.details')}</summary>
      <pre>{error.message}</pre>
    </Details>
  );
}

export default function ErrorFallback({
  error,
  recovery,
  reset,
  reload,
  landmark = 'main',
}: ErrorFallbackProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLHeadingElement>();
  const headingId = useId();
  const isMain = landmark === 'main';

  return (
    <Container
      as={isMain ? 'main' : 'section'}
      aria-labelledby={isMain ? undefined : headingId}
      lang={i18n.resolvedLanguage ?? 'en'}
    >
      <MessageBlock>
        <Heading id={headingId} ref={focusOnMount} tabIndex={-1}>
          {t('error_boundary.title')}
        </Heading>
        <Description role="alert">{t(recovery.messageKey)}</Description>
      </MessageBlock>
      <RecoveryActions recovery={recovery} reset={reset} reload={reload} />
      <ErrorDiagnostics error={error} />
    </Container>
  );
}

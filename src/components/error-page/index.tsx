import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { ErrorPageProps } from '@/components/types/error-page';
import UIFooter from '@/components/ui-footer';
import usePageTitle from '@/hooks/use-page-title';

import ErrorPageComposition from './error-page-composition';
import ERROR_PAGE_VARIANTS, { ERROR_PAGE_TITLE_ID } from './error-page-variants';
import errorPageStyles from './styles';

const styles = errorPageStyles.build();

export default function ErrorPage({ variant, landmark }: ErrorPageProps): JSX.Element {
  const { i18n } = useTranslation();
  usePageTitle(ERROR_PAGE_VARIANTS[variant].titleKey);
  const region = landmark === 'region';

  return (
    <>
      <Box
        component={region ? 'section' : 'main'}
        aria-labelledby={region ? ERROR_PAGE_TITLE_ID : undefined}
        lang={i18n.resolvedLanguage ?? 'en'}
        sx={styles.landmark}
      >
        <ErrorPageComposition variant={variant} />
      </Box>
      {region ? null : <UIFooter />}
    </>
  );
}

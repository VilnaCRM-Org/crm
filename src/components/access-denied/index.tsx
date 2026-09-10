import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useLinkClickHandler } from 'react-router';

import UIButton from '@/components/ui-button';
import UITypography from '@/components/ui-typography';
import usePageTitle from '@/hooks/use-page-title';
import ROUTE_PATHS from '@/routes/route-paths';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import headingFocusStyles from './styles';

export default function AccessDenied(): JSX.Element {
  usePageTitle('access_denied.title');
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLDivElement>();
  const goHome = useLinkClickHandler<HTMLButtonElement>(ROUTE_PATHS.home);

  // Its own landmark: the panel is a standalone route now (issue #114), so nothing above it
  // supplies one — a public route renders under RootLayout, which owns no <main>.
  return (
    <Box component="main">
      <Box ref={focusOnMount} tabIndex={-1} sx={headingFocusStyles}>
        <UITypography component="h1" variant="h4">
          {t('access_denied.title')}
        </UITypography>
      </Box>
      <UITypography>{t('access_denied.description')}</UITypography>
      <UIButton to={ROUTE_PATHS.home} onClick={goHome}>
        {t('access_denied.cta')}
      </UIButton>
    </Box>
  );
}

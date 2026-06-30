import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import UIBackToMain from '@/components/ui-back-to-main';
import UIButton from '@/components/ui-button';
import UIFooter from '@/components/ui-footer';
import UITypography from '@/components/ui-typography';
import usePageTitle from '@/hooks/use-page-title';
import ROUTE_PATHS from '@/routes/route-paths';

export default function NotFound(): JSX.Element {
  usePageTitle('not_found.title');
  const { t } = useTranslation();
  return (
    <>
      <UIBackToMain />
      <Box component="main">
        <UITypography component="h1" variant="h4">
          {t('not_found.title')}
        </UITypography>
        <UITypography>{t('not_found.description')}</UITypography>
        <UIButton to={ROUTE_PATHS.home}>{t('not_found.cta')}</UIButton>
      </Box>
      <UIFooter />
    </>
  );
}

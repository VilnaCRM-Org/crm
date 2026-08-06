import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { useLinkClickHandler } from 'react-router-dom';

import UIButton from '@/components/ui-button';
import UITypography from '@/components/ui-typography';
import usePageTitle from '@/hooks/use-page-title';
import ROUTE_PATHS from '@/routes/route-paths';
import { paletteColors } from '@/styles/colors';
import useFocusOnMount from '@/utils/use-focus-on-mount';

const headingFocusStyles = {
  outline: 'none',
  '&:focus-visible': {
    outline: `2px solid ${paletteColors.primary.main}`,
    outlineOffset: '2px',
  },
};

export default function AccessDenied(): JSX.Element {
  usePageTitle('access_denied.title');
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLDivElement>();
  const goHome = useLinkClickHandler<HTMLButtonElement>(ROUTE_PATHS.home);

  return (
    <Box>
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

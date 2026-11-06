import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useLinkClickHandler } from 'react-router';

import logoDesktop from '@/assets/icons/shell/logo-desktop.svg';
import logoMobile from '@/assets/icons/shell/logo-mobile.svg';
import type { HeaderLogoProps } from '@/components/types/ui-app-header';
import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';

import styles from './styles';

const FOCUS_ON_ARRIVAL: RedirectNavigationState = { focusMain: true };

export default function HeaderLogo({ layout }: HeaderLogoProps): JSX.Element {
  const handleClick = useLinkClickHandler<HTMLAnchorElement>(ROUTE_PATHS.home, {
    state: FOCUS_ON_ARRIVAL,
  });

  return (
    <Box
      component="a"
      href={ROUTE_PATHS.home}
      aria-label="VilnaCRM"
      onClick={handleClick}
      sx={styles.logoLink[layout]}
    >
      <Box
        component="img"
        src={layout === 'mobile' ? logoMobile : logoDesktop}
        alt=""
        sx={styles.logoImage[layout]}
      />
    </Box>
  );
}

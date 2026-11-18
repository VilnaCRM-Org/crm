import { Box, Divider, ListItem, List, SvgIcon } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import UIButton from '@/components/ui-button';
import UITypography from '@/components/ui-typography';
import type { OAuthProvider } from '@auth/types/auth-provider-buttons/oauth-providers';

import oauthProviders from './oauth-providers';
import styles from './styles';
import Theme from './theme';

function ProviderButton({ label, SvgComponent, onClick }: OAuthProvider): JSX.Element {
  const { t } = useTranslation();

  return (
    <ListItem disablePadding sx={styles.servicesItem}>
      <UIButton
        variant="outlined"
        sx={styles.serviceItemButton}
        onClick={onClick}
        aria-label={t('auth.oauth.continue_with', { provider: label })}
        type="button"
      >
        <SvgIcon component={SvgComponent} inheritViewBox sx={styles.serviceItemButtonIcon} />
      </UIButton>
    </ListItem>
  );
}

export default function AuthProviderButtons(): JSX.Element {
  const { t } = useTranslation();
  const { state } = useLocation();

  return (
    <ThemeProvider theme={Theme}>
      <Box sx={styles.thirdPartyWrapper}>
        <Divider role="presentation">
          <UITypography sx={styles.dividerText}>{t('sign_up.socials_main_heading')}</UITypography>
        </Divider>

        <List sx={styles.servicesList}>
          {oauthProviders.list(state).items.map(({ label, SvgComponent, onClick }) => (
            <ProviderButton
              key={label}
              label={label}
              SvgComponent={SvgComponent}
              onClick={onClick}
            />
          ))}
        </List>
      </Box>
    </ThemeProvider>
  );
}

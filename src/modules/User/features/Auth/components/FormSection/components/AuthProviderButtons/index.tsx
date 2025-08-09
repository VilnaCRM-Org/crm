import UIButton from '@/components/UIButton';
import UiTypography from '@/components/UITypography';
import { Box, Divider, ListItem, List, SvgIcon } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

import oauthProviders from './oauthProviders';
import styles from './styles';
import Theme from './Theme';

export default function AuthProviderButtons(): JSX.Element {
  const { t } = useTranslation();
  return (
    <ThemeProvider theme={Theme}>
      <Box sx={styles.thirdPartyWrapper}>
        <Divider role="presentation">
          <UiTypography sx={styles.dividerText}>{t('sign_up.socials_main_heading')}</UiTypography>
        </Divider>

        <List sx={styles.servicesList}>
          {oauthProviders.map(({ label, SvgComponent, ariaLabel, onClick }) => (
            <ListItem disablePadding key={label} sx={styles.servicesItem}>
              <UIButton
                sx={styles.serviceItemButton}
                onClick={onClick}
                aria-label={ariaLabel}
                type="button"
              >
                <SvgIcon
                  component={SvgComponent}
                  inheritViewBox
                  sx={styles.serviceItemButtonIcon}
                />
              </UIButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </ThemeProvider>
  );
}

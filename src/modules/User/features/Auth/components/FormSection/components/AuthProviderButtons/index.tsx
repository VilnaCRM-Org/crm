import UIButton from '@/components/UIButton';
import { Box, Divider, ListItem, List } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import oauthProviders from './oauthProviders';
import styles from './styles';
import Theme from './Theme';

export default function AuthProviderButtons(): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <Box sx={styles.thirdPartyWrapper}>
        <Divider>Або</Divider>

        <List sx={styles.servicesList}>
          {oauthProviders.map(({ label, component, ariaLabel, onClick }) => (
            <ListItem disablePadding key={label} sx={styles.servicesItem}>
              <UIButton
                variant="outlined"
                sx={styles.serviceItemButton}
                onClick={onClick}
                aria-label={ariaLabel}
                type="button"
              >
                {component}
              </UIButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </ThemeProvider>
  );
}

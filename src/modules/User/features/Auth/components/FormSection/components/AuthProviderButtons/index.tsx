import UIButton from '@/components/UIButton';
import { Box, Divider, ListItem, List } from '@mui/material';

import oauthProviders from './oauthProviders';
import styles from './styles';

export default function AuthProviderButtons(): JSX.Element {
  return (
    <Box sx={styles.thirdPartyWrapper}>
      <Divider sx={styles.divider}>Або</Divider>

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
  );
}

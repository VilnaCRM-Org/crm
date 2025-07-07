import UIButton from '@/components/UIButton';
import { Box, Divider, ListItem, List } from '@mui/material';

import { ReactComponent as Facebook } from '../../../assets/facebookColor.svg';
import { ReactComponent as Github } from '../../../assets/github.svg';
import { ReactComponent as Google } from '../../../assets/GoogleColor.svg';
import { ReactComponent as Twitter } from '../../../assets/twitterColor.svg';

import styles from './styles';

const authServices = [
  { label: 'Google', component: <Google /> },
  { label: 'Facebook', component: <Facebook /> },
  { label: 'Github', component: <Github /> },
  { label: 'Twitter', component: <Twitter /> },
];

export default function ThirdPartyAuth(): JSX.Element {
  return (
    <Box sx={styles.thirdPartyWrapper}>
      <Divider sx={styles.divider}>Або</Divider>

      <List sx={styles.servicesList}>
        {authServices.map(({ label, component }) => (
          <ListItem disablePadding key={label} sx={styles.servicesItem}>
            <UIButton variant="outlined" sx={styles.serviceItemButton}>
              {component}
            </UIButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

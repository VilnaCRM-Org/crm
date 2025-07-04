import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import Form from './Form';
import Styles from './styles';
import Theme from './Theme';
import ThirdPartyAuth from './ThirdPartyAuth';

export default function FormSection(): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <Box component="section" sx={Styles.formSection}>
        <Box sx={Styles.formWrapper}>
          <Form />
          <ThirdPartyAuth />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

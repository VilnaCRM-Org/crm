import { ThemeProvider, Button } from '@mui/material';
import { ButtonProps } from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import type { To } from 'react-router-dom';

import Theme from './Theme';

interface UiButtonProps extends ButtonProps {
  to?: To;
}

function UIButton({ to = '', children, ...rest }: UiButtonProps): React.ReactElement {
  return (
    <ThemeProvider theme={Theme}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Button {...rest} component={to ? RouterLink : 'button'} to={to}>
        {children}
      </Button>
    </ThemeProvider>
  );
}
UIButton.displayName = 'UIButton';
export default UIButton;

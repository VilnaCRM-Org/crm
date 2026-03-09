import { ThemeProvider, Button } from '@mui/material';
import { ButtonProps } from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import type { To } from 'react-router-dom';

import Theme from './theme';

interface UiButtonProps extends ButtonProps {
  to?: To;
}

function UIButton({
  to,
  children,
  type = 'button',
  component,
  disabled,
  variant,
  sx,
  onClick,
  disableRipple,
  'aria-label': ariaLabel,
}: React.PropsWithChildren<UiButtonProps>): React.ReactElement {
  const linkTarget = to || undefined;
  const resolvedComponent = component ?? (linkTarget ? RouterLink : 'button');

  return (
    <ThemeProvider theme={Theme}>
      <Button
        component={resolvedComponent}
        to={linkTarget && resolvedComponent !== 'button' ? linkTarget : undefined}
        type={resolvedComponent === 'button' ? type : undefined}
        disabled={disabled}
        variant={variant}
        sx={sx}
        onClick={onClick}
        disableRipple={disableRipple}
        aria-label={ariaLabel}
      >
        {children}
      </Button>
    </ThemeProvider>
  );
}
UIButton.displayName = 'UIButton';
export default UIButton;

import { ThemeProvider, Button } from '@mui/material';
import { ButtonProps } from '@mui/material/Button';

import Theme from './theme';

type ButtonLinkTarget =
  | string
  | {
      pathname?: string;
      search?: string;
      hash?: string;
    };

interface UiButtonProps extends ButtonProps {
  to?: ButtonLinkTarget;
}

const resolveLinkTarget = (to?: ButtonLinkTarget): string | undefined => {
  if (!to) {
    return undefined;
  }

  if (typeof to === 'string') {
    return to;
  }

  return `${to.pathname ?? ''}${to.search ?? ''}${to.hash ?? ''}` || undefined;
};

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
  const linkTarget = resolveLinkTarget(to);
  const resolvedComponent = component ?? (linkTarget ? 'a' : 'button');

  return (
    <ThemeProvider theme={Theme}>
      <Button
        component={resolvedComponent}
        href={linkTarget && resolvedComponent !== 'button' ? linkTarget : undefined}
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

import { ThemeProvider, Link } from '@mui/material';
import type { LinkProps } from '@mui/material/Link';

import Theme from '@/components/ui-link/theme';

export default function UILink({
  'aria-label': ariaLabel,
  children,
  className,
  color,
  href,
  id,
  onClick,
  rel,
  sx,
  tabIndex,
  target,
  underline,
  variant,
}: LinkProps): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <Link
        aria-label={ariaLabel}
        className={className}
        color={color}
        href={href}
        id={id}
        onClick={onClick}
        rel={rel}
        sx={sx}
        tabIndex={tabIndex}
        target={target}
        underline={underline}
        variant={variant}
      >
        {children}
      </Link>
    </ThemeProvider>
  );
}

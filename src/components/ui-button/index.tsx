import { ThemeProvider, Button } from '@mui/material';
import { ButtonProps } from '@mui/material/Button';
import * as React from 'react';

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

const UIButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  React.PropsWithChildren<UiButtonProps>
>(function UIButton(
  { to, href, children, type = 'button', component, ...rest },
  ref
): React.ReactElement {
  const linkTarget = resolveLinkTarget(to) ?? href;
  const resolvedComponent = component ?? (linkTarget ? 'a' : 'button');
  const buttonProps = {
    ...rest,
    ref,
    component: resolvedComponent,
    href: linkTarget && resolvedComponent !== 'button' ? linkTarget : undefined,
    type: resolvedComponent === 'button' ? type : undefined,
  };

  return (
    <ThemeProvider theme={Theme}>
      {React.createElement(Button, buttonProps, children)}
    </ThemeProvider>
  );
});
UIButton.displayName = 'UIButton';
export default UIButton;

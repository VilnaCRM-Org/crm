import { ThemeProvider, Button } from '@mui/material';
import React from 'react';

import type { ButtonLinkTarget, UiButtonProps } from '@/components/types/ui-button';

import Theme from './theme';

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
  const baseButton = (
    <Button
      ref={ref}
      component={resolvedComponent}
      href={linkTarget && resolvedComponent !== 'button' ? linkTarget : undefined}
      type={resolvedComponent === 'button' ? type : undefined}
    >
      {children}
    </Button>
  );

  return <ThemeProvider theme={Theme}>{React.cloneElement(baseButton, rest)}</ThemeProvider>;
});
UIButton.displayName = 'UIButton';
export default UIButton;

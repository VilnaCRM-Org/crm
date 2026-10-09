import UiLink from '@vilnacrm/ui-toolkit/ui-link';
import React from 'react';

import type { TextLinkProps } from '@/components/types/ui-text-link';

export default function UITextLink({ href, children }: TextLinkProps): React.ReactElement {
  return (
    <UiLink href={href} appearance="text" tone="brand">
      {children}
    </UiLink>
  );
}

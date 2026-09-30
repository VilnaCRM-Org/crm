import UiContainer from '@vilnacrm/ui-toolkit/ui-container';
import React from 'react';

import type { ContainerProps } from '@/components/types/ui-container';

export default function UIContainer({ children }: ContainerProps): React.ReactElement {
  return <UiContainer>{children}</UiContainer>;
}

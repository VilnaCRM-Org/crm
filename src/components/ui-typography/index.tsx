import UiTypography from '@vilnacrm/ui-toolkit/ui-typography';
import React from 'react';

import type { UITypographyProps } from '@/components/ui-typography/types';

function UITypography(props: UITypographyProps): React.ReactElement {
  return React.createElement(UiTypography, { ...props, inheritTheme: true });
}

export default UITypography;

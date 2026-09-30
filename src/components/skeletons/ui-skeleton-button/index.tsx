import UiSkeletonButton from '@vilnacrm/ui-toolkit/ui-skeleton-button';
import React from 'react';

import type { UISkeletonButtonProps } from '@/components/skeletons/ui-skeleton-button/types';

function UISkeletonButton(props: UISkeletonButtonProps): React.ReactElement {
  return React.createElement(UiSkeletonButton, props);
}

export default UISkeletonButton;

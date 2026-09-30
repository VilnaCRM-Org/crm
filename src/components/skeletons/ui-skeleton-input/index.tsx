import UiSkeletonInput from '@vilnacrm/ui-toolkit/ui-skeleton-input';
import React from 'react';

import type { UISkeletonInputProps } from '@/components/skeletons/ui-skeleton-input/types';

function UISkeletonInput(props: UISkeletonInputProps): React.ReactElement {
  return React.createElement(UiSkeletonInput, props);
}

export default UISkeletonInput;

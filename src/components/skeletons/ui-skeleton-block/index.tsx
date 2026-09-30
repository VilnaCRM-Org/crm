import UiSkeletonBlock from '@vilnacrm/ui-toolkit/ui-skeleton-block';
import React from 'react';

import type { UISkeletonBlockProps } from '@/components/skeletons/ui-skeleton-block/types';

function UISkeletonBlock(props: UISkeletonBlockProps): React.ReactElement {
  return React.createElement(UiSkeletonBlock, props);
}

export default UISkeletonBlock;

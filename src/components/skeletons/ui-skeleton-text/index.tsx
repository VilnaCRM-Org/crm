import UiSkeletonText from '@vilnacrm/ui-toolkit/ui-skeleton-text';
import React from 'react';

import type { UISkeletonTextProps } from '@/components/skeletons/ui-skeleton-text/types';

function UISkeletonText(props: UISkeletonTextProps): React.ReactElement {
  return React.createElement(UiSkeletonText, props);
}

export default UISkeletonText;

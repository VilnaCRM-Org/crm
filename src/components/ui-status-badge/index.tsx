import UiStatusBadge from '@vilnacrm/ui-toolkit/ui-status-badge';
import React from 'react';

import type { StatusBadgeProps } from '@/components/types/ui-status-badge';

export default function UIStatusBadge({ label, active, sx }: StatusBadgeProps): React.ReactElement {
  return <UiStatusBadge label={label} active={active} sx={sx} />;
}

import UiCheckbox from '@vilnacrm/ui-toolkit/ui-checkbox';
import React from 'react';

import type { CheckboxProps } from '@/components/types/ui-checkbox';

export default function UICheckbox({
  label,
  checked,
  onChange,
  sx,
}: CheckboxProps): React.ReactElement {
  return <UiCheckbox label={label} checked={checked} onChange={onChange} sx={sx} />;
}

import styled from '@emotion/styled';
import type { JSX } from 'react';

import type { UILiveStatusProps } from '@/components/types/ui-live-status';

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

const VisuallyHiddenStatus = styled('span')(visuallyHidden);

export default function UILiveStatus({ message }: UILiveStatusProps): JSX.Element {
  return (
    <VisuallyHiddenStatus role="status" aria-atomic="true">
      {message}
    </VisuallyHiddenStatus>
  );
}

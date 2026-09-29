import styled from '@emotion/styled';
import type { JSX } from 'react';

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

export default function UILiveStatus({ message }: { message: string }): JSX.Element {
  return (
    <VisuallyHiddenStatus role="status" aria-atomic="true">
      {message}
    </VisuallyHiddenStatus>
  );
}

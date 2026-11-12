import type { JSX } from 'react';

import UIButton from '@/components/ui-button';
import UILiveStatus from '@/components/ui-live-status';

import useCopyAnnouncement from '../../hooks/use-copy-announcement';
import type { CopyButtonProps } from '../../types/components/two-factor-settings';

export default function CopyButton({ label, ...request }: CopyButtonProps): JSX.Element {
  const { message, onCopy } = useCopyAnnouncement(request);

  return (
    <>
      <UIButton type="button" variant="outlinedPill" onClick={onCopy}>
        {label}
      </UIButton>
      <UILiveStatus message={message} />
    </>
  );
}

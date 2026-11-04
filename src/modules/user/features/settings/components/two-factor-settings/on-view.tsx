import { type JSX, useContext } from 'react';

import { CANCELLED_FROM } from '../../hooks/use-two-factor-heading';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import ArrivalContext from './arrival-context';
import OnActions from './on-actions';

export default function OnView({ callbacks }: TwoFactorSettingsProps): JSX.Element {
  const from = useContext(ArrivalContext);

  return (
    <OnActions
      onDisable={callbacks.openDisable}
      onRegenerate={callbacks.openRegenerate}
      returnTo={from !== null && CANCELLED_FROM.has(from) ? from : null}
    />
  );
}

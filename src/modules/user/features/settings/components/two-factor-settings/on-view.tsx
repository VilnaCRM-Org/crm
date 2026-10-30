import { type JSX, useContext } from 'react';

import useStatusText from '../../hooks/use-status-text';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import ArrivalContext from './arrival-context';
import OnActions from './on-actions';
import StatusHeading from './status-heading';

const CANCELLED_FROM = new Set(['disable', 'regenerate']);

export default function OnView({ view, callbacks }: TwoFactorSettingsProps): JSX.Element {
  const from = useContext(ArrivalContext);
  const cancelled = from !== null && CANCELLED_FROM.has(from);
  const arrived = from !== null && !cancelled;

  return (
    <>
      <StatusHeading text={useStatusText(view)} icon focus={view.statusCode !== null || arrived} />
      <OnActions
        onDisable={callbacks.openDisable}
        onRegenerate={callbacks.openRegenerate}
        returnTo={cancelled ? from : null}
      />
    </>
  );
}

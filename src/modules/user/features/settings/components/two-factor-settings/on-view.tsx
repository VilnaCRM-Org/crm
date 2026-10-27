import type { JSX } from 'react';

import useStatusText from '../../hooks/use-status-text';
import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import StatusHeading from './status-heading';

export default function OnView({ view }: TwoFactorSettingsProps): JSX.Element {
  return <StatusHeading text={useStatusText(view)} icon />;
}

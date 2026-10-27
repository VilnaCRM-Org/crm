import type { JSX } from 'react';

import useTwoFactorSettings from '../../hooks/use-two-factor-settings';

import TwoFactorPanel from './two-factor-panel';

export { TwoFactorPanel };

export default function TwoFactorSettings(): JSX.Element {
  const { settings, view, callbacks, isSubmitting } = useTwoFactorSettings();

  return (
    <TwoFactorPanel
      settings={settings}
      view={view}
      callbacks={callbacks}
      isSubmitting={isSubmitting}
    />
  );
}

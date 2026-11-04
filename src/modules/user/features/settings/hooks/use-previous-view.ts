import { useState } from 'react';

import type { ViewTrack } from '../types/hooks/two-factor-submit';
import type { TwoFactorSettingsView } from '../types/two-factor/settings-view';

export default function usePreviousView(view: TwoFactorSettingsView): TwoFactorSettingsView | null {
  const [track, setTrack] = useState<ViewTrack>({ view, from: null });
  if (track.view === view) return track.from;
  setTrack({ view, from: track.view });
  return track.view;
}

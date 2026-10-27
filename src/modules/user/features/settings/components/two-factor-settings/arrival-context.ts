import { createContext } from 'react';

import type { TwoFactorSettingsView } from '../../types/two-factor/settings-view';

const ArrivalContext = createContext<TwoFactorSettingsView | null>(null);

export default ArrivalContext;

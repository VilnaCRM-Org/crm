import { create } from 'zustand';

import type { ConnectivityState } from './types/connectivity-state';

const useConnectivityStore = create<ConnectivityState>()(() => ({ online: true }));

export default useConnectivityStore;

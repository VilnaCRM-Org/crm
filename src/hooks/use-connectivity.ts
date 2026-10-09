import type { ConnectivityState } from '@/lib/connectivity/types/connectivity-state';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';

// Container-free on purpose: the auth forms read it on the paint path (issue #147).
export default function useConnectivity(): boolean {
  return useConnectivityStore((state: ConnectivityState): boolean => state.online);
}

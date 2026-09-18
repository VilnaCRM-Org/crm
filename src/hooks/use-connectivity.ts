import connectivityStateVar from '@/lib/connectivity/connectivity-state-var';
import type { ConnectivityState } from '@/lib/connectivity/types/connectivity-state';
import useReactiveVar from '@/lib/state/use-reactive-var';

// Container-free on purpose: the auth forms read it on the paint path (issue #147).
export default function useConnectivity(): boolean {
  return useReactiveVar(
    connectivityStateVar.reactiveVar(),
    (state: ConnectivityState): boolean => state.online
  );
}

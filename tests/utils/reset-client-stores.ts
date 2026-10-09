import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import useAuthStore from '@auth/stores/use-auth-store';

export function resetClientStores(): void {
  useAuthStore.setState(useAuthStore.getInitialState(), true);
  useConnectivityStore.setState(useConnectivityStore.getInitialState(), true);
}

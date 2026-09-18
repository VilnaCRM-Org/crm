import ReactiveVarFactory from '@/lib/state/reactive-var-factory';
import type { ReactiveVar } from '@/lib/state/types/reactive-var';

import type { ConnectivityState } from './types/connectivity-state';

// Client/UI state (ADR-008): whether the browser believes it has a network. It starts
// optimistic — nothing has been observed yet — and the adapter writes the real value once it
// attaches. No I/O lives here; React reads it through useConnectivity.
export class ConnectivityStateVar {
  private readonly state: ReactiveVar<ConnectivityState> =
    new ReactiveVarFactory().create<ConnectivityState>({ online: true });

  public reactiveVar(): ReactiveVar<ConnectivityState> {
    return this.state;
  }

  public get(): ConnectivityState {
    return this.state();
  }

  public setOnline(online: boolean): void {
    if (this.state().online === online) return;
    this.state({ online });
  }
}

const connectivityStateVar = new ConnectivityStateVar();

export default connectivityStateVar;

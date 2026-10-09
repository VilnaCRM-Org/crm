export interface ConnectivityState {
  readonly online: boolean;
}

// The subset of `window` the connectivity adapter needs: the current flag and the two events
// browsers fire when it changes.
export interface ConnectivityNavigator {
  readonly onLine: boolean;
}

export interface ConnectivityHost {
  readonly navigator: ConnectivityNavigator;
  addEventListener(type: 'online' | 'offline', listener: () => void): void;
  removeEventListener(type: 'online' | 'offline', listener: () => void): void;
}

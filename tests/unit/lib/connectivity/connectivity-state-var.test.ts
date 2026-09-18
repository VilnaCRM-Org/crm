import connectivityStateVar, {
  ConnectivityStateVar,
} from '@/lib/connectivity/connectivity-state-var';

describe('ConnectivityStateVar', () => {
  it('exports the var as a module singleton that starts online', () => {
    expect(connectivityStateVar).toBeInstanceOf(ConnectivityStateVar);
    expect(connectivityStateVar.get()).toEqual({ online: true });
  });

  it('exposes the same reactive var on every read', () => {
    const state = new ConnectivityStateVar();

    expect(state.reactiveVar()).toBe(state.reactiveVar());
    expect(state.reactiveVar()()).toEqual({ online: true });
  });

  it('writes a new value and notifies subscribers when the flag changes', () => {
    const state = new ConnectivityStateVar();
    const listener = jest.fn();
    state.reactiveVar().subscribe(listener);

    state.setOnline(false);

    expect(state.get()).toEqual({ online: false });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify subscribers when the flag is unchanged', () => {
    const state = new ConnectivityStateVar();
    const listener = jest.fn();
    state.reactiveVar().subscribe(listener);
    const before = state.get();

    state.setOnline(true);

    expect(state.get()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it('round-trips offline and back online', () => {
    const state = new ConnectivityStateVar();
    const listener = jest.fn();
    state.reactiveVar().subscribe(listener);

    state.setOnline(false);
    state.setOnline(true);

    expect(state.get()).toEqual({ online: true });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

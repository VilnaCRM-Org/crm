import type { ReactiveVarListener } from '@auth/types/reactive-var';

export default class ReactiveVarState<T> {
  public value: T;

  private readonly once = new Set<ReactiveVarListener<T>>();

  private readonly always = new Set<() => void>();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  private static register<L>(listeners: Set<L>, listener: L): () => void {
    listeners.add(listener);
    return (): void => {
      listeners.delete(listener);
    };
  }

  // Isolate each listener so one throwing subscriber cannot stop the rest (esp. the
  // persistent `always` listeners that follow the one-shot ones).
  private static safeNotify<A>(listener: (arg: A) => void, arg: A): void {
    try {
      listener(arg);
    } catch (error) {
      console.error('ReactiveVar listener threw during notification', error);
    }
  }

  public write(value: T): T {
    if (this.value === value) return value;
    // Snapshot both listener sets and advance the value before notifying, so a
    // re-entrant write() from a listener sees the new value and its own stable set.
    const onceListeners = [...this.once];
    this.once.clear();
    this.value = value;
    onceListeners.forEach((listener) => ReactiveVarState.safeNotify(listener, value));
    [...this.always].forEach((listener) => ReactiveVarState.safeNotify(listener, undefined));
    return value;
  }

  public onNext(listener: ReactiveVarListener<T>): () => void {
    return ReactiveVarState.register(this.once, listener);
  }

  public onEvery(listener: () => void): () => void {
    return ReactiveVarState.register(this.always, listener);
  }
}

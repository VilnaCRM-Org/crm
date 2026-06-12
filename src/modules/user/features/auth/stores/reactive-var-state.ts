import type { ReactiveVarListener } from '../types/reactive-var';

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

  public write(value: T): T {
    if (this.value === value) return value;
    const notified = [...this.once];
    this.once.clear();
    this.value = value;
    notified.forEach((listener) => listener(value));
    this.always.forEach((listener) => listener());
    return value;
  }

  public onNext(listener: ReactiveVarListener<T>): () => void {
    return ReactiveVarState.register(this.once, listener);
  }

  public onEvery(listener: () => void): () => void {
    return ReactiveVarState.register(this.always, listener);
  }
}

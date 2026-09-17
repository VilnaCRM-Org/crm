export default class ReactiveVarState<T> {
  public value: T;

  private readonly listeners = new Set<() => void>();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  public write(value: T): T {
    if (this.value === value) return value;
    this.value = value;
    [...this.listeners].forEach((listener) => this.safeNotify(listener));
    return value;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  private safeNotify(listener: () => void): void {
    try {
      listener();
    } catch (error) {
      console.error('ReactiveVar listener threw during notification', error);
    }
  }
}

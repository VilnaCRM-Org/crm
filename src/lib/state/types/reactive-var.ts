export interface ReactiveVar<T> {
  (): T;
  (next: T): T;
  subscribe(listener: () => void): () => void;
}

export type ReactiveVarListener<T> = (value: T) => void;

export interface ReactiveVar<T> {
  (): T;
  (next: T): T;
  onNextChange(listener: ReactiveVarListener<T>): () => void;
  subscribe(listener: () => void): () => void;
}

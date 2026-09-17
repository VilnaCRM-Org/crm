export interface ReactiveVar<T> {
  (): T;
  (next: T): T;
  subscribe(listener: () => void): () => void;
}

export interface ReactiveVarSnapshot<TValue, TSlice> {
  value: TValue;
  select: (value: TValue) => TSlice;
  slice: TSlice;
}

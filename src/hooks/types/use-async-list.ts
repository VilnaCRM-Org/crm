export interface AsyncListState<T> {
  readonly items: readonly T[];
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

export interface AsyncListSubscription {
  active: boolean;
}

export type AsyncListApply<T> = (state: AsyncListState<T>) => void;

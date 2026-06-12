import type { ReactiveVar, ReactiveVarListener } from '@auth/types/reactive-var';

import ReactiveVarState from './reactive-var-state';

// Dependency-free stand-in for Apollo's `makeVar`: same call surface (read/write call,
// one-shot `onNextChange`) so consumers stay unchanged without bundling @apollo/client.
export default class ReactiveVarFactory {
  public static create<T>(initialValue: T): ReactiveVar<T> {
    const state = new ReactiveVarState(initialValue);
    const variable = ((...next: [] | [T]): T =>
      next.length === 0 ? state.value : state.write(next[0])) as ReactiveVar<T>;
    variable.onNextChange = (listener: ReactiveVarListener<T>): (() => void) =>
      state.onNext(listener);
    variable.subscribe = (listener: () => void): (() => void) => state.onEvery(listener);
    return variable;
  }
}

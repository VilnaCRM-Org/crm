import ReactiveVarState from './reactive-var-state';
import type { ReactiveVar } from './types/reactive-var';

export default class ReactiveVarFactory {
  public create<T>(initialValue: T): ReactiveVar<T> {
    const state = new ReactiveVarState(initialValue);
    const variable = ((...next: [] | [T]): T =>
      next.length === 0 ? state.value : state.write(next[0])) as ReactiveVar<T>;
    variable.subscribe = (listener: () => void): (() => void) => state.subscribe(listener);
    return variable;
  }
}

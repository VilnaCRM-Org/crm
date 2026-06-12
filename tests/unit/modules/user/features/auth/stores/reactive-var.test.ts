import ReactiveVarFactory from '@auth/stores/reactive-var';

describe('ReactiveVarFactory', () => {
  it('reads the initial value and returns the written value', () => {
    const variable = ReactiveVarFactory.create({ count: 0 });
    expect(variable()).toEqual({ count: 0 });

    const next = { count: 1 };
    expect(variable(next)).toBe(next);
    expect(variable()).toBe(next);
  });

  it('notifies one-shot listeners exactly once with the new value', () => {
    const variable = ReactiveVarFactory.create(0);
    const listener = jest.fn();
    variable.onNextChange(listener);

    variable(1);
    variable(2);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1);
  });

  it('does not notify a one-shot listener after its canceller runs', () => {
    const variable = ReactiveVarFactory.create(0);
    const listener = jest.fn();
    const cancel = variable.onNextChange(listener);

    cancel();
    variable(1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies persistent subscribers on every change until unsubscribed', () => {
    const variable = ReactiveVarFactory.create(0);
    const listener = jest.fn();
    const unsubscribe = variable.subscribe(listener);

    variable(1);
    variable(2);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    variable(3);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('skips all notifications when the same reference is written again', () => {
    const value = { count: 0 };
    const variable = ReactiveVarFactory.create(value);
    const once = jest.fn();
    const always = jest.fn();
    variable.onNextChange(once);
    variable.subscribe(always);

    expect(variable(value)).toBe(value);

    expect(once).not.toHaveBeenCalled();
    expect(always).not.toHaveBeenCalled();
  });
});

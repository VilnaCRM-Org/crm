import ReactiveVarFactory from '@/lib/state/reactive-var-factory';

describe('ReactiveVarFactory', () => {
  it('reads the initial value and returns the written value', () => {
    const variable = new ReactiveVarFactory().create({ count: 0 });
    expect(variable()).toEqual({ count: 0 });

    const next = { count: 1 };
    expect(variable(next)).toBe(next);
    expect(variable()).toBe(next);
  });

  it('notifies subscribers on every change until unsubscribed', () => {
    const variable = new ReactiveVarFactory().create(0);
    const listener = jest.fn();
    const unsubscribe = variable.subscribe(listener);

    variable(1);
    variable(2);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith();

    unsubscribe();
    variable(3);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('advances the value before notifying so a subscriber reads the new value', () => {
    const variable = new ReactiveVarFactory().create(0);
    const seen: number[] = [];
    variable.subscribe(() => seen.push(variable()));

    variable(1);
    variable(2);

    expect(seen).toEqual([1, 2]);
  });

  it('isolates a throwing subscriber so the remaining subscribers still run', () => {
    const variable = new ReactiveVarFactory().create(0);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('listener failure');
    const failing = jest.fn(() => {
      throw failure;
    });
    const survivor = jest.fn();
    variable.subscribe(failing);
    variable.subscribe(survivor);

    try {
      expect(variable(1)).toBe(1);

      expect(failing).toHaveBeenCalledTimes(1);
      expect(survivor).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        'ReactiveVar listener threw during notification',
        failure
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('keeps notifying a sibling that a subscriber unsubscribed mid-broadcast', () => {
    const variable = new ReactiveVarFactory().create(0);
    const second = jest.fn();
    let unsubscribeSecond = (): void => {};
    variable.subscribe(() => unsubscribeSecond());
    unsubscribeSecond = variable.subscribe(second);

    variable(1);
    expect(second).toHaveBeenCalledTimes(1);

    variable(2);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('skips all notifications when the same reference is written again', () => {
    const value = { count: 0 };
    const variable = new ReactiveVarFactory().create(value);
    const listener = jest.fn();
    variable.subscribe(listener);

    expect(variable(value)).toBe(value);

    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribing twice is a no-op and never removes another subscriber', () => {
    const variable = new ReactiveVarFactory().create(0);
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = variable.subscribe(first);
    variable.subscribe(second);

    unsubscribeFirst();
    unsubscribeFirst();
    variable(1);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

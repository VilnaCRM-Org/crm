import '../../../../../setup';

import ReactiveVarFactory from '@auth/stores/reactive-var';

describe('reactive var integration', () => {
  it('supports read, write, one-shot and persistent notification end to end', () => {
    const variable = new ReactiveVarFactory().create({ token: null as string | null });
    const once = jest.fn();
    const always = jest.fn();
    variable.onNextChange(once);
    const unsubscribe = variable.subscribe(always);

    const next = { token: 'session' };
    expect(variable(next)).toBe(next);
    expect(variable()).toBe(next);
    expect(once).toHaveBeenCalledTimes(1);
    expect(once).toHaveBeenCalledWith(next);

    variable({ token: null });
    expect(once).toHaveBeenCalledTimes(1);
    expect(always).toHaveBeenCalledTimes(2);

    unsubscribe();
    variable({ token: 'again' });
    expect(always).toHaveBeenCalledTimes(2);
  });

  it('skips notifications for same-reference writes and honours cancelled listeners', () => {
    const value = { token: 'stable' };
    const variable = new ReactiveVarFactory().create(value);
    const once = jest.fn();
    const always = jest.fn();
    const cancel = variable.onNextChange(once);
    variable.subscribe(always);

    expect(variable(value)).toBe(value);
    expect(once).not.toHaveBeenCalled();
    expect(always).not.toHaveBeenCalled();

    cancel();
    variable({ token: 'fresh' });
    expect(once).not.toHaveBeenCalled();
    expect(always).toHaveBeenCalledTimes(1);
  });

  it('keeps notifying persistent subscribers after a one-shot listener throws', () => {
    const variable = new ReactiveVarFactory().create({ token: null as string | null });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('listener failure');
    const failing = jest.fn(() => {
      throw failure;
    });
    const survivor = jest.fn();
    variable.onNextChange(failing);
    variable.subscribe(survivor);

    const next = { token: 'session' };
    try {
      expect(variable(next)).toBe(next);

      expect(failing).toHaveBeenCalledWith(next);
      expect(survivor).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        'ReactiveVar listener threw during notification',
        failure
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});

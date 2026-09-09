import '@tests/unit/utils/setup-bun-dom';
import { renderHook } from '@testing-library/react';
import 'reflect-metadata';
import { injectable } from 'tsyringe';

import container from '@/config/dependency-injection-config';
import { useService } from '@/providers/di';
import useServiceDefault from '@/providers/di/use-service';
import ERROR_REPORTING_TOKENS from '@/services/error-reporting/tokens';
import type { ErrorReporter } from '@/services/types/error-reporting';

@injectable()
class Greeter {
  public greet(): string {
    return 'real';
  }
}

describe('useService', () => {
  it('resolves an instance registered in the composition root', () => {
    const { result } = renderHook(() =>
      useService<ErrorReporter>(ERROR_REPORTING_TOKENS.ErrorReporter)
    );

    expect(typeof result.current.report).toBe('function');
  });

  it('memoizes on the token so a re-render does not re-resolve', () => {
    const token = Symbol('TransientGreeter');
    container.register(token, { useClass: Greeter });

    const { result, rerender } = renderHook(() => useService<Greeter>(token));
    const first = result.current;
    rerender();

    expect(container.resolve<Greeter>(token)).not.toBe(first);
    expect(result.current).toBe(first);
  });

  it('re-resolves when the token changes', () => {
    const first = Symbol('FirstGreeter');
    const second = Symbol('SecondGreeter');
    container.register(first, { useValue: new Greeter() });
    container.register(second, { useValue: new Greeter() });

    const { result, rerender } = renderHook(({ token }) => useService<Greeter>(token), {
      initialProps: { token: first as symbol },
    });
    const initial = result.current;
    rerender({ token: second });

    expect(result.current).not.toBe(initial);
    expect(result.current).toBe(container.resolve<Greeter>(second));
  });

  it('returns a mock registered against the token (substitutability)', () => {
    const token = Symbol('MockableGreeter');
    const mock = { greet: jest.fn(() => 'mocked') };
    container.register(token, { useValue: mock });

    const { result } = renderHook(() => useServiceDefault<Greeter>(token));

    expect(result.current.greet()).toBe('mocked');
    expect(mock.greet).toHaveBeenCalledTimes(1);
  });
});

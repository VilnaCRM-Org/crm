import { act, renderHook } from '@testing-library/react';

import useRegistrationForm from '@auth/hooks/use-registration-form';

const mockDispatch = jest.fn();
const selectorValues: Record<string, unknown> = {
  user: null,
  loading: false,
  error: null,
};

jest.mock('@/stores/hooks', () => ({
  __esModule: true,
  default: (): jest.Mock => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown): unknown =>
    selector({
      registration: {
        user: selectorValues.user,
        loading: selectorValues.loading,
        error: selectorValues.error,
      },
    }),
}));

describe('useRegistrationForm', () => {
  beforeEach(() => {
    selectorValues.user = null;
    selectorValues.loading = false;
    selectorValues.error = null;
    mockDispatch.mockClear();
  });

  it('starts on the form view with empty error text', () => {
    const { result } = renderHook(() => useRegistrationForm());

    expect(result.current.view).toBe('form');
    expect(result.current.errorText).toBe('');
    expect(result.current.formKey).toBe(0);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('notifies the onViewChange callback when the view changes', () => {
    const onViewChange = jest.fn();
    renderHook(() => useRegistrationForm(onViewChange));

    expect(onViewChange).toHaveBeenCalledWith('form');
  });

  it('surfaces the error text from the store', () => {
    selectorValues.error = 'something went wrong';
    const { result } = renderHook(() => useRegistrationForm());

    expect(result.current.errorText).toBe('something went wrong');
  });

  it('exposes handlers and a stable formKey across renders', () => {
    const { result, rerender } = renderHook(() => useRegistrationForm());

    expect(typeof result.current.handleRegister).toBe('function');
    expect(typeof result.current.handleSuccessShown).toBe('function');
    expect(typeof result.current.handleBackToForm).toBe('function');
    expect(typeof result.current.handleRetry).toBe('function');

    const initialKey = result.current.formKey;
    rerender();
    expect(result.current.formKey).toBe(initialKey);

    act(() => result.current.handleSuccessShown());
    expect(result.current.formKey).toBe(initialKey + 1);
  });
});

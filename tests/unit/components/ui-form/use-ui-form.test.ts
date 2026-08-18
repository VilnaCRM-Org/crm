import { act, renderHook } from '@testing-library/react';

import useUIForm from '@/components/ui-form/use-ui-form';
import { buildEmail, buildPassword } from '@tests/builders';

type Credentials = {
  email: string;
  password: string;
};

describe('useUIForm', () => {
  it('seeds react-hook-form with the supplied default values', () => {
    const defaultValues: Credentials = { email: buildEmail(), password: buildPassword() };

    const { result } = renderHook(() => useUIForm<Credentials>({ defaultValues, formOptions: {} }));

    expect(result.current.methods.getValues()).toEqual(defaultValues);
    expect(result.current.methods.formState.defaultValues).toEqual(defaultValues);
  });

  it('validates on touch rather than waiting for a submit', () => {
    const defaultValues: Credentials = { email: buildEmail(), password: buildPassword() };

    const { result } = renderHook(() => useUIForm<Credentials>({ defaultValues, formOptions: {} }));

    expect(result.current.methods.control._options.mode).toBe('onTouched');
  });

  it('restores the supplied defaults on reset', () => {
    const defaultValues: Credentials = { email: buildEmail(), password: buildPassword() };
    const { result } = renderHook(() => useUIForm<Credentials>({ defaultValues, formOptions: {} }));

    act(() => {
      result.current.methods.setValue('email', buildEmail());
      result.current.methods.reset();
    });

    expect(result.current.methods.getValues()).toEqual(defaultValues);
  });

  it('prefers an explicit isSubmitting flag over the form state', () => {
    const defaultValues: Credentials = { email: buildEmail(), password: buildPassword() };

    const { result: forced } = renderHook(() =>
      useUIForm<Credentials>({ defaultValues, formOptions: {}, isSubmitting: true })
    );
    const { result: derived } = renderHook(() =>
      useUIForm<Credentials>({ defaultValues, formOptions: {} })
    );

    expect(forced.current.submitting).toBe(true);
    expect(derived.current.submitting).toBe(false);
  });
});

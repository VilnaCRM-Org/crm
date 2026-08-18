import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { type ReactElement, createElement } from 'react';

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

  it('validates on touch rather than waiting for a submit', async () => {
    function Harness(): ReactElement {
      const { methods } = useUIForm<Credentials>({
        defaultValues: { email: '', password: buildPassword() },
        formOptions: {},
      });
      const field = methods.register('email', { required: 'Email is required' });

      return createElement(
        'form',
        null,
        createElement('input', {
          'aria-label': 'Email',
          name: field.name,
          ref: field.ref,
          onBlur: field.onBlur,
          onChange: field.onChange,
        }),
        createElement('p', null, methods.formState.errors.email?.message ?? '')
      );
    }

    render(createElement(Harness));
    fireEvent.blur(screen.getByLabelText('Email'));

    // Blur alone surfaces the error. Under react-hook-form's default onSubmit mode nothing would
    // appear until the form was submitted, so this fails if the hook stops asking for onTouched.
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
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

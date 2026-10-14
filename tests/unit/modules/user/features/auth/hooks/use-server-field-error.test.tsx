import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';

import useServerFieldError from '@auth/hooks/use-server-field-error';

interface Values {
  email: string;
}

interface HarnessProps {
  readonly message: string | null;
}

const captured: { form: UseFormReturn<Values> | null } = { form: null };

function form(): UseFormReturn<Values> {
  if (captured.form === null) throw new Error('form not captured');
  return captured.form;
}

function Consumer({ message }: HarnessProps): null {
  useServerFieldError({ name: 'email', message });
  return null;
}

function Harness({ message }: HarnessProps): JSX.Element {
  const methods = useForm<Values>({ defaultValues: { email: '' } });
  captured.form = methods;
  const { ref, name, onChange, onBlur } = methods.register('email');
  return (
    <FormProvider {...methods}>
      <label htmlFor="email">Email</label>
      <input id="email" ref={ref} name={name} onChange={onChange} onBlur={onBlur} />
      <Consumer message={message} />
    </FormProvider>
  );
}

function renderWith(message: string | null): { readonly show: (next: string | null) => void } {
  const view = render(<Harness message={message} />);
  return {
    show: (next: string | null): void => {
      view.rerender(<Harness message={next} />);
    },
  };
}

describe('useServerFieldError', () => {
  beforeEach(() => {
    captured.form = null;
  });

  it('sets a server error with the message and focuses the field when one arrives', async () => {
    const { show: showMessage } = renderWith(null);
    const focus = jest.spyOn(screen.getByLabelText('Email'), 'focus');

    showMessage('Not a valid address');

    expect(form().getFieldState('email').error).toEqual(
      expect.objectContaining({ type: 'server', message: 'Not a valid address' })
    );
    await waitFor(() => expect(focus).toHaveBeenCalledTimes(1));
  });

  it('sets nothing while the message is null', () => {
    const focus = jest.spyOn(HTMLInputElement.prototype, 'focus');

    renderWith(null);

    expect(form().getFieldState('email').error).toBeUndefined();
    expect(focus).not.toHaveBeenCalled();
    focus.mockRestore();
  });

  it('clears its own server error when the message goes away', () => {
    const { show: showMessage } = renderWith(null);
    showMessage('Not a valid address');

    showMessage(null);

    expect(form().getFieldState('email').error).toBeUndefined();
  });

  it('keeps an error another rule set when the message goes away', () => {
    const { show: showMessage } = renderWith(null);
    showMessage('Not a valid address');
    act(() => {
      form().setError('email', { type: 'validate', message: 'Bad value' });
    });

    showMessage(null);

    expect(form().getFieldState('email').error).toEqual(
      expect.objectContaining({ type: 'validate', message: 'Bad value' })
    );
  });
});

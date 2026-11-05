import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';

import useServerFieldError from '@/components/ui-server-field-error/use-server-field-error';

interface Values {
  email: string;
}

interface HarnessProps {
  readonly message: string | null;
  readonly focus?: boolean | undefined;
}

const captured: { form: UseFormReturn<Values> | null } = { form: null };

function form(): UseFormReturn<Values> {
  if (captured.form === null) throw new Error('form not captured');
  return captured.form;
}

function Consumer({ message, focus }: HarnessProps): null {
  useServerFieldError({ name: 'email', message, focus });
  return null;
}

function Harness({ message, focus }: HarnessProps): JSX.Element {
  const methods = useForm<Values>({ defaultValues: { email: '' } });
  captured.form = methods;
  const { ref, name, onChange, onBlur } = methods.register('email');
  return (
    <FormProvider {...methods}>
      <label htmlFor="email">Email</label>
      <input id="email" ref={ref} name={name} onChange={onChange} onBlur={onBlur} />
      <Consumer message={message} focus={focus} />
    </FormProvider>
  );
}

function renderWith(
  message: string | null,
  focus?: boolean
): { readonly show: (next: string | null) => void } {
  const view = render(<Harness message={message} focus={focus} />);
  return {
    show: (next: string | null): void => {
      view.rerender(<Harness message={next} focus={focus} />);
    },
  };
}

describe('useServerFieldError', () => {
  beforeEach(() => {
    captured.form = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('sets the error but leaves focus in place when focus is false', () => {
    const { show: showMessage } = renderWith(null, false);
    const focus = jest.spyOn(screen.getByLabelText('Email'), 'focus');

    showMessage('Not a valid address');

    expect(form().getFieldState('email').error).toEqual(
      expect.objectContaining({ type: 'server', message: 'Not a valid address' })
    );
    expect(focus).not.toHaveBeenCalled();
  });

  it('still clears only its own server error when focus is false', () => {
    const { show: showMessage } = renderWith(null, false);
    showMessage('Not a valid address');

    showMessage(null);

    expect(form().getFieldState('email').error).toBeUndefined();
  });

  it('sets nothing while the message is null', () => {
    const focus = jest.spyOn(HTMLInputElement.prototype, 'focus');

    renderWith(null);

    expect(form().getFieldState('email').error).toBeUndefined();
    expect(focus).not.toHaveBeenCalled();
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

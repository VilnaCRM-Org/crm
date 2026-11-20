import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { JSX } from 'react';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';

import useServerFieldError from '@/components/ui-server-field-error/use-server-field-error';

interface Values {
  email: string;
  backupEmail: string;
}

type FieldName = keyof Values;

interface HarnessProps {
  readonly message: string | null;
  readonly occurrence?: number | undefined;
  readonly focus?: boolean | undefined;
  readonly name?: FieldName | undefined;
  readonly mounted?: boolean | undefined;
}

const captured: { form: UseFormReturn<Values> | null } = { form: null };

function form(): UseFormReturn<Values> {
  if (captured.form === null) throw new Error('form not captured');
  return captured.form;
}

function Consumer({ message, occurrence = 0, focus, name = 'email' }: HarnessProps): null {
  useServerFieldError({ name, message, occurrence, focus });
  return null;
}

function Harness({ message, occurrence, focus, name, mounted = true }: HarnessProps): JSX.Element {
  const methods = useForm<Values>({ defaultValues: { email: '', backupEmail: '' } });
  captured.form = methods;
  const email = methods.register('email');
  return (
    <FormProvider {...methods}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        ref={email.ref}
        name={email.name}
        onChange={email.onChange}
        onBlur={email.onBlur}
      />
      {mounted ? (
        <Consumer message={message} occurrence={occurrence} focus={focus} name={name} />
      ) : null}
    </FormProvider>
  );
}

function harnessOf({ message, name, mounted }: HarnessProps): JSX.Element {
  return <Harness message={message} focus={false} name={name} mounted={mounted} />;
}

function renderConsumer(props: HarnessProps): {
  readonly update: (next: HarnessProps) => void;
} {
  const view = render(harnessOf(props));
  return {
    update: (next: HarnessProps): void => {
      view.rerender(harnessOf(next));
    },
  };
}

function renderWith(
  message: string | null,
  focus?: boolean
): { readonly show: (next: string | null, occurrence?: number) => void } {
  const view = render(<Harness message={message} focus={focus} />);
  return {
    show: (next: string | null, occurrence?: number): void => {
      view.rerender(<Harness message={next} occurrence={occurrence} focus={focus} />);
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

  it('sets the same message again and refocuses when the occurrence moves on', async () => {
    const { show: showMessage } = renderWith(null);
    const focus = jest.spyOn(screen.getByLabelText('Email'), 'focus');
    showMessage('Not a valid address', 1);
    await waitFor(() => expect(focus).toHaveBeenCalledTimes(1));
    act(() => {
      form().clearErrors('email');
    });

    showMessage('Not a valid address', 2);

    expect(form().getFieldState('email').error).toEqual(
      expect.objectContaining({ type: 'server', message: 'Not a valid address' })
    );
    await waitFor(() => expect(focus).toHaveBeenCalledTimes(2));
  });

  it('neither resets nor refocuses while the message and occurrence stay the same', async () => {
    const { show: showMessage } = renderWith(null);
    const focus = jest.spyOn(screen.getByLabelText('Email'), 'focus');
    showMessage('Not a valid address', 1);
    await waitFor(() => expect(focus).toHaveBeenCalledTimes(1));
    act(() => {
      form().clearErrors('email');
    });

    showMessage('Not a valid address', 1);

    expect(form().getFieldState('email').error).toBeUndefined();
    expect(focus).toHaveBeenCalledTimes(1);
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

  it('clears its own server error when it unmounts', () => {
    const { update } = renderConsumer({ message: 'Not a valid address' });

    update({ message: 'Not a valid address', mounted: false });

    expect(form().getFieldState('email').error).toBeUndefined();
  });

  it('keeps an error another rule set when it unmounts', () => {
    const { update } = renderConsumer({ message: null });
    act(() => {
      form().setError('email', { type: 'validate', message: 'Bad value' });
    });

    update({ message: null, mounted: false });

    expect(form().getFieldState('email').error).toEqual(
      expect.objectContaining({ type: 'validate', message: 'Bad value' })
    );
  });

  it('unmounts cleanly when the field carries no error', () => {
    const { update } = renderConsumer({ message: null });

    update({ message: null, mounted: false });

    expect(form().getFieldState('email').error).toBeUndefined();
  });

  it('clears the server error it set on the previous field when the name changes', () => {
    const { update } = renderConsumer({ message: 'Not a valid address', name: 'email' });

    update({ message: 'Not a valid address', name: 'backupEmail' });

    expect(form().getFieldState('email').error).toBeUndefined();
    expect(form().getFieldState('backupEmail').error).toEqual(
      expect.objectContaining({ type: 'server', message: 'Not a valid address' })
    );
  });
});

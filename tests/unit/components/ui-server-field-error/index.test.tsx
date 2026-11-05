import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import ServerFieldError from '@/components/ui-server-field-error';

interface HarnessProps {
  readonly message: string | null;
  readonly focus?: boolean | undefined;
}

function Field(): JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ email: string }>();
  const message = errors.email?.message;
  const type = errors.email?.type;
  const { ref, name, onChange, onBlur } = register('email', {
    validate: (value) => value !== 'bad' || 'Bad value',
  });
  return (
    <>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        aria-invalid={message ? 'true' : 'false'}
        aria-describedby={message ? 'email-error' : undefined}
        data-error-type={type}
        ref={ref}
        name={name}
        onChange={onChange}
        onBlur={onBlur}
      />
      {message ? <span id="email-error">{message}</span> : null}
    </>
  );
}

function Harness({ message, focus }: HarnessProps): JSX.Element {
  const methods = useForm<{ email: string }>({
    defaultValues: { email: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)}>
        <Field />
        <ServerFieldError name="email" message={message} focus={focus} />
        <button type="submit">Send</button>
      </form>
    </FormProvider>
  );
}

function Bare(): JSX.Element {
  const methods = useForm<{ email: string }>({ defaultValues: { email: '' } });
  return (
    <FormProvider {...methods}>
      <ServerFieldError name="email" message="Not a valid address" />
    </FormProvider>
  );
}

describe('ServerFieldError', () => {
  it('sets the server error on the field and focuses it once', async () => {
    const { rerender } = render(<Harness message={null} />);
    const input = screen.getByLabelText('Email');
    const focus = jest.spyOn(input, 'focus');

    rerender(<Harness message="Not a valid address" />);

    expect(await screen.findByText('Not a valid address')).toHaveAttribute('id', 'email-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    expect(input).toHaveAttribute('data-error-type', 'server');
    expect(focus).toHaveBeenCalledTimes(1);

    rerender(<Harness message="Not a valid address" />);

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('sets the server error and leaves focus in place with focus={false}', async () => {
    const { rerender } = render(<Harness message={null} focus={false} />);
    const input = screen.getByLabelText('Email');
    const focus = jest.spyOn(input, 'focus');

    rerender(<Harness message="Not a valid address" focus={false} />);

    expect(await screen.findByText('Not a valid address')).toBeInTheDocument();
    expect(input).toHaveAttribute('data-error-type', 'server');
    expect(focus).not.toHaveBeenCalled();
  });

  it('clears the server error once the user edits the field after a submit', async () => {
    const { rerender } = render(<Harness message={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    rerender(<Harness message="Not a valid address" />);
    await screen.findByText('Not a valid address');

    await userEvent.type(screen.getByLabelText('Email'), 'a');

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });

  it('clears its server error when the message goes away', async () => {
    const { rerender } = render(<Harness message="Not a valid address" />);
    await screen.findByText('Not a valid address');

    rerender(<Harness message={null} />);

    await waitFor(() =>
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false')
    );
    expect(screen.queryByText('Not a valid address')).not.toBeInTheDocument();
  });

  it('keeps a validation error from another rule when the message goes away', async () => {
    const { rerender } = render(<Harness message={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    rerender(<Harness message="Not a valid address" />);
    await screen.findByText('Not a valid address');
    await userEvent.type(screen.getByLabelText('Email'), 'bad');
    expect(await screen.findByText('Bad value')).toBeInTheDocument();

    rerender(<Harness message={null} />);

    expect(await screen.findByText('Bad value')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('data-error-type', 'validate');
  });

  it('renders no DOM of its own', () => {
    const { container } = render(<Bare />);

    expect(container).toBeEmptyDOMElement();
  });
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import ServerFieldError from '@auth/components/form-section/components/server-field-error';

interface HarnessProps {
  readonly message: string | null;
}

function Field(): JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ email: string }>();
  const message = errors.email?.message;
  const type = errors.email?.type;
  const { ref, name, onChange, onBlur } = register('email', { validate: () => true });
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

function Harness({ message }: HarnessProps): JSX.Element {
  const methods = useForm<{ email: string }>({
    defaultValues: { email: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(() => undefined)}>
        <Field />
        <ServerFieldError name="email" message={message} />
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

  it('clears the server error once the user edits the field after a submit', async () => {
    const { rerender } = render(<Harness message={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    rerender(<Harness message="Not a valid address" />);
    await screen.findByText('Not a valid address');

    await userEvent.type(screen.getByLabelText('Email'), 'a');

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });

  it('renders no DOM of its own', () => {
    const { container } = render(<Bare />);

    expect(container).toBeEmptyDOMElement();
  });
});

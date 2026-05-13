import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';

import UIForm from '@/components/ui-form';

jest.mock('@/components/ui-button', () => ({
  __esModule: true,
  default: ({
    children,
    disabled,
    onClick,
    type = 'button',
  }: {
    children: JSX.Element | string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
  }): JSX.Element => (
    <button type={type === 'submit' ? 'submit' : 'button'} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui-typography', () => ({
  __esModule: true,
  default: ({
    children,
    component,
    role,
  }: {
    children: JSX.Element | string;
    component?: keyof JSX.IntrinsicElements;
    role?: string;
  }): JSX.Element => {
    const Component = component ?? 'span';
    return <Component role={role}>{children}</Component>;
  },
}));

function TestField(): JSX.Element {
  const { register } = useFormContext<{ name: string }>();
  const registration = register('name');

  return (
    <input
      aria-label="name"
      ref={registration.ref}
      name={registration.name}
      onBlur={registration.onBlur}
      onChange={registration.onChange}
    />
  );
}

describe('UIForm', () => {
  it('uses the form submitting state and resets values after a successful submit when requested', async () => {
    let resolveSubmit!: () => void;
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    render(
      <UIForm<{ name: string }>
        onSubmit={onSubmit}
        defaultValues={{ name: '' }}
        submitLabel="Save"
        title="Title"
        resetOnSuccess
      >
        <TestField />
      </UIForm>
    );

    const input = screen.getByLabelText('name');
    const submitButton = screen.getByRole('button', { name: 'Save' });

    fireEvent.change(input, { target: { value: 'Ada' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' });
    });
    expect(submitButton).toBeDisabled();

    resolveSubmit();

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('renders the error message and disables submit when explicitly requested', () => {
    render(
      <UIForm<{ name: string }>
        onSubmit={jest.fn()}
        defaultValues={{ name: '' }}
        isSubmitting={false}
        isSubmitDisabled
        error="Request failed"
        submitLabel="Save"
        title="Title"
      >
        <TestField />
      </UIForm>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Request failed');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});

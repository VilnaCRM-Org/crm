import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';

import UIForm from '@/components/ui-form';

jest.mock('@/components/ui-button', () => ({
  __esModule: true,
  default: ({
    children,
    disabled,
    loading,
    onClick,
    type = 'button',
  }: {
    children: JSX.Element | string;
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
  }): JSX.Element => (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      disabled={disabled || loading}
      onClick={onClick}
    >
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
  it('uses submitting state and resets values after a successful submit', async () => {
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
        submittingLabel="Saving…"
        title="Title"
        resetOnSuccess
      >
        <TestField />
      </UIForm>
    );

    const input = screen.getByLabelText('name');

    fireEvent.change(input, { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada' });
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

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
        submittingLabel="Saving…"
        title="Title"
      >
        <TestField />
      </UIForm>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Request failed');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});

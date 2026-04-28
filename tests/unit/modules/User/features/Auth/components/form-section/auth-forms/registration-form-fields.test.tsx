import { render, screen } from '@testing-library/react';

import * as AuthForms from '@/modules/User/features/Auth/components/form-section/auth-forms';

const { RegistrationFormFields } = AuthForms;

const mockFormField = jest.fn(
  (props: { name: string; label: string; autoComplete: string; type: string }): JSX.Element => {
    const { name, label, autoComplete, type } = props;

    return (
      <input
        aria-label={label}
        data-testid={`field-${name}`}
        autoComplete={autoComplete}
        type={type}
      />
    );
  }
);

jest.mock(
  '@/modules/User/features/Auth/components/form-section/components/form-field',
  () =>
    (props: { name: string; label: string; autoComplete: string; type: string }): JSX.Element =>
      mockFormField(props)
);

const mockPasswordField = jest.fn((props: { label: string; autoComplete: string }): JSX.Element => {
  const { label, autoComplete } = props;

  return <input aria-label={label} data-testid="field-password" autoComplete={autoComplete} />;
});

jest.mock(
  '@/modules/User/features/Auth/components/form-section/components/password-field',
  () =>
    (props: { label: string; autoComplete: string }): JSX.Element =>
      mockPasswordField(props)
);

const t = (key: string): string => key;

const validators = {
  fullName: jest.fn(),
  email: jest.fn(),
  password: jest.fn(),
} as never;

describe('RegistrationFormFields', () => {
  beforeEach(() => {
    mockFormField.mockClear();
    mockPasswordField.mockClear();
  });

  it('uses semantic autocomplete tokens for registration inputs', () => {
    render(<RegistrationFormFields t={t as never} validators={validators} />);

    expect(screen.getByTestId('field-fullName')).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByTestId('field-email')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByTestId('field-password')).toHaveAttribute('autocomplete', 'new-password');

    expect(mockFormField).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'fullName', autoComplete: 'name' })
    );
    expect(mockFormField).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: 'email', autoComplete: 'email' })
    );
    expect(mockPasswordField).toHaveBeenCalledWith(
      expect.objectContaining({ autoComplete: 'new-password' })
    );
  });
});

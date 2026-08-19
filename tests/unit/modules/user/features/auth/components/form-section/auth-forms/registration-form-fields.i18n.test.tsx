import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import { RegistrationFormFields } from '@auth/components/form-section/auth-forms';
import type { Validators } from '@auth/types/auth-forms/registration-form-fields';
import { identityTranslator, stubValidators } from '@tests/unit/utils/auth-form-i18n';

type FieldProps = {
  name?: string;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete: string;
  rules?: { required: string; validate: unknown };
};

const mockFormField = jest.fn();
const mockPasswordField = jest.fn();

jest.mock('@auth/components/form-section/components/form-field', () => ({
  __esModule: true,
  default: (props: FieldProps): JSX.Element => {
    mockFormField(props);

    return (
      <input
        aria-label={props.label}
        placeholder={props.placeholder}
        type={props.type}
        autoComplete={props.autoComplete}
      />
    );
  },
}));

jest.mock('@auth/components/form-section/components/password-field', () => ({
  __esModule: true,
  default: (props: FieldProps): JSX.Element => {
    mockPasswordField(props);

    return (
      <input
        aria-label={props.label}
        placeholder={props.placeholder}
        type="password"
        autoComplete={props.autoComplete}
      />
    );
  },
}));

const t = identityTranslator;

const validators = stubValidators<Validators>();

function renderFields(): void {
  render(<RegistrationFormFields t={t} validators={validators} />);
}

describe('RegistrationFormFields translation contract', () => {
  it('labels the full-name field with its own sign-up label key', () => {
    renderFields();

    expect(
      screen.getByRole('textbox', { name: 'sign_up.form.name_input.label' })
    ).toBeInTheDocument();
  });

  it('labels the email field with its own sign-up label key', () => {
    renderFields();

    expect(screen.getByLabelText('sign_up.form.email_input.label')).toBeInTheDocument();
  });

  it('labels the password field with its own sign-up label key', () => {
    renderFields();

    expect(screen.getByLabelText('sign_up.form.password_input.label')).toBeInTheDocument();
  });

  it('renders a distinct placeholder for every registration field', () => {
    renderFields();

    expect(screen.getByPlaceholderText('sign_up.form.name_input.placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sign_up.form.email_input.placeholder')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('sign_up.form.password_input.placeholder')
    ).toBeInTheDocument();
  });

  it('gives the full-name field a required message and its own validator', () => {
    renderFields();

    expect(mockFormField).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'fullName',
        label: 'sign_up.form.name_input.label',
        placeholder: 'sign_up.form.name_input.placeholder',
        type: 'text',
        autoComplete: 'name',
        rules: {
          required: 'sign_up.form.name_input.required',
          validate: validators.fullName,
        },
      })
    );
  });

  it('gives the email field a required message and its own validator', () => {
    renderFields();

    expect(mockFormField).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: 'email',
        label: 'sign_up.form.email_input.label',
        placeholder: 'sign_up.form.email_input.placeholder',
        type: 'email',
        autoComplete: 'email',
        rules: {
          required: 'sign_up.form.email_input.required',
          validate: validators.email,
        },
      })
    );
  });

  it('never reuses one field key for another field', () => {
    renderFields();

    const [nameProps, emailProps] = mockFormField.mock.calls.map(([props]) => props as FieldProps);
    const [passwordProps] = mockPasswordField.mock.calls.map(([props]) => props as FieldProps);

    expect(nameProps.label).not.toBe(emailProps.label);
    expect(nameProps.placeholder).not.toBe(emailProps.placeholder);
    expect(passwordProps.label).not.toBe(passwordProps.placeholder);
    expect(passwordProps).toEqual({
      label: 'sign_up.form.password_input.label',
      placeholder: 'sign_up.form.password_input.placeholder',
      autoComplete: 'new-password',
    });
  });
});

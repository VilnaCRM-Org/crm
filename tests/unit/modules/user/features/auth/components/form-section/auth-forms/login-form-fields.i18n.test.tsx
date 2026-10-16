import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import LoginFormFields from '@auth/components/form-section/auth-forms/login-form-fields';
import fieldStyles from '@auth/components/form-section/components/styles';
import type { Props } from '@auth/types/auth-forms/login-form-fields';
import { identityTranslator, stubValidators } from '@tests/unit/utils/auth-form-i18n';

type FieldProps = {
  label: string;
  placeholder: string;
  autoComplete: string;
  sx?: unknown;
};

const mockFormField = jest.fn();
const mockPasswordField = jest.fn();

jest.mock('@/components/ui-form-field', () => ({
  __esModule: true,
  default: (props: FieldProps): JSX.Element => {
    mockFormField(props);

    return <input aria-label={props.label} placeholder={props.placeholder} type="email" />;
  },
}));

jest.mock('@/components/ui-password-field', () => ({
  __esModule: true,
  default: (props: FieldProps): JSX.Element => {
    mockPasswordField(props);

    return <input aria-label={props.label} placeholder={props.placeholder} type="password" />;
  },
}));

jest.mock('@auth/components/form-section/components/user-options', () => ({
  __esModule: true,
  default: (): JSX.Element => <div />,
}));

const t = identityTranslator;

const validators = stubValidators<Props['validators']>();

function renderFields(): void {
  render(<LoginFormFields t={t} validators={validators} />);
}

describe('LoginFormFields password translation contract', () => {
  it('labels the password field with the sign-in password label key', () => {
    renderFields();

    expect(screen.getByLabelText('sign_in.form.password_input.label')).toBeInTheDocument();
  });

  it('gives the password field its own placeholder key', () => {
    renderFields();

    expect(
      screen.getByPlaceholderText('sign_in.form.password_input.placeholder')
    ).toBeInTheDocument();
  });

  it('keeps the password label, placeholder and autocomplete token distinct', () => {
    renderFields();

    const props = mockPasswordField.mock.calls[0][0] as FieldProps;

    expect(props).toEqual({
      label: 'sign_in.form.password_input.label',
      placeholder: 'sign_in.form.password_input.placeholder',
      autoComplete: 'current-password',
      rules: {
        required: 'sign_up.form.password_input.required',
        validate: validators.password,
      },
      sx: fieldStyles.formFieldWrapper,
    });
    expect(props.label).not.toBe(props.placeholder);
  });

  it('passes the auth field spacing to the e-mail and the password field', () => {
    renderFields();

    const rendered = [...mockFormField.mock.calls, ...mockPasswordField.mock.calls];

    expect(rendered).toHaveLength(2);
    rendered.forEach(([props]) => {
      expect((props as FieldProps).sx).toBe(fieldStyles.formFieldWrapper);
    });
  });
});

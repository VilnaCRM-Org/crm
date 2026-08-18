import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import PasswordField from '@auth/components/form-section/components/password-field';

jest.mock('@auth/assets/eye.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/eye-off.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

type PasswordFormValues = { password: string };

const PLACEHOLDER = 'password-placeholder';
const LABEL = 'password-label';
const SUBMIT_LABEL = 'submit-credentials';
const SHOW_LABEL = 'auth.password.show';
const HIDE_LABEL = 'auth.password.hide';
const REQUIRED_MESSAGE = 'sign_up.form.password_input.required';
const LENGTH_MESSAGE = 'sign_up.form.password_input.error_length';

const onValid = jest.fn();

function PasswordFormHarness(): JSX.Element {
  const methods = useForm<PasswordFormValues>({ defaultValues: { password: '' } });
  const errorType = methods.formState.errors.password?.type;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValid)}>
        <PasswordField<PasswordFormValues>
          placeholder={PLACEHOLDER}
          label={LABEL}
          autoComplete="new-password"
        />
        <p>{`rule-violated:${errorType === undefined ? 'none' : String(errorType)}`}</p>
        <button type="submit">{SUBMIT_LABEL}</button>
      </form>
    </FormProvider>
  );
}

function mountPasswordForm(): HTMLElement {
  render(<PasswordFormHarness />);

  return screen.getByPlaceholderText(PLACEHOLDER);
}

describe('PasswordField', () => {
  beforeEach(() => {
    onValid.mockClear();
  });

  it('starts masked, unpressed and offers the reveal control', () => {
    const input = mountPasswordForm();

    expect(input).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: SHOW_LABEL });

    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: HIDE_LABEL })).not.toBeInTheDocument();
  });

  it('reveals and re-masks the password as the visibility control is toggled', () => {
    const input = mountPasswordForm();

    fireEvent.click(screen.getByRole('button', { name: SHOW_LABEL }));

    expect(input).toHaveAttribute('type', 'text');

    const hideToggle = screen.getByRole('button', { name: HIDE_LABEL });

    expect(hideToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: SHOW_LABEL })).not.toBeInTheDocument();

    fireEvent.click(hideToggle);

    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: SHOW_LABEL })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('keeps focus on the input by cancelling the toggle mousedown default', () => {
    mountPasswordForm();

    const toggle = screen.getByRole('button', { name: SHOW_LABEL });
    const mouseDown = createEvent.mouseDown(toggle);

    fireEvent(toggle, mouseDown);

    expect(mouseDown.defaultPrevented).toBe(true);
  });

  it('blocks submission of an empty password with the required rule', async () => {
    mountPasswordForm();

    fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    expect(await screen.findByText(REQUIRED_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText('rule-violated:required')).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('blocks submission of a too-short password with the password policy validator', async () => {
    const input = mountPasswordForm();

    fireEvent.change(input, { target: { value: 'Ab1' } });
    fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    expect(await screen.findByText(LENGTH_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText('rule-violated:validate')).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('submits a policy-compliant password', async () => {
    const input = mountPasswordForm();

    fireEvent.change(input, { target: { value: 'Str0ngPassword' } });
    fireEvent.click(screen.getByRole('button', { name: SUBMIT_LABEL }));

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));

    expect(onValid).toHaveBeenCalledWith({ password: 'Str0ngPassword' }, expect.anything());
    expect(screen.getByText('rule-violated:none')).toBeInTheDocument();
  });
});

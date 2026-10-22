import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import UIPasswordField from '@/components/ui-password-field';
import formValidators from '@/modules/user/lib/validations';
import { identityTranslator } from '@tests/unit/utils/auth-form-i18n';
import fieldGrid from '@tests/unit/utils/field-grid';

jest.mock('@/assets/icons/eye.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/eye-off.svg', () => ({ ReactComponent: 'svg' }));

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

const rules = {
  required: REQUIRED_MESSAGE,
  validate: formValidators.create<PasswordFormValues>(identityTranslator).password,
};

interface HarnessProps {
  sx?: SystemStyleObject<Theme> | undefined;
  readOnly?: boolean | undefined;
}

function PasswordFormHarness({ sx, readOnly }: HarnessProps): JSX.Element {
  const methods = useForm<PasswordFormValues>({ defaultValues: { password: '' } });
  const errorType = methods.formState.errors.password?.type;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValid)}>
        <UIPasswordField<PasswordFormValues>
          placeholder={PLACEHOLDER}
          label={LABEL}
          autoComplete="new-password"
          rules={rules}
          readOnly={readOnly}
          sx={sx}
        />
        <p>{`rule-violated:${errorType === undefined ? 'none' : String(errorType)}`}</p>
        <button type="submit">{SUBMIT_LABEL}</button>
      </form>
    </FormProvider>
  );
}

function mountPasswordForm(sx?: SystemStyleObject<Theme>): HTMLElement {
  render(<PasswordFormHarness sx={sx} />);

  return screen.getByPlaceholderText(PLACEHOLDER);
}

describe('UIPasswordField', () => {
  beforeEach(() => {
    onValid.mockClear();
  });

  it('is editable unless the caller makes it read-only', async () => {
    const input = mountPasswordForm();

    await userEvent.type(input, 'abc');

    expect(input).not.toHaveAttribute('readonly');
    expect(input).toHaveValue('abc');
  });

  it('keeps a read-only value, its focus and a working reveal control', async () => {
    render(<PasswordFormHarness readOnly />);
    const input = screen.getByPlaceholderText(PLACEHOLDER);

    await userEvent.type(input, 'abc');

    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: SHOW_LABEL }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('readonly');
  });

  it('starts masked, unpressed and offers the reveal control', () => {
    const input = mountPasswordForm();

    expect(input).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: SHOW_LABEL });

    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: HIDE_LABEL })).not.toBeInTheDocument();
  });

  it('draws a 2px dark focus ring on the visibility control from the keyboard', async () => {
    mountPasswordForm();

    await userEvent.tab();
    await userEvent.tab();

    const toggle = screen.getByRole('button', { name: SHOW_LABEL });
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveClass('Mui-focusVisible');
    expect(toggle).toHaveStyle({ outline: '2px solid #404142', outlineOffset: '2px' });
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

  it('keeps focus on the input while the visibility control is pressed by pointer', async () => {
    const user = userEvent.setup();
    const input = mountPasswordForm();
    const toggle = screen.getByRole('button', { name: SHOW_LABEL });
    await user.click(input);
    expect(input).toHaveFocus();

    await user.pointer({ keys: '[MouseLeft>]', target: toggle });

    expect(input).toHaveFocus();

    await user.pointer({ keys: '[/MouseLeft]', target: toggle });

    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('keeps focus on the input by cancelling the toggle mousedown default', async () => {
    mountPasswordForm();

    const toggle = screen.getByRole('button', { name: SHOW_LABEL });
    const mouseDown = createEvent.mouseDown(toggle);

    fireEvent(toggle, mouseDown);

    expect(mouseDown.defaultPrevented).toBe(true);

    // MUI's lazy ripple resolves a mount promise and starts the ripple on a microtask queued by
    // the mousedown handler above; awaiting it here (still inside act) is what lets that deferred
    // update settle instead of leaking into the next test unwrapped.
    await act(async () => {
      await Promise.resolve();
    });
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

  it('forwards its sx to the field grid unchanged', () => {
    const input = mountPasswordForm({ marginBottom: '7px' });

    expect(fieldGrid(input, LABEL)).toHaveStyle({ marginBottom: '7px' });
  });

  it('carries no spacing on the field grid without an sx', () => {
    const input = mountPasswordForm();

    expect(fieldGrid(input, LABEL)).not.toHaveStyle({ marginBottom: '7px' });
    expect(fieldGrid(input, LABEL)).toHaveStyle({ flexDirection: 'column' });
  });
});

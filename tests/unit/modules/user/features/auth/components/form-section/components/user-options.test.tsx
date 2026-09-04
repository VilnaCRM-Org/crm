import { fireEvent, render, screen } from '@testing-library/react';

import UserOptions from '@auth/components/form-section/components/user-options';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const FORGOT_PASSWORD_LABEL = 'sign_in.form.forgot_password';

describe('UserOptions', () => {
  afterEach(() => {
    clearConfigBlock();
  });

  it('does not render a forgot-password control while the flag is off by default', () => {
    render(<UserOptions />);

    expect(screen.getByText('sign_in.form.remember_me')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: FORGOT_PASSWORD_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: FORGOT_PASSWORD_LABEL })).not.toBeInTheDocument();
  });

  it('keeps the forgot-password control hidden when the runtime flag is explicitly off', () => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: false } }));

    render(<UserOptions />);

    expect(screen.queryByRole('link', { name: FORGOT_PASSWORD_LABEL })).not.toBeInTheDocument();
  });

  it('renders the forgot-password link when the runtime flag is on', () => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: true } }));

    render(<UserOptions />);

    const link = screen.getByRole('link', { name: FORGOT_PASSWORD_LABEL });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/password-recovery');
    expect(screen.getByText('sign_in.form.remember_me')).toBeInTheDocument();
  });

  it('toggles the remember-me checkbox state on click', () => {
    render(<UserOptions />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});

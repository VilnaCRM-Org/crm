import { fireEvent, render, screen } from '@testing-library/react';

import UserOptions from '@auth/components/form-section/components/user-options';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const REMEMBER_ME_FLAG = 'REACT_APP_FEATURE_REMEMBER_ME';
const FORGOT_PASSWORD_LABEL = 'sign_in.form.forgot_password';
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  clearConfigBlock();
});

describe('UserOptions with every option flag off (default)', () => {
  it('renders nothing so no silent no-op control is shown', () => {
    delete process.env[REMEMBER_ME_FLAG];
    const { container } = render(<UserOptions />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('sign_in.form.remember_me')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: FORGOT_PASSWORD_LABEL })).not.toBeInTheDocument();
  });
});

describe('UserOptions with only the forgot-password flag on', () => {
  it('renders the recovery link and still hides the remember-me checkbox', () => {
    delete process.env[REMEMBER_ME_FLAG];
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: true } }));

    render(<UserOptions />);

    expect(screen.getByRole('link', { name: FORGOT_PASSWORD_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('sign_in.form.remember_me')).not.toBeInTheDocument();
  });
});

describe('UserOptions with the remember-me flag on', () => {
  beforeEach(() => {
    process.env[REMEMBER_ME_FLAG] = 'true';
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

import { fireEvent, render, screen } from '@testing-library/react';

import UserOptions from '@auth/components/form-section/components/user-options';
import { buildFeatureFlagConfig } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const FORGOT_PASSWORD_LABEL = 'sign_in.form.forgot_password';
const REMEMBER_ME_LABEL = 'sign_in.form.remember_me';

afterEach(() => {
  clearConfigBlock();
});

describe('UserOptions with every option flag off (default)', () => {
  it('renders nothing so no silent no-op control is shown', () => {
    const { container } = render(<UserOptions />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText(REMEMBER_ME_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: FORGOT_PASSWORD_LABEL })).not.toBeInTheDocument();
  });
});

describe('UserOptions with only the forgot-password flag on', () => {
  it('renders the recovery link and still hides the remember-me checkbox', () => {
    writeConfigBlock(buildFeatureFlagConfig({ forgotPassword: true, rememberMe: false }));

    render(<UserOptions />);

    expect(screen.getByRole('link', { name: FORGOT_PASSWORD_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText(REMEMBER_ME_LABEL)).not.toBeInTheDocument();
  });
});

describe('UserOptions with only the remember-me flag on', () => {
  beforeEach(() => {
    writeConfigBlock(buildFeatureFlagConfig({ rememberMe: true, forgotPassword: false }));
  });

  it('renders the checkbox and no forgot-password control', () => {
    render(<UserOptions />);

    expect(screen.getByText(REMEMBER_ME_LABEL)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: FORGOT_PASSWORD_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: FORGOT_PASSWORD_LABEL })).not.toBeInTheDocument();
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

describe('UserOptions with both option flags on', () => {
  it('renders the checkbox and the recovery link side by side', () => {
    writeConfigBlock(buildFeatureFlagConfig({ rememberMe: true, forgotPassword: true }));

    render(<UserOptions />);

    const link = screen.getByRole('link', { name: FORGOT_PASSWORD_LABEL });

    expect(link).toHaveAttribute('href', '/password-recovery');
    expect(screen.getByText(REMEMBER_ME_LABEL)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});

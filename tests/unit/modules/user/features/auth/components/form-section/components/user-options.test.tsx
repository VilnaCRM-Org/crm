import { fireEvent, render, screen } from '@testing-library/react';

import UserOptions from '@auth/components/form-section/components/user-options';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const REMEMBER_ME_FLAG = 'REACT_APP_FEATURE_REMEMBER_ME';
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('UserOptions with the remember-me flag off (default)', () => {
  it('renders nothing so no silent no-op control is shown', () => {
    delete process.env[REMEMBER_ME_FLAG];
    const { container } = render(<UserOptions />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('sign_in.form.remember_me')).not.toBeInTheDocument();
  });
});

describe('UserOptions with the remember-me flag on', () => {
  beforeEach(() => {
    process.env[REMEMBER_ME_FLAG] = 'true';
  });

  it('does not render a forgot-password control until a recovery flow exists', () => {
    render(<UserOptions />);

    expect(screen.getByText('sign_in.form.remember_me')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'sign_in.form.forgot_password' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'sign_in.form.forgot_password' })
    ).not.toBeInTheDocument();
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

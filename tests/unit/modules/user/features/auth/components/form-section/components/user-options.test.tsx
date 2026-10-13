import { fireEvent, render, screen } from '@testing-library/react';

import UserOptions from '@auth/components/form-section/components/user-options';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const FORGOT_PASSWORD_LABEL = 'sign_in.form.forgot_password';

describe('UserOptions', () => {
  it('always renders the forgot-password link to the password-recovery route', () => {
    render(<UserOptions />);

    const link = screen.getByRole('link', { name: FORGOT_PASSWORD_LABEL });

    expect(link).toHaveAttribute('href', '/password-recovery');
    expect(screen.queryByRole('button', { name: FORGOT_PASSWORD_LABEL })).not.toBeInTheDocument();
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

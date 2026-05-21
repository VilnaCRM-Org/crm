import { render, screen } from '@testing-library/react';

import UserOptions from '@/modules/user/features/auth/components/form-section/components/user-options';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

describe('UserOptions', () => {
  it('does not render a forgot-password control until a recovery flow exists', () => {
    render(<UserOptions />);

    expect(screen.getByText('sign_in.form.remember_me')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'sign_in.form.forgot_password' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'sign_in.form.forgot_password' })).not.toBeInTheDocument();
  });
});

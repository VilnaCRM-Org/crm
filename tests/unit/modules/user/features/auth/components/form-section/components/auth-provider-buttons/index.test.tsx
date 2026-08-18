import { fireEvent, render, screen } from '@testing-library/react';

import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';

jest.mock('@auth/assets/social-links/facebook-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/github-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/google-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/twitter-color.svg', () => ({ ReactComponent: 'svg' }));

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

const PROVIDER_LABELS = [
  'Sign in with Google',
  'Sign in with GitHub',
  'Sign in with Facebook',
  'Sign in with Twitter',
];

describe('AuthProviderButtons', () => {
  it('labels the social divider with the localized heading', () => {
    render(<AuthProviderButtons />);

    expect(screen.getByText('sign_up.socials_main_heading')).toBeInTheDocument();
  });

  it('renders one accessible button per registered OAuth provider', () => {
    render(<AuthProviderButtons />);

    expect(screen.getAllByRole('button')).toHaveLength(PROVIDER_LABELS.length);

    PROVIDER_LABELS.forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
  });

  it('wires each button to the authorization popup of its own provider', () => {
    const openSpy = jest.spyOn(window, 'open').mockReturnValue(window);

    render(<AuthProviderButtons />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/google'),
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
  });
});

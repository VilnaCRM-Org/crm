import { fireEvent, render, screen } from '@testing-library/react';

import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';

jest.mock('@auth/assets/social-links/facebook-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/github-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/google-color.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@auth/assets/social-links/twitter-color.svg', () => ({ ReactComponent: 'svg' }));

// The accessible name is a single interpolated key (`auth.oauth.continue_with`), so a stub that
// echoed the key alone would give all four buttons the same name and no query could tell them
// apart. Echo the interpolation too.
jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
    t: (key: string, options?: Record<string, unknown>): string =>
      options?.provider === undefined ? key : `${key}:${String(options.provider)}`,
  }),
}));

const CONTINUE_WITH_KEY = 'auth.oauth.continue_with';
const PROVIDER_LABELS = [
  `${CONTINUE_WITH_KEY}:Google`,
  `${CONTINUE_WITH_KEY}:GitHub`,
  `${CONTINUE_WITH_KEY}:Facebook`,
  `${CONTINUE_WITH_KEY}:Twitter`,
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

  it.each([
    ['Google', 'google'],
    ['GitHub', 'github'],
    ['Facebook', 'facebook'],
    ['Twitter', 'twitter'],
  ])('wires the %s button to the authorization popup of its own provider', (name, provider) => {
    const openSpy = jest.spyOn(window, 'open').mockReturnValue(window);

    render(<AuthProviderButtons />);

    fireEvent.click(screen.getByRole('button', { name: `${CONTINUE_WITH_KEY}:${name}` }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining(`/auth/${provider}`),
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
  });
});

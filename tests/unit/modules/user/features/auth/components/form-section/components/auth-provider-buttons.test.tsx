import { fireEvent, screen } from '@testing-library/react';

import AuthProviderButtons from '@auth/components/form-section/components/auth-provider-buttons';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';

import createLocaleI18n from '../../../../../../../utils/create-locale-i18n';
import renderWithProviders from '../../../../../../../utils/render-with-providers';

const mockClicks: string[] = [];
const mockStarts: unknown[] = [];

const UK_GOOGLE = 'Продовжити через Google';
const UK_GITHUB = 'Продовжити через GitHub';

jest.mock('@auth/components/form-section/components/auth-provider-buttons/oauth-providers', () => ({
  __esModule: true,
  default: {
    list: (start: unknown): { items: typeof mockItems } => {
      mockStarts.push(start);
      return { items: mockItems };
    },
  },
}));

const mockItems = [
  {
    label: 'Google',
    SvgComponent: (): null => null,
    onClick: (): void => {
      mockClicks.push('Google');
    },
  },
  {
    label: 'GitHub',
    SvgComponent: (): null => null,
    onClick: (): void => {
      mockClicks.push('GitHub');
    },
  },
];

describe('AuthProviderButtons', () => {
  beforeEach(() => {
    mockClicks.length = 0;
    mockStarts.length = 0;
  });

  it('names every provider button in English when English is active', () => {
    renderWithProviders(<AuthProviderButtons />);

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument();
  });

  it('names every provider button in Ukrainian when Ukrainian is active', () => {
    renderWithProviders(<AuthProviderButtons />, { i18nMock: createLocaleI18n('uk') });

    expect(screen.getByRole('button', { name: UK_GOOGLE })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UK_GITHUB })).toBeInTheDocument();
  });

  it('leaks no hardcoded English accessible name into the Ukrainian UI', () => {
    renderWithProviders(<AuthProviderButtons />, { i18nMock: createLocaleI18n('uk') });

    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with GitHub' })).not.toBeInTheDocument();
  });

  it('keeps the divider label reachable, not pruned by the divider role', () => {
    renderWithProviders(<AuthProviderButtons />, { i18nMock: createLocaleI18n('uk') });

    expect(screen.getByText('Або')).toBeInTheDocument();
  });

  it('forwards a click to the provider that owns the button', () => {
    renderWithProviders(<AuthProviderButtons />, { i18nMock: createLocaleI18n('uk') });

    fireEvent.click(screen.getByRole('button', { name: UK_GITHUB }));

    expect(mockClicks).toEqual(['GitHub']);
  });

  it('hands the provider list a start callback bound to the social sign-in navigator', () => {
    const start = jest.spyOn(socialSignInNavigator, 'start').mockImplementation(() => undefined);
    renderWithProviders(<AuthProviderButtons />);

    const [bound] = mockStarts as Array<(provider: string) => void>;
    bound?.('google');

    expect(start).toHaveBeenCalledWith('google', null, expect.any(Function));
    start.mockRestore();
  });
});

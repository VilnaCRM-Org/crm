import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';

import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import renderUserProfile from '@tests/unit/utils/render-user-profile';

jest.mock('@/modules/user/features/settings/hooks/use-social-links', () => ({
  __esModule: true,
  default: (): unknown => ({
    status: 'ready',
    linked: { items: ['github'] },
    busy: false,
    link: (): Promise<void> => Promise.resolve(),
    unlink: (): Promise<void> => Promise.resolve(),
    retry: (): undefined => undefined,
  }),
}));

jest.mock('@/modules/user/features/settings/hooks/use-profile-load', () =>
  jest.requireActual('@tests/unit/utils/loading-profile-load-stub')
);

describe('UserProfile social tiles', () => {
  it('always draws a linked tile in the shipped tinted style', () => {
    renderUserProfile(createSettingsLocaleI18n('uk'));

    const unlink = screen.getByRole('button', { name: 'Відключити GitHub' });
    const tile = screen.getByText(
      (_text, element) => element?.tagName === 'DIV' && element.textContent === 'GitHub, підключено'
    );
    expect(tile).toHaveStyle({ backgroundColor: '#E8F7FF' });
    expect(within(tile).getByRole('button')).toBe(unlink);
    expect(unlink).toHaveStyle({ color: '#1EAEFF' });
    expect(unlink).not.toHaveClass('MuiButton-root');
    expect(screen.queryByRole('img', { name: 'Підключено', hidden: true })).not.toBeInTheDocument();
  });
});

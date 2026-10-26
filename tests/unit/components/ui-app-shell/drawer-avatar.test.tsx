import 'reflect-metadata';
import '@testing-library/jest-dom';
import { isInaccessible, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import featureFlagService from '@/config/runtime/feature-flag-service';
import renderAppShell from '@tests/unit/utils/render-app-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const mockRead = jest.fn();

jest.mock('@/providers/di', () => {
  const Mapper = jest.requireActual('@/modules/user/store/user-display-name-mapper').default;
  const tokens = jest.requireActual('@/modules/user/config/tokens').default;
  const mapper = new Mapper();
  const provider = { read: (signal: AbortSignal): unknown => mockRead(signal) };

  return {
    __esModule: true,
    useService: (token: symbol): unknown => (token === tokens.ProfileProvider ? provider : mapper),
  };
});

const MOBILE = 375;
const PAGE = <h1>Головна</h1>;

const openDrawer = async (): Promise<HTMLElement> => {
  await userEvent.setup().click(screen.getByRole('button', { name: 'Відкрити меню' }));

  return screen.findByRole('dialog', { name: 'Основна навігація' });
};

describe('the drawer header avatar copy in the assembled shell (issue #362, F4)', () => {
  beforeEach(() => {
    stubMotionPreference(false);
    mockRead.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('paints the monogram the header avatar shows, aria-hidden, with no second read', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    mockRead.mockResolvedValue({
      kind: 'ok',
      user: {
        id: 'u',
        fullName: 'Петренко Олена Іванівна',
        email: 'o@example.com',
        confirmed: true,
      },
    });
    await renderAppShell({ path: '/', width: MOBILE, page: PAGE });
    await screen.findByRole('button', { name: 'Олена Петренко, Меню користувача' });

    const dialog = await openDrawer();
    const copy = within(dialog).getByText('ОП');

    expect(copy).toHaveAttribute('aria-hidden', 'true');
    expect(isInaccessible(copy)).toBe(true);
    within(dialog)
      .getAllByRole('button')
      .forEach((control) => expect(control).not.toContainElement(copy));
    expect(copy).not.toHaveAttribute('tabindex');
    expect(copy).toHaveStyle({ width: '40px', height: '40px', fontSize: '15px' });
    expect(mockRead).toHaveBeenCalledTimes(1);
    await expectNoA11yViolations(document.body);
  });

  it('paints the no-data glyph copy while the current user is pending', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    mockRead.mockReturnValue(new Promise(() => undefined));
    await renderAppShell({ path: '/', width: MOBILE, page: PAGE });

    const dialog = await openDrawer();

    expect(dialog).toContainHTML('PersonOutlinedIcon');
    expect(within(dialog).queryByText('ОП')).not.toBeInTheDocument();
  });

  it('paints the no-data glyph copy and reads nothing while the settings flag is off', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(false);
    await renderAppShell({ path: '/', width: MOBILE, page: PAGE });

    const dialog = await openDrawer();

    expect(dialog).toContainHTML('PersonOutlinedIcon');
    expect(mockRead).not.toHaveBeenCalled();
  });
});

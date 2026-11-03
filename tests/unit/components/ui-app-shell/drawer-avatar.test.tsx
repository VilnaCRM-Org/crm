import '@testing-library/jest-dom';
import { isInaccessible, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import renderAppShell from '@tests/unit/utils/render-app-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const mockRead = jest.fn();

const MOBILE = 375;
const PAGE = <h1>Головна</h1>;

const openDrawer = async (): Promise<HTMLElement> => {
  await userEvent.setup().click(screen.getByRole('button', { name: 'Відкрити меню' }));

  return screen.findByRole('dialog', { name: 'Основна навігація' });
};

describe('the drawer header avatar copy in the assembled shell (issue #362, F4)', () => {
  beforeEach(() => {
    stubMotionPreference(true);
    mockRead.mockReset();
    jest
      .spyOn(currentUserSource, 'read')
      .mockImplementation((_session, signal) => mockRead(signal));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('paints the monogram the header avatar shows, aria-hidden, with no second read', async () => {
    mockRead.mockResolvedValue({
      kind: 'ok',
      identity: { displayName: 'Олена Петренко', monogram: 'ОП' },
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
    mockRead.mockReturnValue(new Promise(() => undefined));
    await renderAppShell({ path: '/', width: MOBILE, page: PAGE });

    const dialog = await openDrawer();

    expect(dialog).toContainHTML('PersonOutlinedIcon');
    expect(within(dialog).queryByText('ОП')).not.toBeInTheDocument();
  });
});

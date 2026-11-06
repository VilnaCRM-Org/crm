import '@testing-library/jest-dom';
import { act, isInaccessible, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import { buildFullName } from '@tests/builders';
import renderAppShell from '@tests/unit/utils/render-app-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const mockRead = jest.fn();

const MOBILE = 375;
const IDENTITY = new UserDisplayNameMapper().fromFullName(buildFullName());
const PAGE = <h1>Головна</h1>;

const settleTransitions = (): Promise<void> =>
  act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });

const openDrawer = async (): Promise<HTMLElement> => {
  await userEvent.setup().click(screen.getByRole('button', { name: 'Відкрити меню' }));
  const dialog = await screen.findByRole('dialog', { name: 'Основна навігація' });
  await settleTransitions();

  return dialog;
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
      identity: IDENTITY,
    });
    await renderAppShell({ path: '/', width: MOBILE, page: PAGE });
    await screen.findByRole('button', { name: `${IDENTITY.displayName}, Меню користувача` });

    const dialog = await openDrawer();
    const copy = within(dialog).getByText(IDENTITY.monogram);

    expect(copy).toHaveAttribute('aria-hidden', 'true');
    expect(isInaccessible(copy)).toBe(true);
    within(dialog)
      .getAllByRole('button')
      .forEach((control) => expect(control).not.toContainElement(copy));
    expect(copy).not.toHaveAttribute('tabindex');
    expect(copy).toHaveStyle({ width: '40px', height: '40px', fontSize: '15px' });
    expect(mockRead).toHaveBeenCalledTimes(1);
    await act(() => expectNoA11yViolations(document.body));
  });

  it('paints the no-data glyph copy while the current user is pending', async () => {
    mockRead.mockReturnValue(new Promise(() => undefined));
    await renderAppShell({ path: '/', width: MOBILE, page: PAGE });

    const dialog = await openDrawer();

    expect(dialog).toContainHTML('PersonOutlinedIcon');
    expect(within(dialog).queryByText(IDENTITY.monogram)).not.toBeInTheDocument();
  });
});

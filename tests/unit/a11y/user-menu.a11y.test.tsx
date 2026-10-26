import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import featureFlagService from '@/config/runtime/feature-flag-service';
import UserMenu from '@/modules/user/features/settings/components/user-menu';
import UserMenuSlot from '@/modules/user/features/settings/components/user-menu/user-menu-slot';
import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';
import renderShell from '@tests/unit/utils/render-shell';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

interface MenuState {
  readonly identity: UserDisplayName | null;
  readonly settingsAvailable: boolean;
  readonly chipName: string;
  readonly items: number;
}

const MENU = 'Меню користувача';

const states: Record<string, MenuState> = {
  Ready: {
    identity: { displayName: 'Євгенія Маслова', monogram: 'ЄМ' },
    settingsAvailable: true,
    chipName: `Євгенія Маслова, ${MENU}`,
    items: 3,
  },
  LongName: {
    identity: { displayName: 'Олександр Дуже-Довгопрізвищенко', monogram: 'ОД' },
    settingsAvailable: true,
    chipName: `Олександр Дуже-Довгопрізвищенко, ${MENU}`,
    items: 3,
  },
  Pending: { identity: null, settingsAvailable: true, chipName: MENU, items: 3 },
  SettingsOff: { identity: null, settingsAvailable: false, chipName: MENU, items: 1 },
  NamedSettingsOff: {
    identity: { displayName: 'Євгенія Маслова', monogram: 'ЄМ' },
    settingsAvailable: false,
    chipName: `Євгенія Маслова, ${MENU}`,
    items: 1,
  },
};

const cases = [1440, 1024, 375].flatMap((width) =>
  Object.entries(states).map(([name, state]) => ({ width, name, ...state }))
);

const openMenu = async (chipName: string, items: number): Promise<void> => {
  await userEvent.setup().click(screen.getByRole('button', { name: chipName }));
  const menu = await screen.findByRole('menu');

  expect(within(menu).getAllByRole('menuitem')).toHaveLength(items);
};

describe('the user chip and its menu accessibility (Story 2.4)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it.each(cases)(
    'has no axe violation at $width px in the $name state, closed and open',
    async ({ width, identity, settingsAvailable, chipName, items }) => {
      stubViewportWidth(width);
      const { container } = renderShell(
        <UserMenu identity={identity} settingsAvailable={settingsAvailable} signOut={jest.fn()} />,
        { locale: 'uk' }
      );

      expect(screen.getByRole('button', { name: chipName })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      await expectNoA11yViolations(container);

      await openMenu(chipName, items);
      expect(screen.getByRole('button', { name: chipName })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      await expectNoA11yViolations(document.body);
    }
  );

  it.each([1440, 1024, 375])(
    'has no axe violation in the flag-off slot at %i px, closed and open',
    async (width) => {
      stubViewportWidth(width);
      jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(false);
      const { container } = renderShell(
        <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />,
        { locale: 'uk' }
      );

      await expectNoA11yViolations(container);

      await openMenu(MENU, 1);
      await expectNoA11yViolations(document.body);
    }
  );
});

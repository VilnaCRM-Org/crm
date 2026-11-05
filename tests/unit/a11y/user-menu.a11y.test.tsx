import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserMenu from '@/modules/user/features/settings/components/user-menu';
import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';
import { buildFullName } from '@tests/builders';
import renderShell from '@tests/unit/utils/render-shell';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

interface MenuState {
  readonly identity: UserDisplayName | null;
  readonly chipName: string;
}

const MENU = 'Меню користувача';

const mapper = new UserDisplayNameMapper();
const ready = mapper.fromFullName(buildFullName());
const long = mapper.fromFullName(`${buildFullName()} Дуже-Довгопрізвищенко-Довгопрізвищенко`);

const states: Record<string, MenuState> = {
  Ready: { identity: ready, chipName: `${ready.displayName}, ${MENU}` },
  LongName: { identity: long, chipName: `${long.displayName}, ${MENU}` },
  Pending: { identity: null, chipName: MENU },
};

const cases = [1440, 1024, 375].flatMap((width) =>
  Object.entries(states).map(([name, state]) => ({ width, name, ...state }))
);

const openMenu = async (chipName: string): Promise<void> => {
  await userEvent.setup().click(screen.getByRole('button', { name: chipName }));
  const menu = await screen.findByRole('menu');

  expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
};

describe('the user chip and its menu accessibility (Story 2.4)', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it.each(cases)(
    'has no axe violation at $width px in the $name state, closed and open',
    async ({ width, identity, chipName }) => {
      stubViewportWidth(width);
      const { container } = renderShell(<UserMenu identity={identity} signOut={jest.fn()} />, {
        locale: 'uk',
      });

      expect(screen.getByRole('button', { name: chipName })).toHaveAttribute(
        'aria-expanded',
        'false'
      );
      await expectNoA11yViolations(container);

      await openMenu(chipName);
      expect(screen.getByRole('button', { name: chipName })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
      await expectNoA11yViolations(document.body);
    }
  );
});

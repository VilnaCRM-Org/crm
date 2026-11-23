import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { lazy } from 'react';

import BellSlotFrame from '@/components/ui-app-header/bell-slot-frame';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const placeholders = (): HTMLElement[] =>
  screen
    .getAllByRole('generic', { hidden: true })
    .filter((node) => node.getAttribute('aria-hidden') === 'true');

const NeverResolves = lazy(() => new Promise<never>(() => undefined));

describe('BellSlotFrame accessibility', () => {
  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'has no axe violations at %s empty, loading and filled',
    async (layout) => {
      const view = render(
        <main>
          <BellSlotFrame layout={layout} />
        </main>
      );
      expect(placeholders()).toHaveLength(1);
      await expectNoA11yViolations(view.container);
      view.unmount();

      const utils = render(
        <main>
          <BellSlotFrame layout={layout}>
            <NeverResolves />
          </BellSlotFrame>
        </main>
      );
      expect(placeholders()).toHaveLength(1);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      await expectNoA11yViolations(utils.container);
      utils.unmount();

      const { container } = render(
        <main>
          <BellSlotFrame layout={layout}>
            <button type="button">Сповіщення</button>
          </BellSlotFrame>
        </main>
      );
      expect(screen.getByRole('button', { name: 'Сповіщення' })).toBeInTheDocument();
      expect(placeholders()).toEqual([]);
      await expectNoA11yViolations(container);
    }
  );
});

import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';

import HeaderBell from '@/components/ui-app-header/header-bell';
import findBellWrapper from '@tests/unit/utils/find-bell-wrapper';
import renderShell from '@tests/unit/utils/render-shell';

const SLOT = 'Live bell';

describe('HeaderBell', () => {
  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'renders the disabled bell described Ще недоступно without content at %s',
    (layout) => {
      renderShell(<HeaderBell layout={layout} />, { locale: 'uk' });

      const bell = screen.getByRole('button', { name: 'Сповіщення' });

      expect(bell).toBeDisabled();
      expect(bell).toHaveAccessibleDescription('Ще недоступно');
    }
  );

  it('hands the count to the disabled bell', () => {
    renderShell(<HeaderBell layout="desktop" count={1} />);

    const button = screen.getByRole('button', { name: 'Notifications' });
    expect(findBellWrapper(button)).toHaveTextContent(/^1$/u);
    expect(button).toHaveTextContent(/^$/u);
  });

  it.each([
    ['desktop', '48px'],
    ['tablet', '52px'],
    ['mobile', '24px'],
  ] as const)(
    'renders the content inside the %s bell frame and no disabled bell',
    (layout, size) => {
      renderShell(
        <HeaderBell layout={layout} count={1}>
          <button type="button">{SLOT}</button>
        </HeaderBell>
      );
      const frames = screen
        .getAllByRole('generic')
        .filter((box) => within(box).queryByRole('button', { name: SLOT }) !== null);

      expect(screen.queryByRole('button', { name: 'Notifications' })).not.toBeInTheDocument();
      expect(screen.queryByText('Not available yet')).not.toBeInTheDocument();
      expect(frames.at(-1)).toHaveStyle({ width: size, height: size });
      expect(screen.getByRole('button', { name: SLOT })).toBeEnabled();
    }
  );
});

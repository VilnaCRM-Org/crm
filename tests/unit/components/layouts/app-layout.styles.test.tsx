import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';

import testI18n from '@tests/i18n/test-i18n';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

jest.mock('react-router', () => ({
  Outlet: (): ReactElement => <span>route-outlet</span>,
  useLocation: (): { state: null } => ({ state: null }),
  useNavigate: (): jest.Mock => jest.fn(),
  useOutletContext: (): undefined => undefined,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => <footer />,
}));

const AppLayout = jest.requireActual<typeof import('@/components/layouts/app-layout')>(
  '@/components/layouts/app-layout'
).default;

async function renderLayout(): Promise<void> {
  render(
    <I18nextProvider i18n={testI18n}>
      <AppLayout />
    </I18nextProvider>
  );

  await screen.findByRole('contentinfo');
}

describe('AppLayout stretching', () => {
  it('lets the main landmark grow as a full-height flex column', async () => {
    await renderLayout();

    expect(screen.getByRole('main')).toHaveStyle({
      flexGrow: '1',
      display: 'flex',
      flexDirection: 'column',
    });
  });
});

describe('AppLayout focus ring', () => {
  it('never suppresses the outline unconditionally', async () => {
    await renderLayout();

    expect(screen.getByRole('main').getAttribute('style') ?? '').not.toContain('outline');
    expect(screen.getByRole('main')).not.toHaveStyle({ outline: 'none' });
  });

  it('suppresses the ring only for the programmatic :focus-not-:focus-visible case', async () => {
    await renderLayout();

    const gated = styleRuleFor(screen.getByRole('main'), ':focus:not(:focus-visible)');

    expect(gated).toBeDefined();
    expect(gated?.outline).toBe('none');
  });
});

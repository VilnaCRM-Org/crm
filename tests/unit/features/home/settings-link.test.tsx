import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router';

import Home from '@/features/home';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import { styleRuleFor, styleRulesFor } from '@tests/unit/utils/emotion-style-rules';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

function Arrival(): ReactElement {
  const location = useLocation();
  const state = location.state as RedirectNavigationState | null;
  return (
    <p>{`settings page focusMain:${String(state?.focusMain)} state:${JSON.stringify(state)}`}</p>
  );
}

const renderHome = (): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={createLocaleI18n('uk')}>
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={{ signOut: jest.fn() }} />}>
            <Route index element={<Home />} />
          </Route>
          <Route path="/settings" element={<Arrival />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

describe('Home settings link', () => {
  it('renders one /settings link between the description and sign out', () => {
    renderHome();

    const link = screen.getByRole('link', { name: 'Налаштування' });
    const description = screen.getByText('Розділи CRM з’являться тут, щойно їх буде підключено.');
    const signOut = screen.getByRole('button', { name: 'Вийти' });

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(link).toHaveAttribute('href', '/settings');
    expect(description.compareDocumentPosition(link)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(link.compareDocumentPosition(signOut)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('navigates client-side on a plain click with focusMain in the state', () => {
    renderHome();

    const prevented = !fireEvent.click(screen.getByRole('link', { name: 'Налаштування' }), {
      button: 0,
    });

    expect(prevented).toBe(true);
    expect(screen.getByText(/settings page focusMain:true/)).toHaveTextContent(
      'state:{"focusMain":true}'
    );
  });

  it.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
  ])('leaves a %s-click to the browser', (_name, modifier) => {
    renderHome();
    const seen: boolean[] = [];
    document.addEventListener(
      'click',
      (event) => {
        seen.push(event.defaultPrevented);
        event.preventDefault();
      },
      { once: true }
    );

    fireEvent.click(screen.getByRole('link', { name: 'Налаштування' }), { button: 0, ...modifier });

    expect(seen).toEqual([false]);
    expect(screen.queryByText(/settings page/)).not.toBeInTheDocument();
  });

  it('shows the link-coloured focus ring on keyboard focus, like the settings resend link', () => {
    renderHome();

    const ring = styleRuleFor(screen.getByRole('link', { name: 'Налаштування' }), ':focus-visible');

    expect(ring?.getPropertyValue('outline')).toBe('2px solid #0074B5');
    expect(ring?.getPropertyValue('outline-offset')).toBe('2px');
  });

  it('darkens and underlines the link on hover', () => {
    renderHome();

    const hover = styleRulesFor(screen.getByRole('link', { name: 'Налаштування' }), ':hover');

    expect(hover.map((rule) => rule.getPropertyValue('color'))).toContain('#00588A');
    expect(hover.map((rule) => rule.getPropertyValue('text-decoration'))).toContain('underline');
  });

  it('draws the link text in the 5.04:1 link colour, not the MUI default blue', () => {
    renderHome();

    expect(screen.getByRole('link', { name: 'Налаштування' })).toHaveStyle({ color: '#0074B5' });
  });

  it('keeps the 5.04:1 link colour once /settings is in the browser history', () => {
    renderHome();

    const visited = styleRuleFor(screen.getByRole('link', { name: 'Налаштування' }), ':visited');

    expect(visited?.getPropertyValue('color')).toBe('#0074B5');
  });

  it('is reached by Tab right before sign out', async () => {
    renderHome();

    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Налаштування' })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Вийти' })).toHaveFocus();
  });

  it('has no axe violations with the link', async () => {
    const view = renderHome();

    await expectNoA11yViolations(view.container);
  });
});

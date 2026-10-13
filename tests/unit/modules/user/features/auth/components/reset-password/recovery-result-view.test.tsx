import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import type { JSX } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';

import RecoveryResultView from '@auth/components/reset-password/recovery-result-view';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const BODY = 'Ми надіслали лист на eir*****@gmail.com';

const view = (body: string = BODY): JSX.Element => (
  <MemoryRouter>
    <main>
      <RecoveryResultView
        title="Перевірте пошту"
        body={body}
        action={{ label: 'До входу', to: '/sign-in' }}
      />
    </main>
  </MemoryRouter>
);

const renderView = (): ReturnType<typeof render> => render(view());

/**
 * A live region is announced only when assistive tech observes it before its text changes, so the
 * region has to paint empty and be filled by the mount effect. RTL's `render` is act-wrapped and
 * flushes that effect, so static markup is the only view of the commit that precedes it.
 */
const statusTextOnFirstPaint = (): string => {
  const host = document.body.appendChild(document.createElement('div'));
  host.innerHTML = renderToStaticMarkup(view());

  const text = within(host).getByRole('status').textContent ?? '';
  host.remove();

  return text;
};

describe('RecoveryResultView', () => {
  it('focuses its h1 on mount', () => {
    renderView();

    const heading = screen.getByRole('heading', { level: 1, name: 'Перевірте пошту' });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).toHaveFocus();
  });

  it('draws no browser focus ring on the programmatically focused heading', () => {
    renderView();

    expect(screen.getByRole('heading', { level: 1, name: 'Перевірте пошту' })).toHaveStyle({
      outline: 'none',
    });
  });

  it('centres a wrapped action label inside its trimmed padding', () => {
    renderView();

    expect(screen.getByRole('link', { name: 'До входу' })).toHaveStyle({
      textAlign: 'center',
      paddingLeft: '1rem',
      paddingRight: '1rem',
    });
  });

  it('keeps the action label white once its target is visited', () => {
    renderView();

    const visited = styleRuleFor(screen.getByRole('link', { name: 'До входу' }), ':visited');

    expect(visited?.getPropertyValue('color')).toBe('#FFFFFF');
  });

  it('announces the body through a polite status region', async () => {
    renderView();

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(await screen.findByText(BODY)).toBeInTheDocument();
    expect(status).toHaveTextContent(BODY);
  });

  it('paints the status region empty before the mount effect fills it', () => {
    expect(statusTextOnFirstPaint()).toBe('');
  });

  it('refills the same status region when the body changes', async () => {
    const { rerender } = render(view());
    const status = screen.getByRole('status');
    expect(await screen.findByText(BODY)).toBeInTheDocument();

    rerender(view('Пароль змінено'));

    expect(screen.getByRole('status')).toBe(status);
    expect(await screen.findByText('Пароль змінено')).toBeInTheDocument();
    expect(status).toHaveTextContent('Пароль змінено');
  });

  it('renders the action as an in-card link', () => {
    renderView();

    expect(screen.getByRole('link', { name: 'До входу' })).toHaveAttribute('href', '/sign-in');
  });

  it('has no axe violations', async () => {
    const view = renderView();

    await expectNoA11yViolations(view.container);
  });
});

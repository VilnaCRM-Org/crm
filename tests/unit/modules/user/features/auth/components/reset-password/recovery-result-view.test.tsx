import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import RecoveryResultView from '@auth/components/reset-password/recovery-result-view';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const renderView = (): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <main>
        <RecoveryResultView
          title="Перевірте пошту"
          body="Ми надіслали лист на eir*****@gmail.com"
          action={{ label: 'До входу', to: '/sign-in' }}
        />
      </main>
    </MemoryRouter>
  );

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

  it('announces the body through a polite status region', () => {
    renderView();

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Ми надіслали лист на eir*****@gmail.com');
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

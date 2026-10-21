import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import CardBackControl from '@auth/components/reset-password/card-back-control';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@auth/assets/chevron-left.svg', () => ({
  ReactComponent: ({
    'aria-hidden': ariaHidden,
  }: {
    'aria-hidden'?: boolean | 'true' | 'false';
  }): ReactElement => <svg aria-hidden={ariaHidden} />,
}));

const renderControl = (element: ReactElement): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={createRecoveryLocaleI18n('uk')}>
      <MemoryRouter>
        <main>{element}</main>
      </MemoryRouter>
    </I18nextProvider>
  );

describe('CardBackControl', () => {
  it('renders a real link named by its visible text in link mode', () => {
    renderControl(<CardBackControl to="/sign-in" />);

    const link = screen.getByRole('link', { name: 'Назад' });
    expect(link).toHaveAttribute('href', '/sign-in');
    expect(link).toHaveStyle({ minHeight: '1.5rem', color: 'rgb(150, 155, 157)' });
    expect(link).toHaveStyle({ fontSize: '0.9375rem', fontWeight: '500', lineHeight: '1.125rem' });
    expect(screen.getByRole('link', { name: 'Назад' })).toContainHTML('aria-hidden="true"');
  });

  it('keeps its ink colour once the link target is visited', () => {
    renderControl(<CardBackControl to="/sign-in" />);

    const visited = styleRuleFor(screen.getByRole('link', { name: 'Назад' }), ':visited');

    expect(visited?.getPropertyValue('color')).toBe('#969B9D');
  });

  it('renders a native button in button mode and calls onClick on Enter and Space', async () => {
    const onClick = jest.fn();
    renderControl(<CardBackControl onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Назад' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveStyle({ minHeight: '1.5rem', color: 'rgb(150, 155, 157)' });
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    await waitFor(() => expect(onClick).toHaveBeenCalledTimes(2));
  });

  it.each([
    ['link' as const, <CardBackControl key="link" to="/sign-in" />],
    ['button' as const, <CardBackControl key="button" onClick={jest.fn()} />],
  ])('draws a visible focus ring on keyboard focus in %s mode', async (role, element) => {
    renderControl(element);

    await userEvent.tab();

    const control = screen.getByRole(role, { name: 'Назад' });
    expect(control).toHaveFocus();
    expect(control).toHaveClass('Mui-focusVisible');
    expect(control).toHaveStyle({
      outline: '2px solid #404142',
      outlineOffset: '2px',
      borderRadius: '0.25rem',
    });
  });

  it.each([
    ['link', <CardBackControl key="link" to="/sign-in" />],
    ['button', <CardBackControl key="button" onClick={jest.fn()} />],
  ])('has no axe violations in %s mode', async (_mode, element) => {
    const view = renderControl(element);

    await expectNoA11yViolations(view.container);
  });
});

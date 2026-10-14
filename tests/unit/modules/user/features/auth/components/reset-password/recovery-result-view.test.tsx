import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import type { JSX } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';

import RecoveryResultView from '@auth/components/reset-password/recovery-result-view';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
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

type ResultPart = 'heading' | 'body' | 'action';

const resultPart = async (part: ResultPart): Promise<HTMLElement> => {
  renderView();
  const body = await screen.findByText(BODY);
  const parts: Readonly<Record<ResultPart, HTMLElement>> = {
    heading: screen.getByRole('heading', { level: 1, name: 'Перевірте пошту' }),
    body,
    action: screen.getByRole('link', { name: 'До входу' }),
  };

  return parts[part];
};

const statusTextOnFirstPaint = (): string => {
  const host = document.body.appendChild(document.createElement('div'));
  try {
    host.innerHTML = renderToStaticMarkup(view());
    return within(host).getByRole('status').textContent ?? '';
  } finally {
    host.remove();
  }
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

  it.each<[ResultPart, string, string]>([
    ['heading', 'font-size', '1.375rem'],
    ['heading', 'font-weight', '700'],
    ['heading', 'line-height', '1.625rem'],
    ['body', 'font-size', '0.9375rem'],
    ['body', 'line-height', '1.5625rem'],
    ['action', 'height', '3.125rem'],
    ['action', 'font-size', '0.9375rem'],
    ['action', 'font-weight', '500'],
    ['action', 'line-height', '1.2'],
  ])('sizes the %s for mobile with %s %s', async (part, property, value) => {
    const element = await resultPart(part);

    expect(styleRuleFor(element)?.getPropertyValue(property)).toBe(value);
  });

  it.each<[ResultPart, string, string, string]>([
    ['heading', 'min-width:768px', 'font-size', '1.875rem'],
    ['heading', 'min-width:768px', 'font-weight', '600'],
    ['heading', 'min-width:768px', 'line-height', 'normal'],
    ['body', 'min-width:480px', 'font-size', '1rem'],
    ['body', 'min-width:480px', 'line-height', '1.625rem'],
    ['action', 'min-width:768px', 'height', '3.875rem'],
    ['action', 'min-width:768px', 'font-size', '1.125rem'],
    ['action', 'min-width:768px', 'font-weight', '600'],
    ['action', 'min-width:768px', 'line-height', 'normal'],
  ])('restores the %s at %s with %s %s', async (part, mediaFragment, property, value) => {
    const element = await resultPart(part);

    expect(mediaStyleRuleFor(element, mediaFragment)?.getPropertyValue(property)).toBe(value);
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

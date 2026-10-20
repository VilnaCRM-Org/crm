import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { paletteColors } from '@/styles/colors';
import RegSuccessView from '@auth/components/form-section/auth-forms/registration-success-view';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

const TITLE = 'Вітаємо!';
const DESCRIPTION = 'Ви успішно увійшли';
const BUTTON = 'Продовжити';

function view(description: string): JSX.Element {
  return (
    <RegSuccessView
      isClosing={false}
      onBack={jest.fn()}
      title={TITLE}
      description={description}
      buttonLabel={BUTTON}
    />
  );
}

function renderSuccessView(isClosing = false): { onBack: jest.Mock; container: HTMLElement } {
  const onBack = jest.fn();
  const { container } = render(
    <RegSuccessView
      isClosing={isClosing}
      onBack={onBack}
      title={TITLE}
      description={DESCRIPTION}
      buttonLabel={BUTTON}
    />
  );

  return { onBack, container };
}

describe('RegistrationSuccessView', () => {
  it('hides the decorative confetti and gears from assistive technology', () => {
    renderSuccessView();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('focuses the heading itself, out of the tab order', () => {
    renderSuccessView();

    const heading = screen.getByRole('heading', { level: 2, name: TITLE });
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('announces the description in a status region filled after mount', async () => {
    renderSuccessView();

    expect(await screen.findByRole('status')).toHaveTextContent(DESCRIPTION);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('rings the focused heading with the primary focus outline', () => {
    renderSuccessView();

    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toHaveStyle({
      outline: `2px solid ${paletteColors.primary.main}`,
      outlineOffset: '2px',
    });
  });

  it('paints the status region empty before the mount effect fills it', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(view(DESCRIPTION));

    const firstPaint = within(host).getByRole('status').textContent;

    expect(firstPaint).toBe('');
  });

  it('replaces the announced description when it changes', async () => {
    const { rerender } = render(view(DESCRIPTION));
    expect(await screen.findByRole('status')).toHaveTextContent(DESCRIPTION);

    rerender(view('Ви успішно зареєструвалися'));

    expect(await screen.findByRole('status')).toHaveTextContent(/^Ви успішно зареєструвалися$/);
  });

  it('runs the action from its labelled button', async () => {
    const { onBack } = renderSuccessView();

    await userEvent.click(screen.getByRole('button', { name: BUTTON }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('disables the button only while the notification is closing', () => {
    renderSuccessView(true);

    expect(screen.getByRole('button', { name: BUTTON })).toBeDisabled();
  });
});

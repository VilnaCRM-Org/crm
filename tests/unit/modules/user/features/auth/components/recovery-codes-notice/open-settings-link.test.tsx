import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import OpenSettingsLink from '@auth/components/recovery-codes-notice/open-settings-link';
import createCodesNoticeLocaleI18n from '@tests/unit/utils/create-codes-notice-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

function SettingsPage(): JSX.Element {
  const { state } = useLocation();
  return <p>settings page {JSON.stringify(state)}</p>;
}

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={createCodesNoticeLocaleI18n('uk')}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<main>{children}</main>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
}

const renderLink = (onDismiss: () => void = jest.fn()): ReturnType<typeof render> =>
  render(<OpenSettingsLink onDismiss={onDismiss} />, { wrapper: Wrapper });

const linkOf = (): HTMLElement => screen.getByRole('link', { name: 'Відкрити налаштування' });

const clickAndReadPrevented = (link: HTMLElement, init: MouseEventInit = {}): boolean => {
  let prevented = false;
  const record = (event: Event): void => {
    prevented = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener('click', record);
  fireEvent.click(link, init);
  window.removeEventListener('click', record);
  return prevented;
};

describe('OpenSettingsLink', () => {
  it('is a real link to /settings', () => {
    renderLink();

    expect(linkOf()).toHaveAttribute('href', '/settings');
  });

  it('routes a plain click client-side with the arrival state, then dismisses', () => {
    const onDismiss = jest.fn();
    renderLink(onDismiss);

    expect(clickAndReadPrevented(linkOf())).toBe(true);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByText('settings page {"focusMain":true}')).toBeInTheDocument();
  });

  it('opens /settings with Enter, carrying the arrival state, and dismisses', async () => {
    const onDismiss = jest.fn();
    renderLink(onDismiss);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByText('settings page {"focusMain":true}')).toBeInTheDocument();
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Meta', { metaKey: true }],
    ['Shift', { shiftKey: true }],
  ])('leaves a %s-click to the browser and keeps the notice', (_name, init) => {
    const onDismiss = jest.fn();
    renderLink(onDismiss);

    expect(clickAndReadPrevented(linkOf(), init)).toBe(false);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.queryByText(/settings page/)).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const view = renderLink();

    await expectNoA11yViolations(view.container);
  });
});

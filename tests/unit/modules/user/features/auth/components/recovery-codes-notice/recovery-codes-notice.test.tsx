import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';

import RecoveryCodesNotice from '@auth/components/recovery-codes-notice';
import createCodesNoticeLocaleI18n from '@tests/unit/utils/create-codes-notice-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

type Language = 'uk' | 'en';

const wrapperFor = (language: Language): ((props: { children: ReactNode }) => JSX.Element) => {
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <I18nextProvider i18n={createCodesNoticeLocaleI18n(language)}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<main>{children}</main>} />
            <Route path="/settings" element={<p>settings page</p>} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );
  }
  return Wrapper;
};

const renderNotice = (
  count: number,
  language: Language = 'uk',
  onDismiss: () => void = jest.fn()
): ReturnType<typeof render> =>
  render(<RecoveryCodesNotice count={count} onDismiss={onDismiss} />, {
    wrapper: wrapperFor(language),
  });

describe('RecoveryCodesNotice', () => {
  it.each([
    [1, 'uk', 'Залишився 1 резервний код. Створіть нові коди в налаштуваннях.'],
    [2, 'uk', 'Залишилося 2 резервні коди. Створіть нові коди в налаштуваннях.'],
    [5, 'uk', 'Залишилося 5 резервних кодів. Створіть нові коди в налаштуваннях.'],
    [0, 'uk', 'Резервні коди закінчилися. Створіть нові коди зараз.'],
    [1, 'en', '1 recovery code left. Generate new codes in settings.'],
    [2, 'en', '2 recovery codes left. Generate new codes in settings.'],
    [0, 'en', 'You are out of recovery codes. Generate new codes now.'],
  ] as const)('says, for %i code(s) in %s, "%s"', (count, language, text) => {
    renderNotice(count, language);

    expect(screen.getByRole('status')).toHaveTextContent(text);
  });

  it('mounts its status region empty and fills it in an effect', () => {
    const view = renderToString(
      <I18nextProvider i18n={createCodesNoticeLocaleI18n('uk')}>
        <MemoryRouter>
          <RecoveryCodesNotice count={1} onDismiss={jest.fn()} />
        </MemoryRouter>
      </I18nextProvider>
    );

    expect(view).toMatch(/role="status"[^>]*><\/div>/);
    expect(view).not.toContain('Залишився');
  });

  it('is a polite atomic status region and takes no focus', () => {
    renderNotice(1);

    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
    expect(document.body).toHaveFocus();
  });

  it('updates the text when the count changes', () => {
    const { rerender } = renderNotice(2);

    rerender(<RecoveryCodesNotice count={1} onDismiss={jest.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Залишився 1 резервний код.');
  });

  it('links to /settings client-side and dismisses', async () => {
    const onDismiss = jest.fn();
    renderNotice(1, 'uk', onDismiss);
    const link = screen.getByRole('link', { name: 'Відкрити налаштування' });

    expect(link).toHaveAttribute('href', '/settings');
    await userEvent.click(link);

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByText('settings page')).toBeInTheDocument();
  });

  it('dismisses with the outlined close button', async () => {
    const onDismiss = jest.fn();
    renderNotice(1, 'uk', onDismiss);
    const button = screen.getByRole('button', { name: 'Закрити сповіщення' });

    await userEvent.click(button);

    expect(button).toHaveClass('MuiButton-outlined');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('reaches the link and the button in that order with Tab', async () => {
    renderNotice(1);

    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Відкрити налаштування' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Закрити сповіщення' })).toHaveFocus();
  });

  it('names the controls in English', () => {
    renderNotice(1, 'en');

    expect(screen.getByRole('link', { name: 'Open settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss notice' })).toBeInTheDocument();
  });

  it.each([
    ['one', 1, 'uk'],
    ['few', 2, 'uk'],
    ['many', 5, 'uk'],
    ['none', 0, 'uk'],
    ['one', 1, 'en'],
    ['other', 2, 'en'],
    ['none', 0, 'en'],
  ] as const)(
    'has no accessibility violation for the %s variant in %s',
    async (_form, count, language) => {
      const utils = renderNotice(count, language);

      await expectNoA11yViolations(utils.container);
    }
  );
});

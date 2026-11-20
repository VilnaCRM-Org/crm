import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';

import { clearConfigBlock } from '@tests/utils/config-block';

const SEED_TEXTS = {
  uk: [
    'Ви успішно змінили пароль',
    'Ми надіслали посилання для підтвердження на нову адресу',
    'Зміни збережено',
  ],
  en: [
    'You have changed your password',
    'We sent a confirmation link to the new address',
    'Changes saved',
  ],
} as const;

const HEADINGS = { uk: 'Сповіщення', en: 'Notifications' } as const;

interface ActEnvironment {
  IS_REACT_ACT_ENVIRONMENT?: boolean | undefined;
}

const actEnvironment = globalThis as ActEnvironment;

const expectIsolatedCatalog = async (locale: 'uk' | 'en'): Promise<void> => {
  await jest.isolateModulesAsync(async () => {
    const { default: i18n } = await import('@/i18n');
    await i18n.changeLanguage(locale);

    expect(i18n.exists('notification_center.history.heading')).toBe(false);

    const { default: BellNotifications } =
      await import('@/modules/user/features/notifications/components/bell-notifications');
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { MemoryRouter } = await import('react-router');

    expect(i18n.t('notification_center.history.heading')).toBe(HEADINGS[locale]);
    expect(i18n.exists('settings.toasts.saved')).toBe(false);

    const container = document.body.appendChild(document.createElement('div'));
    const root = createRoot(container);
    root.render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(BellNotifications, {
          layout: 'desktop',
          revision: 0,
          onChunkFailure: jest.fn(),
        })
      )
    );
    const bell = await screen.findByRole('button', { expanded: false });
    bell.click();
    const hostId = bell.getAttribute('aria-controls');
    const host = screen
      .getAllByRole('generic', { hidden: true })
      .find((node) => node.id === hostId);
    if (host === undefined) throw new Error('no history host');

    expect(await within(host).findByRole('heading', { name: HEADINGS[locale] })).toBeVisible();
    const rows = within(host).getAllByRole('listitem');

    expect(
      rows.map((row) => SEED_TEXTS[locale].find((text) => row.textContent?.includes(text)))
    ).toEqual(SEED_TEXTS[locale]);
    expect(host).not.toHaveTextContent('notification_center.');
    expect(host).not.toHaveTextContent('settings.');
    root.unmount();
    container.remove();
  });
};

describe('BellNotifications registers its catalog at module evaluation', () => {
  const previous = actEnvironment.IS_REACT_ACT_ENVIRONMENT;

  beforeEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  });

  afterEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = previous;
    clearConfigBlock();
  });

  it.each(['uk', 'en'] as const)(
    'translates the panel and the seed rows in %s with only the eager catalog loaded',
    async (locale) => {
      await expectIsolatedCatalog(locale);
    }
  );
});

import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import SocialNetworks from '@/modules/user/features/settings/components/social-networks';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const PROVIDERS = ['Google', 'Facebook', 'GitHub', 'Twitter'];

const renderCard = (language: 'uk' | 'en' = 'uk'): void => {
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <I18nextProvider i18n={createSettingsLocaleI18n(language, [])}>
        <main>{children}</main>
      </I18nextProvider>
    );
  }

  render(<SocialNetworks />, { wrapper: Wrapper });
};

describe('SocialNetworks', () => {
  it('names the provider list after its level-2 heading, adding no landmark', () => {
    renderCard();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Соціальні мережі');
    expect(screen.getByRole('list', { name: 'Соціальні мережі' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('lists the four providers in the design order, each saying linking is unavailable', () => {
    renderCard();

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(items.map((item) => item.textContent)).toEqual(
      PROVIDERS.map((provider) => `${provider}, підключення поки недоступне`)
    );
  });

  it('speaks the heading and the status in English', () => {
    renderCard('en');

    expect(screen.getByRole('list', { name: 'Social networks' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent(
      'Google, linking not available yet'
    );
  });

  it('offers nothing to press, because no provider can be linked yet', () => {
    renderCard();

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('has no axe violations', async () => {
    renderCard();

    await expectNoA11yViolations(screen.getByRole('main'));
  });
});

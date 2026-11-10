import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import ComingSoonCard from '@/components/coming-soon/coming-soon-card';
import comingSoonEn from '@/components/coming-soon/i18n/en.json';
import createComingSoonLocaleI18n from '@tests/unit/utils/create-coming-soon-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const renderCard = (headingKey: string): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={createComingSoonLocaleI18n('en', ['en', 'uk'])}>
      <MemoryRouter initialEntries={['/boards']}>
        <main>
          <ComingSoonCard headingKey={headingKey} />
        </main>
      </MemoryRouter>
    </I18nextProvider>
  );

describe('ComingSoonCard', () => {
  it('names the section in the only h1, then the message and the home link', () => {
    renderCard('coming_soon.sections.billing');

    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: comingSoonEn.coming_soon.sections.billing })
    ).toBeInTheDocument();
    expect(screen.getByText(comingSoonEn.coming_soon.message)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: comingSoonEn.coming_soon.home_link })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('has no axe violation outside the allowlist', async () => {
    const { container } = renderCard('coming_soon.sections.boards');

    await expectNoA11yViolations(container);
  });
});

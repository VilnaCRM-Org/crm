import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import ProfileHeader from '@/modules/user/features/settings/components/profile-header';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>
    <main>{children}</main>
  </I18nextProvider>
);

const monogramOf = (name: string): HTMLElement | undefined =>
  screen.queryAllByText(name, { ignore: 'p' }).at(0);

describe('ProfileHeader', () => {
  it.each([
    ['Олена Петренко', 'ОП'],
    ['Admin', 'A'],
    ['Петренко Олена Іванівна', 'ОП'],
    ['  олена   петренко  ', 'ОП'],
    ['😀 smile', '😀S'],
    ['Анна-Марія\tКоваль', 'АК'],
  ])('shows the monogram of "%s" as %s', (name, letters) => {
    render(<ProfileHeader fullName={name} />, { wrapper });

    expect(monogramOf(letters)).toBeInTheDocument();
  });

  it.each([
    ['Маслова Евгения Олеговна', 'Евгения Маслова'],
    ['Петренко Олена Іванівна Друга', 'Олена Петренко'],
    ['  Петренко\tОлена   Іванівна ', 'Олена Петренко'],
    ['Олена Петренко', 'Олена Петренко'],
    ['Admin', 'Admin'],
  ])('greets the full name "%s" by first name and surname as "%s"', (name, shown) => {
    render(<ProfileHeader fullName={name} />, { wrapper });

    expect(screen.getByText(shown, { selector: 'p', normalizer: (text) => text })).toBeVisible();
  });

  it('upper-cases a lower-case name', () => {
    render(<ProfileHeader fullName="анна коваль" />, { wrapper });

    expect(monogramOf('АК')).toBeInTheDocument();
  });

  it('shows a decorative person glyph instead of letters for an empty name', () => {
    const { container } = render(<ProfileHeader fullName="" />, { wrapper });

    expect(container.innerHTML).toContain('data-testid="PersonOutlinedIcon"');
    expect(container.innerHTML).toContain('aria-hidden="true"');
  });

  it('shows a glyph for a name that is only whitespace', () => {
    const { container } = render(<ProfileHeader fullName="   " />, { wrapper });

    expect(container.innerHTML).toContain('data-testid="PersonOutlinedIcon"');
  });

  it('hides the monogram and exposes the greeting and name as plain text', () => {
    render(<ProfileHeader fullName="Олена Петренко" />, { wrapper });

    expect(screen.getByText('Вітаємо!')).toBeVisible();
    expect(screen.getByText('Олена Петренко')).toBeVisible();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('ОП')).toHaveAttribute('aria-hidden', 'true');
  });

  it('greets in English when the language is English', async () => {
    const i18n = createSettingsLocaleI18n('uk', ['en']);
    await i18n.changeLanguage('en');
    render(
      <I18nextProvider i18n={i18n}>
        <ProfileHeader fullName="Olena Petrenko" />
      </I18nextProvider>
    );

    expect(screen.getByText('Welcome!')).toBeInTheDocument();
  });

  it('colours the greeting, the name and the monogram from the palette', () => {
    render(<ProfileHeader fullName="Олена Петренко" />, { wrapper });

    expect(screen.getByText('Вітаємо!')).toHaveStyle({ color: '#57595B' });
    expect(screen.getByText('Олена Петренко')).toHaveStyle({ color: '#1A1C1E' });
  });

  it('renders no photo, upload control or file input until user-service stores avatars', () => {
    const { container } = render(<ProfileHeader fullName="Олена Петренко" />, { wrapper });

    expect(container.innerHTML).not.toMatch(/<img|<input|type="file"|<button/);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('draws the pencil badge as decoration inside the hidden monogram', () => {
    render(<ProfileHeader fullName="Олена Петренко" />, { wrapper });

    const monogram = screen.getByText('ОП');

    expect(monogram).toHaveAttribute('aria-hidden', 'true');
    expect(monogram.innerHTML).toMatch(/^ОП<div[^>]*><svg/);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it.each(['Олена Петренко', ''])('has no axe violation for the name "%s"', async (name) => {
    const view = render(<ProfileHeader fullName={name} />, { wrapper });

    await expectNoA11yViolations(view.container);
  });
});

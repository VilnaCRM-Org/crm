import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import { SocialNetworksCard } from '@/modules/user/features/settings/components/social-networks';
import type { SocialLinks } from '@/modules/user/features/settings/types/social-link';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

import buildSocialLinks from './social-links-fixture';

type SocialTileStyle = ComponentProps<typeof SocialNetworksCard>['tileStyle'];

const LINKED = { items: ['google', 'github'] } as const;

const TILE_STYLES: readonly SocialTileStyle[] = ['tinted', 'badge', 'labelled'];

const card = (
  links: SocialLinks,
  language: 'uk' | 'en' = 'uk',
  tileStyle: SocialTileStyle = 'tinted'
): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n(language, [])}>
    <main>
      <SocialNetworksCard links={links} tileStyle={tileStyle} />
    </main>
  </I18nextProvider>
);

const bin = (provider = 'Google'): HTMLElement =>
  screen.getByRole('button', { name: `Відключити ${provider}` });

const row = (provider = 'Google'): HTMLElement =>
  screen.getByRole('group', { name: `Відключити ${provider}?` });

const inRow = (name: string, provider?: string): HTMLElement =>
  within(row(provider)).getByRole('button', { name });

const open = async (
  overrides: Partial<SocialLinks> = {},
  tileStyle: SocialTileStyle = 'tinted'
): Promise<SocialLinks> => {
  const links = buildSocialLinks({ linked: LINKED, ...overrides });
  render(card(links, 'uk', tileStyle));
  await userEvent.click(bin());
  return links;
};

describe('unlink confirmation', () => {
  it('shows nothing until a bin is pressed', () => {
    render(card(buildSocialLinks({ linked: LINKED })));

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('asks by name, with Cancel first and focused, and unlinks nothing yet', async () => {
    const links = await open();
    const buttons = within(row()).getAllByRole('button');

    expect(buttons.map((each) => each.textContent)).toEqual(['Скасувати', 'Відключити']);
    expect(buttons[0]).toHaveFocus();
    buttons.forEach((each) => expect(each).toHaveAccessibleDescription('Відключити Google?'));
    expect(buttons[1]).toHaveAttribute('aria-disabled', 'false');
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('asks in English', async () => {
    render(card(buildSocialLinks({ linked: LINKED }), 'en'));

    await userEvent.click(screen.getByRole('button', { name: 'Unlink Google' }));

    const group = screen.getByRole('group', { name: 'Unlink Google?' });
    expect(
      within(group)
        .getAllByRole('button')
        .map((each) => each.textContent)
    ).toEqual(['Cancel', 'Unlink']);
  });

  it('focuses Cancel again when the same bin is pressed again', async () => {
    await open();

    await userEvent.click(bin());

    expect(inRow('Скасувати')).toHaveFocus();
  });

  it('asks about one provider at a time', async () => {
    await open();

    await userEvent.click(bin('GitHub'));

    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(inRow('Скасувати', 'GitHub')).toHaveFocus();
  });

  it('stays open and sends nothing while something else is busy', async () => {
    const links = buildSocialLinks({ linked: LINKED });
    const { rerender } = render(card(links));
    await userEvent.click(bin());
    const busy = buildSocialLinks({ linked: LINKED, busy: true });
    rerender(card(busy));

    expect(inRow('Відключити')).toHaveAttribute('aria-disabled', 'true');
    expect(inRow('Відключити')).toBeEnabled();
    await userEvent.click(inRow('Відключити'));

    expect(row()).toBeInTheDocument();
    expect(busy.unlink).not.toHaveBeenCalled();
    await userEvent.click(inRow('Скасувати'));
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('closes when another account is linked', async () => {
    const links = await open();

    await userEvent.click(screen.getByRole('button', { name: /^Twitter: / }));

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(links.link).toHaveBeenCalledTimes(1);
  });

  it('draws the row and its buttons in their styles', async () => {
    await open();

    expect(row()).toHaveStyle({ marginTop: '1rem' });
    expect(inRow('Скасувати')).toHaveStyle({ minHeight: '2.75rem' });
    expect(inRow('Відключити')).toHaveStyle({ minHeight: '2.75rem' });
  });

  it.each([false, true])('has no axe violations while busy is %s', async (busy) => {
    const { rerender } = render(card(buildSocialLinks({ linked: LINKED })));
    await userEvent.click(bin());
    rerender(card(buildSocialLinks({ linked: LINKED, busy })));

    await expectNoA11yViolations(screen.getByRole('main'));
  });
});

describe.each(TILE_STYLES)('unlink confirmation from a %s tile', (tileStyle) => {
  it('opens from the unlink control and focuses Cancel, sending nothing yet', async () => {
    const links = await open({}, tileStyle);

    expect(inRow('Скасувати')).toHaveFocus();
    expect(screen.getAllByRole('group')).toEqual([row()]);
    expect(links.unlink).not.toHaveBeenCalled();
    expect(links.link).not.toHaveBeenCalled();
  });

  it('asks in English from the unlink control, focusing Cancel', async () => {
    const links = buildSocialLinks({ linked: LINKED });
    render(card(links, 'en', tileStyle));

    await userEvent.click(screen.getByRole('button', { name: 'Unlink Google' }));

    const group = screen.getByRole('group', { name: 'Unlink Google?' });
    expect(within(group).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(
      within(group)
        .getAllByRole('button')
        .map((each) => each.textContent)
    ).toEqual(['Cancel', 'Unlink']);
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('cancels with the button and returns to the unlink control', async () => {
    const links = await open({}, tileStyle);

    await userEvent.click(inRow('Скасувати'));

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(bin()).toHaveFocus();
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('cancels with Escape inside the row only, returning to the unlink control', async () => {
    const links = await open({}, tileStyle);

    fireEvent.keyDown(bin('GitHub'), { key: 'Escape' });
    fireEvent.keyDown(inRow('Відключити'), { key: 'a' });
    expect(row()).toBeInTheDocument();
    fireEvent.keyDown(inRow('Відключити'), { key: 'Escape' });

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(bin()).toHaveFocus();
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('unlinks the named provider once it is confirmed, from the unlink control', async () => {
    const links = await open({}, tileStyle);

    await userEvent.click(inRow('Відключити'));

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(bin()).toHaveFocus();
    expect(links.unlink).toHaveBeenCalledTimes(1);
    expect(links.unlink).toHaveBeenCalledWith({
      id: 'google',
      label: 'Google',
      controlRef: { current: bin() },
    });
  });

  it('has no axe violations while the row is open', async () => {
    await open({}, tileStyle);

    await expectNoA11yViolations(screen.getByRole('main'));
  });
});

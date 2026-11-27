import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import type { ComponentProps, JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import { SocialNetworksCard } from '@/modules/user/features/settings/components/social-networks';
import type { SocialLinks } from '@/modules/user/features/settings/types/social-link/social-links';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import {
  containerStyleRuleFor,
  styleRulesFor,
  winningMediaValueFor,
} from '@tests/unit/utils/emotion-style-rules';

import buildSocialLinks from './social-links-fixture';

type SocialTileStyle = ComponentProps<typeof SocialNetworksCard>['tileStyle'];

const DISABLED = '[aria-disabled="true"]';
const FORCED = 'forced-colors:active';
const TEXT_MODE = 'min-width:16rem';
const UNLINK_GITHUB = 'Відключити GitHub';

const card = (
  tileStyle: SocialTileStyle,
  overrides: Partial<SocialLinks> = {},
  language: 'uk' | 'en' = 'uk'
): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n(language, [])}>
    <SocialNetworksCard
      links={buildSocialLinks({ linked: { items: ['github'] }, ...overrides })}
      tileStyle={tileStyle}
    />
  </I18nextProvider>
);

const unlink = (): HTMLElement => screen.getByRole('button', { name: UNLINK_GITHUB });

const elementWhere = (matches: (element: Element) => boolean): HTMLElement =>
  screen.getByText((_text, element) => element !== null && matches(element));

const tileShowing = (text: string): HTMLElement =>
  elementWhere((element) => element.tagName === 'DIV' && element.textContent === text);

const declared = (element: Element, property: string, suffix = ''): string | undefined =>
  styleRulesFor(element, suffix)
    .map((style) => style.getPropertyValue(property))
    .filter((value) => value !== '')
    .at(-1);

const forced = (element: Element, property: string, suffix = ''): string | undefined =>
  winningMediaValueFor(element, FORCED, property, suffix);

describe('the badge linked tile', () => {
  const badge = (): HTMLElement => screen.getByRole('img', { name: 'Підключено', hidden: true });

  const hiddenSlot = (): HTMLElement =>
    elementWhere(
      (element) => element.tagName === 'SPAN' && element.getAttribute('aria-hidden') === 'true'
    );

  it('draws the neutral social-button tile, flush to the start below 768 px', () => {
    render(card('badge'));
    const tile = tileShowing('GitHub, підключено');

    expect(tile).toHaveStyle({
      backgroundColor: '#FFFFFF',
      minHeight: '3.625rem',
      justifyContent: 'flex-start',
      gap: '0.375rem',
    });
    expect(declared(tile, 'border')).toBe('1px solid #E1E7EA');
    expect(within(tile).getByRole('button')).toBe(unlink());
  });

  it('marks the state with the static toolkit badge, between the label and the bin', () => {
    render(card('badge'));
    const slot = hiddenSlot();

    expect(within(slot).getByRole('img', { name: 'Підключено', hidden: true })).toBe(badge());
    expect(slot).toHaveStyle({ display: 'inline-flex' });
    expect(within(slot).queryByRole('button', { hidden: true })).not.toBeInTheDocument();
    expect(slot.compareDocumentPosition(unlink())).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText('GitHub').compareDocumentPosition(slot)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('hides the badge, so the state is spoken once by the hidden status', () => {
    render(card('badge'));

    expect(hiddenSlot()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img', { name: 'Підключено' })).not.toBeInTheDocument();
    expect(screen.getByText(', підключено')).toBeInTheDocument();
  });

  it('names the badge in English', () => {
    render(card('badge', {}, 'en'));

    expect(screen.getByRole('img', { name: 'Linked', hidden: true })).toBeInTheDocument();
  });

  it('paints the badge in system colours when colours are forced', () => {
    render(card('badge'));

    expect(forced(badge(), 'background-color')).toBe('Canvas');
    expect(forced(badge(), 'border-color')).toBe('CanvasText');
    expect(forced(badge(), 'color')).toBe('CanvasText');
  });

  it('paints the bin in the toolkit danger lane, keeping its 44 px target', () => {
    render(card('badge'));

    expect(unlink()).toHaveStyle({
      color: '#DC3939',
      width: '2.75rem',
      height: '2.75rem',
      padding: '0.125rem',
      borderRadius: '0.625rem',
    });
    expect(declared(unlink(), 'color', ':hover:not([aria-disabled="true"])')).toBe('#DF7878');
    expect(declared(unlink(), 'background-color', ':active:not([aria-disabled="true"])')).toBe(
      'rgba(220, 57, 57, 0.1)'
    );
    expect(declared(unlink(), 'color', DISABLED)).toBe('#D0D4D8');
    expect(forced(unlink(), 'color')).toBe('ButtonText');
    expect(forced(unlink(), 'color', DISABLED)).toBe('GrayText');
  });
});

describe('the labelled linked tile', () => {
  const pillText = (): HTMLElement => within(unlink()).getByText('Відключити');

  const pillGlyph = (): HTMLElement =>
    within(unlink()).getByText((_text, element) => element?.tagName === 'svg');

  it('outlines the tile in 2px brand blue at every width, as an inline-size container', () => {
    render(card('labelled'));
    const tile = tileShowing('GitHub, підключеноВідключити');

    expect(tile).toHaveStyle({ backgroundColor: '#FFFFFF', justifyContent: 'space-between' });
    expect(declared(tile, 'border-color')).toBe('#1EAEFF');
    expect(declared(tile, 'border-width')).toBe('2px');
    expect(declared(tile, 'container-type')).toBe('inline-size');
    expect(within(tile).getByRole('button')).toBe(unlink());
  });

  it('unlinks through the toolkit outlined small pill, its word first in its name', () => {
    render(card('labelled'));

    expect(unlink()).toHaveClass('MuiButton-outlined', 'MuiButton-sizeSmall');
    expect(unlink()).toHaveTextContent('Відключити');
    expect(unlink()).not.toHaveAttribute('name');
    expect(pillText()).toHaveTextContent(/^Відключити$/);
    expect(unlink()).toHaveAccessibleName(/^Відключити GitHub$/);
  });

  it('says Unlink on the English pill', () => {
    render(card('labelled', {}, 'en'));

    expect(screen.getByRole('button', { name: 'Unlink GitHub' })).toHaveTextContent('Unlink');
  });

  it('folds to a 44 px bin circle while its tile is narrow', () => {
    render(card('labelled'));

    expect(unlink()).toHaveStyle({
      width: '2.75rem',
      height: '2.75rem',
      minWidth: '2.75rem',
      minHeight: '2.75rem',
      padding: '0',
      borderRadius: '50%',
    });
    expect(pillText()).toHaveStyle({ display: 'none' });
    expect(pillGlyph()).not.toHaveStyle({ display: 'none' });
    expect(pillGlyph()).toHaveStyle({ width: '1.5rem', height: '1.5rem' });
  });

  it("shows the word and drops the glyph once its tile's content box is 16rem wide", () => {
    render(card('labelled'));
    const pill = containerStyleRuleFor(unlink(), TEXT_MODE);

    expect(pill?.getPropertyValue('width')).toBe('auto');
    expect(pill?.getPropertyValue('padding')).toBe('0.75rem 1.4375rem');
    expect(pill?.getPropertyValue('border-radius')).toBe('3.563rem');
    expect(containerStyleRuleFor(pillText(), TEXT_MODE)?.getPropertyValue('display')).toBe(
      'inline'
    );
    expect(containerStyleRuleFor(pillGlyph(), TEXT_MODE)?.getPropertyValue('display')).toBe('none');
  });

  it('greys the busy pill out, on hover too, and keeps the card focus ring', () => {
    render(card('labelled', { busy: true }));

    [DISABLED, `${DISABLED}:hover`].forEach((suffix) => {
      expect(declared(unlink(), 'background-color', suffix)).toBe('#E1E7EA');
      expect(declared(unlink(), 'color', suffix)).toBe('#FFFFFF');
      expect(declared(unlink(), 'border-color', suffix)).toBe('transparent');
      expect(declared(unlink(), 'cursor', suffix)).toBe('default');
    });
    expect(declared(unlink(), 'outline', ':focus-visible')).toBe('2px solid #1A1C1E');
    expect(declared(unlink(), 'box-shadow', ':focus-visible')).toBe('none');
  });

  it('inks the pill in system colours when colours are forced', () => {
    render(card('labelled'));

    expect(forced(unlink(), 'color')).toBe('ButtonText');
    expect(forced(unlink(), 'border-color')).toBe('ButtonText');
  });

  it('keeps the busy pill GrayText when colours are forced, on hover too', () => {
    render(card('labelled', { busy: true }));

    [DISABLED, `${DISABLED}:hover`].forEach((suffix) => {
      expect(forced(unlink(), 'color', suffix)).toBe('GrayText');
      expect(forced(unlink(), 'border-color', suffix)).toBe('GrayText');
    });
  });
});

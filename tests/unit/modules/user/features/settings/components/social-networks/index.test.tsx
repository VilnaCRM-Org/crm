import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import SocialNetworks, {
  SocialNetworksCard,
} from '@/modules/user/features/settings/components/social-networks';
import type {
  SocialLinkFocusReturn,
  SocialLinks,
} from '@/modules/user/features/settings/types/social-link/social-links';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import {
  doubledClass,
  mediaStyleRuleFor,
  styleRuleFor,
  styleRulesFor,
} from '@tests/unit/utils/emotion-style-rules';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

import buildSocialLinks from './social-links-fixture';

const mockUseSocialLinks = jest.fn();

jest.mock('@/modules/user/features/settings/hooks/use-social-links', () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockUseSocialLinks(...args),
}));

type SocialTileStyle = ComponentProps<typeof SocialNetworksCard>['tileStyle'];

const PROVIDERS = ['Google', 'Facebook', 'GitHub', 'Twitter'];

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

const RETURN_FOCUS: SocialLinkFocusReturn = { current: null };

const page = (tileStyle?: SocialTileStyle): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>
    {tileStyle === undefined ? (
      <SocialNetworks returnFocusRef={RETURN_FOCUS} />
    ) : (
      <SocialNetworks returnFocusRef={RETURN_FOCUS} tileStyle={tileStyle} />
    )}
  </I18nextProvider>
);

const items = (): HTMLElement[] => within(screen.getByRole('list')).getAllByRole('listitem');

const tileShowing = (text: string): HTMLElement =>
  screen.getByText((_text, element) => element?.tagName === 'DIV' && element.textContent === text);

const button = (name: string): HTMLElement => screen.getByRole('button', { name });

const LINK_GOOGLE = 'Google: підключити обліковий запис (відкриється нове вікно)';
const LOAD_FAILED = 'Не вдалося завантажити підключені облікові записи';
const DISABLED = '[aria-disabled="true"]';
const ENABLED_HOVER = `:hover:not(${DISABLED})`;
const FOCUS_OUTLINE = '2px solid #1A1C1E';

const lastDeclared = (element: Element, suffix: string, property: string): string | undefined =>
  styleRulesFor(element, suffix)
    .map((style) => style.getPropertyValue(property))
    .filter((value) => value !== '')
    .at(-1);

describe('SocialNetworks', () => {
  it('renders the card from the links hook, handing it the page return target', () => {
    mockUseSocialLinks.mockReturnValue(buildSocialLinks());

    render(page());

    expect(mockUseSocialLinks.mock.lastCall).toEqual([RETURN_FOCUS]);
    expect(mockUseSocialLinks.mock.lastCall?.[0]).toBe(RETURN_FOCUS);
    expect(screen.getByRole('list', { name: 'Соціальні мережі' })).toBeInTheDocument();
  });

  it('draws a linked tile tinted when it is given no tile style', () => {
    mockUseSocialLinks.mockReturnValue(buildSocialLinks({ linked: { items: ['github'] } }));

    render(page());

    const unlink = button('Відключити GitHub');
    expect(tileShowing('GitHub, підключено')).toHaveStyle({ backgroundColor: '#E8F7FF' });
    expect(unlink).toHaveStyle({ color: '#1EAEFF' });
    expect(unlink).not.toHaveClass('MuiButton-root');
    expect(screen.queryByRole('img', { name: 'Підключено', hidden: true })).not.toBeInTheDocument();
  });

  it('forwards the badge tile style it is given', () => {
    mockUseSocialLinks.mockReturnValue(buildSocialLinks({ linked: { items: ['github'] } }));

    render(page('badge'));

    expect(screen.getByRole('img', { name: 'Підключено', hidden: true })).toBeInTheDocument();
  });

  it('forwards the labelled tile style it is given', () => {
    mockUseSocialLinks.mockReturnValue(buildSocialLinks({ linked: { items: ['github'] } }));

    render(page('labelled'));

    expect(button('Відключити GitHub')).toHaveClass('MuiButton-outlined');
  });
});

describe('SocialNetworksCard', () => {
  it('names the provider list after its level-2 heading, adding no landmark', () => {
    render(card(buildSocialLinks()));

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Соціальні мережі');
    expect(screen.getByRole('list', { name: 'Соціальні мережі' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it.each(['loading', 'failed', 'retrying'] as const)(
    'lists the providers in the design order with nothing to link while %s',
    (status) => {
      render(card(buildSocialLinks({ status })));

      expect(items().map((item) => item.textContent)).toEqual(
        PROVIDERS.map((provider) => `${provider}, підключення поки недоступне`)
      );
      expect(within(screen.getByRole('list')).queryAllByRole('button')).toHaveLength(0);
    }
  );

  it('speaks the unavailable state in English', () => {
    render(card(buildSocialLinks({ status: 'loading' }), 'en'));

    expect(items()[0]).toHaveTextContent('Google, linking not available yet');
  });

  it('offers every provider that is not linked by name', () => {
    render(card(buildSocialLinks(), 'en'));

    expect(screen.getAllByRole('button').map((each) => each.getAttribute('aria-label'))).toEqual(
      PROVIDERS.map((provider) => `${provider}: connect account (opens a new window)`)
    );
    expect(items().map((item) => item.textContent)).toEqual(PROVIDERS);
  });

  it('links with the tile and its live control, focusing the control first', () => {
    const order: string[] = [];
    const link = jest.fn(async () => {
      order.push('link');
    });
    const links = buildSocialLinks({ link });
    render(card(links));
    const control = button(LINK_GOOGLE);

    control.addEventListener('focus', () => order.push('focus'));

    fireEvent.click(control);

    expect(order).toEqual(['focus', 'link']);
    expect(links.link).toHaveBeenCalledTimes(1);
    expect(links.link).toHaveBeenCalledWith({
      id: 'google',
      label: 'Google',
      controlRef: { current: control },
    });
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('draws the link, the linked and the inert tile, each in its own style', () => {
    const { rerender } = render(card(buildSocialLinks({ linked: { items: ['github'] } })));
    const linked = tileShowing('GitHub, підключено');

    expect(button(LINK_GOOGLE)).toHaveStyle({ minHeight: '3.625rem', cursor: 'pointer' });
    expect(linked).toHaveStyle({ minHeight: '3.625rem', backgroundColor: '#E8F7FF' });

    rerender(card(buildSocialLinks({ status: 'loading' })));
    expect(items()[0]).toHaveStyle({ minHeight: '3.625rem', minWidth: '0' });
  });

  it('gives the hover to an enabled tile control only', () => {
    render(card(buildSocialLinks({ busy: true, linked: { items: ['github'] } })));
    const link = button(LINK_GOOGLE);
    const unlink = button('Відключити GitHub');

    expect(styleRuleFor(link, ':hover')).toBeUndefined();
    expect(styleRuleFor(unlink, ':hover')).toBeUndefined();
    expect(styleRuleFor(link, ENABLED_HOVER)?.getPropertyValue('background-color')).toBe('#FBFBFB');
    expect(styleRuleFor(unlink, ENABLED_HOVER)?.getPropertyValue('color')).toBe('#00A3FF');
  });

  it('dims the retry and takes the hover and the pointer off it while it runs', () => {
    render(card(buildSocialLinks({ status: 'retrying' })));
    const retry = button('Спробувати ще раз');
    const rule = (suffix: string): CSSStyleDeclaration | undefined =>
      styleRuleFor(retry, doubledClass(retry, suffix));

    expect(rule(':hover')?.getPropertyValue('background-color')).toBe('#F4F5F6');
    expect(rule(DISABLED)?.getPropertyValue('cursor')).toBe('default');
    expect(rule(DISABLED)?.getPropertyValue('opacity')).toBe('0.6');
    expect(rule(`${DISABLED}:hover`)?.getPropertyValue('background-color')).toBe('#FFFFFF');
    expect(rule(':focus-visible')?.getPropertyValue('outline')).toBe(FOCUS_OUTLINE);
  });

  it('greys the running retry out in forced colours', () => {
    render(card(buildSocialLinks({ status: 'retrying' })));
    const retry = button('Спробувати ще раз');
    const forced = mediaStyleRuleFor(retry, 'forced-colors:active', doubledClass(retry, DISABLED));

    expect(forced?.getPropertyValue('border-color')).toBe('GrayText');
    expect(forced?.getPropertyValue('color')).toBe('GrayText');
    expect(forced?.getPropertyValue('opacity')).toBe('1');
  });

  it('announces a failed load, its retry and the next failure, and nothing otherwise', () => {
    const { rerender } = render(card(buildSocialLinks({ status: 'loading' })));
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    rerender(card(buildSocialLinks({ status: 'failed' })));
    expect(status).toHaveTextContent(LOAD_FAILED);
    rerender(card(buildSocialLinks({ status: 'retrying' })));
    expect(status).toHaveTextContent('Завантажуємо підключені облікові записи…');
    rerender(card(buildSocialLinks({ status: 'ready' })));
    expect(status).toBeEmptyDOMElement();
  });

  it('offers a described retry that stays focused while it runs', async () => {
    const links = buildSocialLinks({ status: 'failed' });
    const { rerender } = render(card(links));
    const retry = button('Спробувати ще раз');
    expect(retry).toHaveAccessibleDescription(LOAD_FAILED);
    expect(retry).toHaveAttribute('aria-disabled', 'false');

    await userEvent.click(retry);
    expect(links.retry).toHaveBeenCalledTimes(1);
    expect(retry).toContainHTML('MuiTouchRipple');
    rerender(card(buildSocialLinks({ status: 'retrying' })));

    expect(retry).toHaveFocus();
    expect(retry).toHaveAttribute('aria-disabled', 'true');
    expect(retry).not.toContainHTML('MuiTouchRipple');
  });

  it('moves the focus from a successful retry to the heading', () => {
    const { rerender } = render(card(buildSocialLinks({ status: 'retrying' })));
    act(() => button('Спробувати ще раз').focus());

    rerender(card(buildSocialLinks()));

    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('tabindex', '-1');
    expect(screen.queryByText(LOAD_FAILED)).not.toBeInTheDocument();
  });

  it('leaves the focus alone when the retry did not hold it', () => {
    const { rerender } = render(card(buildSocialLinks({ status: 'retrying' })));

    rerender(card(buildSocialLinks()));

    expect(document.body).toHaveFocus();
  });
});

describe.each([
  { tileStyle: 'tinted', linkedText: 'GitHub, підключено' },
  { tileStyle: 'badge', linkedText: 'GitHub, підключено' },
  { tileStyle: 'labelled', linkedText: 'GitHub, підключеноВідключити' },
] as const)('SocialNetworksCard with $tileStyle linked tiles', ({ tileStyle, linkedText }) => {
  const styled = (links: SocialLinks, language: 'uk' | 'en' = 'uk'): JSX.Element =>
    card(links, language, tileStyle);

  it('shows a linked provider with exactly one unlink button, named for it', () => {
    render(styled(buildSocialLinks({ linked: { items: ['github'] } })));
    const github = items()[2] as HTMLElement;

    expect(github).toHaveTextContent(new RegExp(`^${linkedText}$`));
    expect(tileShowing(linkedText)).toBeInTheDocument();
    expect(within(github).getAllByRole('button')).toEqual([button('Відключити GitHub')]);
    expect(screen.getAllByRole('button')).toHaveLength(PROVIDERS.length);
  });

  it('speaks the linked state and the unlink name in English', () => {
    render(styled(buildSocialLinks({ linked: { items: ['github'] } }), 'en'));
    const github = items()[2] as HTMLElement;

    expect(github).toHaveTextContent('GitHub, linked');
    expect(within(github).getByRole('button')).toHaveAccessibleName('Unlink GitHub');
  });

  it('keeps the keyboard on the tile once it is linked', () => {
    const { rerender } = render(styled(buildSocialLinks()));
    act(() => button(LINK_GOOGLE).focus());

    rerender(styled(buildSocialLinks({ linked: { items: ['google'] } })));

    expect(button('Відключити Google')).toHaveFocus();
  });

  it('keeps the keyboard on the tile once it is unlinked again', () => {
    const { rerender } = render(styled(buildSocialLinks({ linked: { items: ['google'] } })));
    act(() => button('Відключити Google').focus());

    rerender(styled(buildSocialLinks()));

    expect(button(LINK_GOOGLE)).toHaveFocus();
  });

  it.each([
    [true, 'true'],
    [false, 'false'],
  ])('marks every control when busy is %s, without removing it', (busy, expected) => {
    render(styled(buildSocialLinks({ busy, linked: { items: ['github'] } })));

    screen.getAllByRole('button').forEach((each) => {
      expect(each).toHaveAttribute('aria-disabled', expected);
      expect(each).toBeEnabled();
      expect(each).toHaveAttribute('type', 'button');
    });
  });

  it('keeps the focus ring on a busy tile control', () => {
    render(styled(buildSocialLinks({ busy: true, linked: { items: ['github'] } })));

    [button(LINK_GOOGLE), button('Відключити GitHub')].forEach((control) => {
      expect(control).toHaveAttribute('aria-disabled', 'true');
      expect(lastDeclared(control, ':focus-visible', 'outline')).toBe(FOCUS_OUTLINE);
    });
  });

  it.each([
    ['loading', buildSocialLinks({ status: 'loading' })],
    ['failed', buildSocialLinks({ status: 'failed' })],
    ['unlinked', buildSocialLinks()],
    ['linked', buildSocialLinks({ linked: { items: ['google', 'github'] } })],
    ['busy', buildSocialLinks({ busy: true, linked: { items: ['google'] } })],
    ['retrying', buildSocialLinks({ status: 'retrying' })],
  ])('has no axe violations while %s', async (_name, links) => {
    render(styled(links));

    await expectNoA11yViolations(screen.getByRole('main'));
  });
});

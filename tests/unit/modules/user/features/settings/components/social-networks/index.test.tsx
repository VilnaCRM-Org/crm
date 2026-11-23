import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import SocialNetworks, {
  SocialNetworksCard,
} from '@/modules/user/features/settings/components/social-networks';
import type { SocialLinks } from '@/modules/user/features/settings/types/social-link/social-links';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

import buildSocialLinks from './social-links-fixture';

const mockUseSocialLinks = jest.fn();

jest.mock('@/modules/user/features/settings/hooks/use-social-links', () => ({
  __esModule: true,
  default: (toasts: unknown): unknown => mockUseSocialLinks(toasts),
}));

const PROVIDERS = ['Google', 'Facebook', 'GitHub', 'Twitter'];

const card = (links: SocialLinks, language: 'uk' | 'en' = 'uk'): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n(language, [])}>
    <main>
      <SocialNetworksCard links={links} />
    </main>
  </I18nextProvider>
);

const items = (): HTMLElement[] => within(screen.getByRole('list')).getAllByRole('listitem');

const button = (name: string): HTMLElement => screen.getByRole('button', { name });

const LINK_GOOGLE = 'Google: підключити обліковий запис (відкриється нове вікно)';
const LOAD_FAILED = 'Не вдалося завантажити підключені облікові записи';

describe('SocialNetworks', () => {
  it('hands the page toast queue to the links', () => {
    const toasts = {
      toasts: { items: [] },
      announcement: '',
      alert: '',
      show: jest.fn(),
      dismiss: jest.fn(),
    };
    mockUseSocialLinks.mockReturnValue(buildSocialLinks());

    render(
      <I18nextProvider i18n={createSettingsLocaleI18n('uk', [])}>
        <SocialNetworks toasts={toasts} />
      </I18nextProvider>
    );

    expect(mockUseSocialLinks).toHaveBeenCalledWith(toasts);
    expect(screen.getByRole('list', { name: 'Соціальні мережі' })).toBeInTheDocument();
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

  it('shows a linked provider with one named unlink button', () => {
    render(card(buildSocialLinks({ linked: { items: ['github'] } })));

    expect(items()[2]).toHaveTextContent('GitHub, підключено');
    expect(within(items()[2] as HTMLElement).getByRole('button')).toHaveAccessibleName(
      'Відключити GitHub'
    );
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
    const linked = screen.getByText(
      (_text, element) => element?.tagName === 'DIV' && element.textContent === 'GitHub, підключено'
    );

    expect(button(LINK_GOOGLE)).toHaveStyle({ minHeight: '3.625rem', cursor: 'pointer' });
    expect(linked).toHaveStyle({ minHeight: '3.625rem', backgroundColor: '#E8F7FF' });

    rerender(card(buildSocialLinks({ status: 'loading' })));
    expect(items()[0]).toHaveStyle({ minHeight: '3.625rem', minWidth: '0' });
  });

  it('keeps the keyboard on the tile once it is linked', () => {
    const { rerender } = render(card(buildSocialLinks()));
    button(LINK_GOOGLE).focus();

    rerender(card(buildSocialLinks({ linked: { items: ['google'] } })));

    expect(button('Відключити Google')).toHaveFocus();
  });

  it.each([
    [true, 'true'],
    [false, 'false'],
  ])('marks every control when busy is %s, without removing it', (busy, expected) => {
    render(card(buildSocialLinks({ busy, linked: { items: ['github'] } })));

    screen.getAllByRole('button').forEach((each) => {
      expect(each).toHaveAttribute('aria-disabled', expected);
      expect(each).toBeEnabled();
      expect(each).toHaveAttribute('type', 'button');
    });
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
    rerender(card(buildSocialLinks({ status: 'retrying' })));

    expect(retry).toHaveFocus();
    expect(retry).toHaveAttribute('aria-disabled', 'true');
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

  it.each([
    ['loading', buildSocialLinks({ status: 'loading' })],
    ['failed', buildSocialLinks({ status: 'failed' })],
    ['unlinked', buildSocialLinks()],
    ['linked', buildSocialLinks({ linked: { items: ['google', 'github'] } })],
    ['busy', buildSocialLinks({ busy: true, linked: { items: ['google'] } })],
  ])('has no axe violations while %s', async (_name, links) => {
    render(card(links));

    await expectNoA11yViolations(screen.getByRole('main'));
  });
});

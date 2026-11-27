import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import type { JSX, RefObject } from 'react';
import { I18nextProvider } from 'react-i18next';

import View from '@/modules/user/features/settings/components/social-networks/social-load-failure';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

const i18n = createSettingsLocaleI18n('en', []);
const first: RefObject<HTMLElement | null> = { current: null };
const second: RefObject<HTMLElement | null> = { current: null };

const page = (headingRef: RefObject<HTMLElement | null>, shown = true): JSX.Element => (
  <I18nextProvider i18n={i18n}>
    <h2 tabIndex={-1} ref={first as RefObject<HTMLHeadingElement>}>
      first
    </h2>
    <h2 tabIndex={-1} ref={second as RefObject<HTMLHeadingElement>}>
      second
    </h2>
    {shown && <View retrying={false} headingRef={headingRef} onRetry={jest.fn()} />}
  </I18nextProvider>
);

describe('SocialLoadFailure', () => {
  it.each([
    [false, 'Your linked accounts could not be loaded', 'false'],
    [true, 'Loading your linked accounts…', 'true'],
  ])('says, while retrying is %s, %s', (retrying, message, disabled) => {
    render(
      <I18nextProvider i18n={i18n}>
        <View retrying={retrying} headingRef={first} onRetry={jest.fn()} />
      </I18nextProvider>
    );

    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(retry).toHaveAccessibleDescription(message);
    expect(retry).toHaveAttribute('aria-disabled', disabled);
  });

  it('hands its focus to the heading it was last given', () => {
    const { rerender } = render(page(first));
    rerender(page(second));
    act(() => screen.getByRole('button').focus());

    rerender(page(second, false));

    expect(screen.getByRole('heading', { name: 'second' })).toHaveFocus();
  });

  it('survives a heading that is gone', () => {
    const { rerender } = render(page({ current: null }));
    act(() => screen.getByRole('button').focus());

    expect(() => rerender(page({ current: null }, false))).not.toThrow();
  });
});

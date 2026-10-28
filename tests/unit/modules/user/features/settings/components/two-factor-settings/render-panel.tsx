import { render, type RenderResult } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { TwoFactorPanel } from '@/modules/user/features/settings/components/two-factor-settings';
import type {
  TwoFactorSettingsCallbacks,
  TwoFactorSettingsProps,
  TwoFactorSettingsViewState,
} from '@/modules/user/features/settings/types/two-factor/settings-view';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

export const EMPTY_SETTINGS = {
  status: 'disabled' as const,
  otpauthUri: null,
  secret: null,
  recoveryCodes: null,
};

export const viewState = (
  view: TwoFactorSettingsViewState['view'],
  overrides: Partial<TwoFactorSettingsViewState> = {}
): TwoFactorSettingsViewState => ({
  view,
  fieldError: null,
  banner: null,
  bannerOccurrence: 0,
  statusCode: null,
  ...overrides,
});

export const fakeCallbacks = (): { [K in keyof TwoFactorSettingsCallbacks]: jest.Mock } => ({
  start: jest.fn(),
  confirm: jest.fn(),
  done: jest.fn(),
  openDisable: jest.fn(),
  disable: jest.fn(),
  openRegenerate: jest.fn(),
  regenerate: jest.fn(),
  cancel: jest.fn(),
  signInAgain: jest.fn(),
});

export const panelProps = (
  overrides: Partial<TwoFactorSettingsProps> = {}
): TwoFactorSettingsProps => ({
  settings: EMPTY_SETTINGS,
  view: viewState('off'),
  callbacks: fakeCallbacks(),
  isSubmitting: false,
  ...overrides,
});

export const renderPanel = (
  props: TwoFactorSettingsProps,
  language: 'uk' | 'en' = 'uk'
): RenderResult => {
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <I18nextProvider i18n={createSettingsLocaleI18n(language, [])}>
        <main>{children}</main>
      </I18nextProvider>
    );
  }

  return render(
    <TwoFactorPanel
      settings={props.settings}
      view={props.view}
      callbacks={props.callbacks}
      isSubmitting={props.isSubmitting}
    />,
    { wrapper: Wrapper }
  );
};

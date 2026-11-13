import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';

import { buildOtpauthUri, buildRecoveryCodeSet, buildTotpSecret } from '@tests/builders';
import {
  EMPTY_SETTINGS,
  panelProps,
  renderPanel,
  viewState,
} from '@tests/unit/modules/user/features/settings/components/two-factor-settings/render-panel';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const SETUP = { ...EMPTY_SETTINGS, otpauthUri: buildOtpauthUri(), secret: buildTotpSecret() };
const ENABLED = { ...EMPTY_SETTINGS, status: 'enabled' as const };
const CODES = { ...ENABLED, recoveryCodes: buildRecoveryCodeSet() };

type Settings = typeof EMPTY_SETTINGS | typeof SETUP | typeof ENABLED | typeof CODES;
type View = Parameters<typeof viewState>[0];
type Overrides = Parameters<typeof viewState>[1];

const SETTINGS_OF: Record<View, Settings> = {
  off: EMPTY_SETTINGS,
  setup: SETUP,
  codes: CODES,
  on: ENABLED,
  disable: ENABLED,
  regenerate: ENABLED,
  reauth: ENABLED,
};

const expectClean = async (view: View, overrides: Overrides = {}): Promise<void> => {
  const { container } = renderPanel(
    panelProps({ settings: SETTINGS_OF[view], view: viewState(view, overrides) })
  );

  await expectNoA11yViolations(container);
};

describe('TwoFactorPanel accessibility', () => {
  it.each<View>(['off', 'setup', 'codes', 'on', 'disable', 'regenerate', 'reauth'])(
    'has no WCAG 2.1 AA violation in the %s view',
    async (view) => {
      await expectClean(view);
    }
  );

  it.each([
    ['setup', 'incomplete'],
    ['setup', 'format'],
    ['setup', 'invalid_code'],
  ] as const)('has no violation in the %s view with the %s field error', async (view, error) => {
    await expectClean(view, { fieldError: error });
  });

  it.each(['incomplete', 'format', 'invalid_code'] as const)(
    'has no violation in the disable view with the %s field error, once focus settles',
    async (error) => {
      const { container } = renderPanel(
        panelProps({ settings: ENABLED, view: viewState('disable', { fieldError: error }) })
      );

      const field = screen.getByRole('textbox', { name: 'Код підтвердження' });
      await waitFor(() => expect(field).toHaveFocus());
      await expectNoA11yViolations(container);
    }
  );

  it.each([
    ['off', 'rate_limited'],
    ['off', 'transient'],
    ['setup', 'rate_limited'],
    ['setup', 'transient'],
    ['disable', 'transient'],
    ['regenerate', 'rate_limited'],
    ['regenerate', 'transient'],
  ] as const)('has no violation in the %s view with the %s banner', async (view, banner) => {
    await expectClean(view, { banner, bannerOccurrence: 1 });
  });

  it.each([
    ['on', 'already_on'],
    ['off', 'stale'],
    ['off', 'disabled'],
    ['off', 'already_off'],
  ] as const)('has no violation in the %s view with the %s status', async (view, statusCode) => {
    await expectClean(view, { statusCode });
  });

  it('has no violation in the busy disable view', async () => {
    const { container } = renderPanel(
      panelProps({ settings: ENABLED, view: viewState('disable'), isSubmitting: true })
    );

    await expectNoA11yViolations(container);
  });
});

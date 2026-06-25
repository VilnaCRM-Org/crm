// @jest-environment jsdom

import '../../../../../utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import localization from '@/i18n/localization.json';
import AuthSwitcher from '@/modules/user/features/auth/components/auth-switcher';
import switcherStyles from '@/modules/user/features/auth/components/auth-switcher/styles';

import renderWithProviders from '../../../../../utils/render-with-providers';

const enForm = localization.en.translation.sign_up.form;
const HAVE_ACCOUNT = enForm.switcher_text_have_account;
const NO_ACCOUNT = enForm.switcher_text_no_account;

describe('AuthSwitcher', () => {
  it('renders a real link to /sign-in with the "have account" label', () => {
    renderWithProviders(
      <AuthSwitcher to="/sign-in" labelKey="sign_up.form.switcher_text_have_account" />
    );

    const links = screen.getAllByRole('link', { name: HAVE_ACCOUNT });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/sign-in');
    expect(links[0]).toHaveTextContent(HAVE_ACCOUNT);
  });

  it('renders a real link to /sign-up with the "no account" label', () => {
    renderWithProviders(
      <AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account" />
    );

    const link = screen.getByRole('link', { name: NO_ACCOUNT });
    expect(link).toHaveAttribute('href', '/sign-up');
    expect(link).toHaveTextContent(NO_ACCOUNT);
  });

  it('exposes no disabled, aria-pressed, or aria-current and never an empty href', () => {
    renderWithProviders(
      <AuthSwitcher to="/sign-in" labelKey="sign_up.form.switcher_text_have_account" />
    );

    const link = screen.getByRole('link', { name: HAVE_ACCOUNT });
    expect(link).toBeEnabled();
    expect(link).not.toHaveAttribute('aria-pressed');
    expect(link).not.toHaveAttribute('aria-current');
    expect(link).toHaveAttribute('href', '/sign-in');
  });

  it('does not override the native anchor role (no role attribute, not a button)', () => {
    renderWithProviders(
      <AuthSwitcher to="/sign-in" labelKey="sign_up.form.switcher_text_have_account" />
    );

    const link = screen.getByRole('link', { name: HAVE_ACCOUNT });
    expect(link).not.toHaveAttribute('role');
    expect(screen.queryByRole('button', { name: HAVE_ACCOUNT })).not.toBeInTheDocument();
  });

  it('applies a #404142 focus-visible ring with a 2px offset and no resting outline', () => {
    const switcher = switcherStyles.switcher as Record<string, unknown>;
    const focusVisible = switcher['&:focus-visible'] as Record<string, string>;

    expect(focusVisible.outline).toBe('2px solid #404142');
    expect(focusVisible.outlineOffset).toBe('2px');
    expect(switcher.outline).toBeUndefined();
  });

  it('keeps the resting text color at the deferred-D1 secondary #969B9D', () => {
    const switcher = switcherStyles.switcher as Record<string, unknown>;

    expect(switcher.color).toBe('#969B9D');
  });
});

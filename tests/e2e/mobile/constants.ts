import { buildCredentials, buildUser, seedFaker } from '@tests/builders';
import { t } from '@tests/e2e/utils/initialize-localization';

seedFaker();

export const SIGN_IN_URL = '/sign-in';
export const SIGN_UP_URL = '/sign-up';

export const LOGIN_API_URL = '**/api/users';
export const REGISTRATION_API_URL = '**/graphql';

export const MIN_TOUCH_TARGET_PX = 44;

export const credentials = buildCredentials();
export const newUser = buildUser();

export const signIn = {
  emailPlaceholder: t('sign_in.form.email_input.placeholder'),
  passwordPlaceholder: t('sign_in.form.password_input.placeholder'),
  submitLabel: t('sign_in.form.submit_button'),
};

export const signUp = {
  namePlaceholder: t('sign_up.form.name_input.placeholder'),
  emailPlaceholder: t('sign_up.form.email_input.placeholder'),
  passwordPlaceholder: t('sign_up.form.password_input.placeholder'),
  submitLabel: t('sign_up.form.submit_button'),
  requiredNameError: t('sign_up.form.name_input.required'),
  successNotificationTitle: t('notifications.success.title'),
};

export const switcherToSignUpLabel: string = t('sign_up.form.switcher_text_no_account');
export const switcherToSignInLabel: string = t('sign_up.form.switcher_text_have_account');

export const showPasswordLabel: string = t('auth.password.show');
export const hidePasswordLabel: string = t('auth.password.hide');

// The accessible name is one interpolated key, so the provider is not necessarily a suffix in
// every locale — match each rendered label exactly instead of prefixing.
export const OAUTH_PROVIDER_LABELS: readonly string[] = [
  'Google',
  'GitHub',
  'Facebook',
  'Twitter',
].map((provider) => t('sign_up.socials_aria_label', { provider }));

export const OAUTH_BUTTON_SELECTOR = OAUTH_PROVIDER_LABELS.map(
  (label) => `button[aria-label="${label}"]`
).join(', ');

export const OAUTH_PROVIDER_COUNT = OAUTH_PROVIDER_LABELS.length;

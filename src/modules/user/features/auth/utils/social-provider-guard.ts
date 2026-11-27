import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';

const SOCIAL_PROVIDERS: ReadonlySet<string> = new Set<SocialProvider>([
  'google',
  'github',
  'facebook',
  'twitter',
]);

// The callback route's `:provider` segment comes straight from the URL the provider redirected
// to, so it is narrowed here before it reaches the API path or the page copy.
class SocialProviderGuard {
  public isSocialProvider(value: unknown): value is SocialProvider {
    return typeof value === 'string' && SOCIAL_PROVIDERS.has(value);
  }
}

const socialProviderGuard = new SocialProviderGuard();

export default socialProviderGuard;

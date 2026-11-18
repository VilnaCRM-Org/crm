import ROUTE_PATHS from '@/routes/route-paths';
import type {
  SocialCallbackQuery,
  SocialCallbackView,
  SocialProviderLabels,
  SocialRelayingView,
} from '@auth/types/social-sign-in/social-callback-view';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import type { SocialSignInErrorKind } from '@auth/types/social-sign-in/social-sign-in-error-kind';
import type { SocialSignInOutcome } from '@auth/types/social-sign-in/social-sign-in-outcome';
import socialProviderGuard from '@auth/utils/social-provider-guard';
import socialSignInDestinationSource from '@auth/utils/social-sign-in-destination-source';

const PROVIDER_LABELS: SocialProviderLabels = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
  twitter: 'Twitter',
};

// What the social callback page shows, decided from the URL it was opened with and from the
// relay's outcome (specs/social-sign-in, FR5-FR14). Kept apart from the hook so every branch is
// a plain method call.
class SocialCallbackViewMapper {
  public readQuery(): SocialCallbackQuery {
    const params = new URLSearchParams(window.location.search);
    return { code: params.get('code'), state: params.get('state'), error: params.get('error') };
  }

  // The code and state must not stay in the history entry. Stripping is idempotent, so it is safe
  // under StrictMode's repeated effects, and it keeps the router's own history state.
  public stripQuery(): void {
    if (window.location.search === '') return;
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }

  public initialView(
    param: string | undefined,
    query: SocialCallbackQuery,
    signedIn: boolean
  ): SocialCallbackView {
    if (signedIn) return { status: 'redirect', to: ROUTE_PATHS.home, state: { focusMain: true } };
    if (!socialProviderGuard.isSocialProvider(param)) {
      return { status: 'failed', provider: null, label: '', error: 'unsupported_provider' };
    }
    return this.queryView(param, query);
  }

  public outcomeView(view: SocialRelayingView, outcome: SocialSignInOutcome): SocialCallbackView {
    if (outcome.kind === 'signed-in') {
      const to = socialSignInDestinationSource.take();
      return { status: 'redirect', to, state: { focusMain: true } };
    }
    const error = outcome.kind === 'failed' ? outcome.error : 'two_factor_required';
    return { status: 'failed', provider: view.provider, label: view.label, error };
  }

  private queryView(provider: SocialProvider, query: SocialCallbackQuery): SocialCallbackView {
    const label = PROVIDER_LABELS[provider];
    const error = this.queryError(query);
    return error === null
      ? { status: 'relaying', provider, label }
      : { status: 'failed', provider, label, error };
  }

  // A provider-side denial and a redirect without its code or state never reach the backend.
  private queryError(query: SocialCallbackQuery): SocialSignInErrorKind | null {
    if (query.error !== null) return 'cancelled';
    return query.code && query.state ? null : 'missing_parameters';
  }
}

const socialCallbackViewMapper = new SocialCallbackViewMapper();

export default socialCallbackViewMapper;

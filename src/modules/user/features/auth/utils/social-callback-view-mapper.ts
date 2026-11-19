import type {
  SocialCallbackQuery,
  SocialCallbackView,
  SocialPendingView,
  SocialProviderLabels,
  SocialStartingView,
} from '@auth/types/social-sign-in/social-callback-view';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import type { SocialSignInErrorKind } from '@auth/types/social-sign-in/social-sign-in-error-kind';
import type {
  SocialSignInOutcome,
  SocialStartOutcome,
} from '@auth/types/social-sign-in/social-sign-in-outcome';
import socialProviderGuard from '@auth/utils/social-provider-guard';
import socialSignInFlowSource from '@auth/utils/social-sign-in-flow-source';

const PROVIDER_LABELS: SocialProviderLabels = {
  google: 'Google',
  github: 'GitHub',
  facebook: 'Facebook',
  twitter: 'Twitter',
};

// What the social callback page shows, decided from how it was opened (a start from the
// provider buttons, or a provider redirect back) and from each relay's outcome
// (specs/social-sign-in, FR5-FR14).
class SocialCallbackViewMapper {
  public readQuery(): SocialCallbackQuery {
    const params = new URLSearchParams(window.location.search);
    return { code: params.get('code'), state: params.get('state'), error: params.get('error') };
  }

  // The code and state must not stay in the history entry. Stripping is idempotent, so it is safe
  // under StrictMode's repeated effects, and it keeps the router's own history state.
  public stripQuery(): void {
    if (window.location.search === '') return;
    // Stryker disable next-line StringLiteral: equivalent, browsers ignore the title argument
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }

  public initialView(
    param: string | undefined,
    query: SocialCallbackQuery,
    starting: boolean
  ): SocialCallbackView {
    if (!socialProviderGuard.isSocialProvider(param)) {
      return { status: 'failed', provider: null, label: '', error: 'unsupported_provider' };
    }
    return this.queryView(param, query, starting);
  }

  public startView(view: SocialStartingView, outcome: SocialStartOutcome): SocialCallbackView {
    if (outcome.kind !== 'redirect') return this.failedView(view, this.errorOf(outcome));
    socialSignInFlowSource.saveState({ provider: view.provider, state: outcome.state });
    return { status: 'leaving', label: view.label, authorizationUrl: outcome.authorizationUrl };
  }

  public outcomeView(view: SocialPendingView, outcome: SocialSignInOutcome): SocialCallbackView {
    if (outcome.kind !== 'signed-in') return this.failedView(view, this.errorOf(outcome));
    const to = socialSignInFlowSource.takeDestination();
    return { status: 'redirect', label: view.label, to, state: { focusMain: true } };
  }

  public unavailableView(view: SocialPendingView): SocialCallbackView {
    return this.failedView(view, 'unavailable');
  }

  private failedView(view: SocialPendingView, error: SocialSignInErrorKind): SocialCallbackView {
    return { status: 'failed', provider: view.provider, label: view.label, error };
  }

  // A 2FA account finishes with its password until the 2FA challenge lands; a relay that never
  // got an answer (the page never aborts one) counts as the service being unavailable.
  private errorOf(outcome: SocialSignInOutcome | SocialStartOutcome): SocialSignInErrorKind {
    if (outcome.kind === 'failed') return outcome.error;
    return outcome.kind === 'two-factor' ? 'two_factor_required' : 'unavailable';
  }

  private queryView(
    provider: SocialProvider,
    query: SocialCallbackQuery,
    starting: boolean
  ): SocialCallbackView {
    const label = PROVIDER_LABELS[provider];
    const error = this.queryError(provider, query, starting);
    if (error === 'start') return { status: 'starting', provider, label };
    if (error === null) return { status: 'relaying', provider, label };
    return { status: 'failed', provider, label, error };
  }

  // A provider-side denial, a redirect without its code or state, and a state this tab never
  // started all end here, before user-service is asked anything.
  private queryError(
    provider: SocialProvider,
    query: SocialCallbackQuery,
    starting: boolean
  ): SocialSignInErrorKind | 'start' | null {
    if (query.error !== null) return 'cancelled';
    if (!query.code || !query.state) return starting ? 'start' : 'missing_parameters';
    const expected = { provider, state: query.state };
    return socialSignInFlowSource.matchesState(expected) ? null : 'expired';
  }
}

const socialCallbackViewMapper = new SocialCallbackViewMapper();

export default socialCallbackViewMapper;

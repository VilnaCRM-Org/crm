import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router';

import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useSocialCallbackRelay from '@auth/hooks/use-social-callback-relay';
import { useAuthStore } from '@auth/stores';
import type {
  SocialCallback,
  SocialCallbackInitial,
  SocialCallbackView,
  SocialRelay,
} from '@auth/types/social-sign-in/social-callback-view';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';

// Decided once, from the URL the provider redirected to; StrictMode may call the initializer
// twice, so it only reads, and the query is stripped in a layout effect.
function useInitialCallback(): SocialCallbackInitial {
  const { provider } = useParams();
  const [initial] = useState(() => {
    const query = socialCallbackViewMapper.readQuery();
    const signedIn = useAuthStore.getState().token !== null;
    return { query, view: socialCallbackViewMapper.initialView(provider, query, signedIn) };
  });
  useLayoutEffect(() => socialCallbackViewMapper.stripQuery(), [initial]);
  return initial;
}

function useRelayRun(
  initial: SocialCallbackInitial,
  settle: Dispatch<SetStateAction<SocialCallbackView>>
): SocialRelay | null {
  return useMemo(() => {
    const { code, state } = initial.query;
    if (initial.view.status !== 'relaying' || !code || !state) return null;
    return { view: initial.view, params: { code, state }, settle };
  }, [initial, settle]);
}

function useRedirect(view: SocialCallbackView): void {
  const navigate = useNavigate();
  useEffect(() => {
    if (view.status === 'redirect') void navigate(view.to, { replace: true, state: view.state });
  }, [navigate, view]);
}

function useRetry(view: SocialCallbackView): SocialCallback['retry'] {
  const provider = view.status === 'redirect' ? null : view.provider;
  return useMemo(
    () => (provider === null ? undefined : (): void => socialSignInNavigator.restart(provider)),
    [provider]
  );
}

export default function useSocialCallback(): SocialCallback {
  const initial = useInitialCallback();
  const [view, setView] = useState(initial.view);
  useSocialCallbackRelay(useAuthProviderLoader(), useRelayRun(initial, setView));
  useRedirect(view);
  return { view, retry: useRetry(view) };
}

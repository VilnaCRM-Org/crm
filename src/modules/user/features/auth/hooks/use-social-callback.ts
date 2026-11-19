import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import useAuthProviderLoader from '@auth/hooks/use-auth-provider-loader';
import useSocialCallbackRelay from '@auth/hooks/use-social-callback-relay';
import type {
  SocialCallback,
  SocialCallbackInitial,
  SocialCallbackView,
  SocialRelay,
} from '@auth/types/social-sign-in/social-callback-view';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';

// Decided once, from how the page was opened; StrictMode may call the initializer twice, so it
// only reads, and the query is stripped in a layout effect.
function useInitialCallback(): SocialCallbackInitial {
  const { provider } = useParams();
  const location = useLocation();
  const [initial] = useState(() => {
    const query = socialCallbackViewMapper.readQuery();
    const starting = (location.state as RedirectNavigationState | null)?.socialStart === true;
    return { query, view: socialCallbackViewMapper.initialView(provider, query, starting) };
  });
  useLayoutEffect(() => socialCallbackViewMapper.stripQuery(), [initial]);
  return initial;
}

function useRelay(
  initial: SocialCallbackInitial,
  settle: Dispatch<SetStateAction<SocialCallbackView>>
): SocialRelay | null {
  const { key } = useLocation();
  return useMemo(() => {
    const { view, query } = initial;
    if (view.status === 'starting') return { kind: 'start', key: `start:${key}`, view, settle };
    if (view.status !== 'relaying' || !query.code || !query.state) return null;
    const params = { code: query.code, state: query.state };
    return { kind: 'complete', key: `complete:${query.state}`, view, params, settle };
  }, [initial, key, settle]);
}

function useNavigation(view: SocialCallbackView): void {
  const navigate = useNavigate();
  useEffect(() => {
    if (view.status === 'redirect') void navigate(view.to, { replace: true, state: view.state });
    if (view.status === 'leaving') socialSignInNavigator.leave(view.authorizationUrl);
  }, [navigate, view]);
}

function useRetry(view: SocialCallbackView): SocialCallback['retry'] {
  const navigate = useNavigate();
  const provider = view.status === 'failed' ? view.provider : null;
  return useMemo(
    () =>
      provider === null ? undefined : (): void => socialSignInNavigator.restart(provider, navigate),
    [navigate, provider]
  );
}

export default function useSocialCallback(): SocialCallback {
  const initial = useInitialCallback();
  const [view, setView] = useState(initial.view);
  useSocialCallbackRelay(useAuthProviderLoader(), useRelay(initial, setView));
  useNavigation(view);
  return { view, retry: useRetry(view) };
}

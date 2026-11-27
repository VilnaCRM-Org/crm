import { type Dispatch, useEffect, useReducer } from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SocialLinkProviderId } from '@/modules/user/types/social-link/social-link-callback';
import { useService } from '@/providers/di';

import type { SocialLinkProvider } from '../data-providers';
import type { LinkedProviderSet } from '../types/social-link/outcome';
import type {
  SocialLinkFocusReturn,
  SocialLinkIntent,
  SocialLinks,
  SocialLinksAction,
  SocialLinksState,
} from '../types/social-link/social-links';

import useSocialBusy from './use-social-busy';
import useSocialLinkAttempt from './use-social-link-attempt';
import useSocialLinkSettle from './use-social-link-settle';
import useSocialUnlink from './use-social-unlink';

const INITIAL_STATE: SocialLinksState = {
  status: 'loading',
  linked: { items: [] },
  reload: false,
};

function changed(
  { items }: LinkedProviderSet,
  id: SocialLinkProviderId,
  intent: SocialLinkIntent
): LinkedProviderSet {
  const others = items.filter((item) => item !== id);
  return { items: intent === 'linked' ? [...others, id] : others };
}

function reduceLinks(state: SocialLinksState, action: SocialLinksAction): SocialLinksState {
  if (action.type === 'loaded') return { ...state, status: 'ready', linked: action.linked };
  if (action.type === 'changed') {
    return { ...state, linked: changed(state.linked, action.id, action.intent) };
  }
  return action.type === 'retry'
    ? { ...state, status: 'retrying', reload: !state.reload }
    : { ...state, status: 'failed' };
}

async function load(
  provider: SocialLinkProvider,
  signal: AbortSignal,
  dispatch: Dispatch<SocialLinksAction>
): Promise<void> {
  const outcome = await provider.linked(signal);
  if (signal.aborted) return;
  if (outcome.kind === 'listed') dispatch({ type: 'loaded', linked: outcome.linked });
  else if (outcome.reason !== 'session_ended') dispatch({ type: 'failed' });
}

export default function useSocialLinks(returnFocusRef: SocialLinkFocusReturn): SocialLinks {
  const provider = useService<SocialLinkProvider>(AUTH_TOKENS.SocialLinkProvider);
  const [{ status, linked, reload }, dispatch] = useReducer(reduceLinks, INITIAL_STATE);
  useEffect(() => {
    const controller = new AbortController();
    void load(provider, controller.signal, dispatch);
    return (): void => controller.abort();
  }, [provider, reload]);
  const settle = useSocialLinkSettle({
    adopt: (id, intent): void => dispatch({ type: 'changed', id, intent }),
    returnFocusRef,
  });
  const busy = useSocialBusy();
  const link = useSocialLinkAttempt({ provider, settle, busy });
  const unlink = useSocialUnlink({ provider, settle, busy });
  const retry = (): void => {
    if (status === 'failed') dispatch({ type: 'retry' });
  };

  return { status, linked, busy: busy.busy, link, unlink, retry };
}

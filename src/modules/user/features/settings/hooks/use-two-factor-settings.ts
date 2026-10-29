import { useState } from 'react';
import { useOutletContext } from 'react-router';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import TwoFactorCodeNormalizer from '@/modules/user/lib/two-factor-code-normalizer';
import { useService } from '@/providers/di';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import type { TwoFactorSettingsProvider } from '../data-providers';
import type { TransitionStore, TwoFactorOperations } from '../types/hooks/two-factor-submit';
import type { TwoFactorSettingsProps } from '../types/two-factor/settings-view';

import useRecoveryCodesRegenerate from './use-recovery-codes-regenerate';
import useTwoFactorDisable from './use-two-factor-disable';
import useTwoFactorSetup from './use-two-factor-setup';
import useTwoFactorTransition from './use-two-factor-transition';

function propsOf(
  store: TransitionStore,
  operations: TwoFactorOperations,
  signInAgain: () => void
): TwoFactorSettingsProps {
  const { setup, disable, regenerate } = operations;
  return {
    settings: store.current.settings,
    view: store.current.view,
    isSubmitting: setup.isSubmitting || disable.isSubmitting || regenerate.isSubmitting,
    callbacks: {
      start: setup.start,
      confirm: setup.confirm,
      done: setup.done,
      openDisable: disable.open,
      disable: disable.disable,
      openRegenerate: regenerate.open,
      regenerate: regenerate.regenerate,
      cancel: disable.cancel,
      signInAgain,
    },
  };
}

export default function useTwoFactorSettings(): TwoFactorSettingsProps {
  const provider = useService<TwoFactorSettingsProvider>(AUTH_TOKENS.TwoFactorSettingsProvider);
  const { twoFactorStatus, setTwoFactorStatus, signOut } =
    useOutletContext<ProtectedOutletContext>();
  const [normalizer] = useState(() => new TwoFactorCodeNormalizer());
  const store = useTwoFactorTransition(twoFactorStatus);
  const { read, apply } = store;
  const deps = { provider, normalizer, read, apply, recordStatus: setTwoFactorStatus };

  const operations = {
    setup: useTwoFactorSetup(deps),
    disable: useTwoFactorDisable(deps),
    regenerate: useRecoveryCodesRegenerate(deps),
  };

  return propsOf(store, operations, signOut);
}

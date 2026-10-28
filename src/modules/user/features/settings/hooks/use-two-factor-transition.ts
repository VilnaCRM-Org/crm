import { useRef, useState } from 'react';

import type { TwoFactorStatus } from '@/routes/types/protected-outlet-context';

import type { TransitionStore } from '../types/hooks/two-factor-submit';
import type {
  TwoFactorSettingsTransition,
  TwoFactorSettingsView,
} from '../types/two-factor/settings-view';

const VIEW_STATUS: Record<TwoFactorSettingsView, TwoFactorStatus> = {
  off: 'disabled',
  setup: 'disabled',
  on: 'enabled',
  codes: 'enabled',
  disable: 'enabled',
  regenerate: 'enabled',
  reauth: 'enabled',
};

function reconcile({ settings, view }: TwoFactorSettingsTransition): TwoFactorSettingsTransition {
  const showsSecret = view.view === 'setup';
  return {
    view,
    settings: {
      status: VIEW_STATUS[view.view],
      otpauthUri: showsSecret ? settings.otpauthUri : null,
      secret: showsSecret ? settings.secret : null,
      recoveryCodes: view.view === 'codes' ? settings.recoveryCodes : null,
    },
  };
}

function initialTransition(status: TwoFactorStatus): TwoFactorSettingsTransition {
  const view = status === 'enabled' ? 'on' : 'off';
  return reconcile({
    settings: { status, otpauthUri: null, secret: null, recoveryCodes: null },
    view: { view, fieldError: null, banner: null, statusCode: null },
  });
}

export default function useTwoFactorTransition(status: TwoFactorStatus): TransitionStore {
  const [current, setCurrent] = useState(() => initialTransition(status));
  const latest = useRef(current);

  const apply = (transition: TwoFactorSettingsTransition): void => {
    latest.current = reconcile(transition);
    setCurrent(latest.current);
  };

  return { current, read: () => latest.current, apply };
}

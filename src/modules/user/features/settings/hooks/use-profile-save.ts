import { useCallback, useReducer, useRef, useState } from 'react';

import type { AbortableSubmit } from '@/hooks/types/use-abortable-submit';
import useAbortableSubmit from '@/hooks/use-abortable-submit';
import useNotifications from '@/hooks/use-notifications';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import { useService } from '@/providers/di';

import type ProfileProvider from '../data-providers/profile-provider';
import type {
  ProfileEditContext,
  ProfileFormAction,
  ProfileFormStore,
  ProfileSave,
  SaveTarget,
} from '../types/hooks/use-profile-save';
import type { ProfileFormState } from '../types/user-profile/form-state';
import type { ProfileFieldErrorSet, ProfileUpdateOutcome } from '../types/user-profile/outcome';
import type { ProfileChange } from '../types/user-profile/profile-change';
import type { ProfileFormValues } from '../types/user-profile/profile-form-values';
import type { ProfileSection } from '../types/user-profile/profile-section';
import ProfileChangeDetector from '../utils/profile-change-detector';

import useSaveSettle from './use-save-settle';
import useSettledFocus from './use-settled-focus';

const NO_ERRORS: ProfileFieldErrorSet = { items: [] };

const INITIAL_STATE: ProfileFormState = {
  fieldErrors: NO_ERRORS,
  noChanges: false,
  noChangesMarked: false,
  settled: 0,
  saved: 0,
  lastSettleSaved: false,
  cleared: 0,
  attempts: 0,
};

function reduceFormState(state: ProfileFormState, action: ProfileFormAction): ProfileFormState {
  if (action.type === 'invalid') return { ...state, fieldErrors: action.errors };
  const settledNow = action.type === 'settled';
  return {
    fieldErrors: NO_ERRORS,
    noChanges: action.type === 'no_changes',
    noChangesMarked: state.noChanges && !state.noChangesMarked,
    settled: settledNow ? state.settled + 1 : state.settled,
    saved: settledNow && action.saved ? state.saved + 1 : state.saved,
    lastSettleSaved: settledNow ? action.saved : state.lastSettleSaved,
    cleared: action.type === 'clear' ? state.cleared + 1 : state.cleared,
    attempts: action.type === 'pending' ? state.attempts + 1 : state.attempts,
  };
}

function useProfileUpdate(): AbortableSubmit<ProfileChange, ProfileUpdateOutcome> {
  const provider = useService<ProfileProvider>(AUTH_TOKENS.ProfileProvider);
  const run = useCallback(
    (change: ProfileChange, signal: AbortSignal) => provider.update(change, signal),
    // Stryker disable next-line ArrayDeclaration: equivalent, the provider identity never changes
    [provider]
  );
  return useAbortableSubmit(run);
}

function useProfileFormState(): ProfileFormStore {
  const [state, reduce] = useReducer(reduceFormState, INITIAL_STATE);
  const { withdraw } = useNotifications();
  const dispatch = (action: ProfileFormAction): void => {
    if (action.type === 'pending' || action.type === 'clear') withdraw('primary');
    reduce(action);
  };

  return { state, dispatch };
}

function useSaveTarget(
  props: ProfileEditContext,
  section: ProfileSection,
  state: ProfileFormState
): SaveTarget {
  const { saveRef, headingRef } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const focusRef = useRef<HTMLElement>(null);
  useSettledFocus({ state, section, buttonRef, saveRef, focusRef, headingRef });

  return {
    buttonRef,
    focusRef,
    remember: (): void => {
      saveRef.current = buttonRef.current;
    },
  };
}

export default function useProfileSave(
  props: ProfileEditContext,
  section: ProfileSection
): ProfileSave {
  const [changes] = useState(() => new ProfileChangeDetector());
  const { state, dispatch } = useProfileFormState();
  const { isSubmitting, submit } = useProfileUpdate();
  const { remember, ...targets } = useSaveTarget(props, section, state);
  const settle = useSaveSettle({ props, targets, dispatch });

  const save = async (values: ProfileFormValues): Promise<void> => {
    const change = changes.detect(section, props.user, values);
    if (change === null) return dispatch({ type: 'no_changes' });
    remember();
    dispatch({ type: 'pending' });
    const outcome = await submit(change);
    if (outcome !== null) settle(outcome, change);
  };

  return {
    state,
    isSubmitting,
    changes,
    buttonRef: targets.buttonRef,
    save,
    clear: () => dispatch({ type: 'clear' }),
    block: () => dispatch({ type: 'blocked' }),
  };
}

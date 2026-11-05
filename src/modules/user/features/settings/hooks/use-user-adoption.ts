import { type Dispatch, useRef } from 'react';

import type {
  AdoptedUser,
  ProfileLoadAction,
  UserEntityAdoption,
} from '../types/hooks/use-profile-load';

export default function useUserAdoption(dispatch: Dispatch<ProfileLoadAction>): UserEntityAdoption {
  const adopted = useRef<AdoptedUser>({ email: null, revision: 0 });

  return {
    adopt: (user): void => {
      adopted.current = { email: user.email, revision: adopted.current.revision + 1 };
      dispatch({ type: 'adopt', user });
    },
    confirm: (email: string, confirmed: boolean): void =>
      dispatch({ type: 'confirm', email, confirmed }),
    isCurrent: (email: string): boolean =>
      adopted.current.email === null || adopted.current.email === email,
    revision: (): number => adopted.current.revision,
  };
}

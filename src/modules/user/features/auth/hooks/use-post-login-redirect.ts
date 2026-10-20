import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import useAuthToken from '@auth/stores/use-auth-token';
import type { PostLoginRedirect } from '@auth/types/sign-in/post-login-redirect';
import loginRedirectTarget from '@auth/utils/login-redirect-target';

function useSignedInTransition(token: string | null): boolean {
  const previousTokenRef = useRef<string | null>(token);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const previous = previousTokenRef.current;
    previousTokenRef.current = token;
    if (token === null) setSignedIn(false);
    else if (previous === null) setSignedIn(true);
  }, [token]);

  return signedIn;
}

export default function usePostLoginRedirect(): PostLoginRedirect {
  const navigate = useNavigate();
  const { state } = useLocation();
  const signedIn = useSignedInTransition(useAuthToken());

  return {
    signedIn,
    proceed: (): void => {
      navigate(loginRedirectTarget.resolve(state), { replace: true, state: { focusMain: true } });
    },
  };
}

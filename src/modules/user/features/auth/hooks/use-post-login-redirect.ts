import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import useAuthToken from '@auth/stores/use-auth-token';
import loginRedirectTarget from '@auth/utils/login-redirect-target';

export default function usePostLoginRedirect(): void {
  const token = useAuthToken();
  const navigate = useNavigate();
  const { state } = useLocation();
  const previousTokenRef = useRef<string | null>(token);

  useEffect(() => {
    const previous = previousTokenRef.current;
    previousTokenRef.current = token;
    if (token === null || previous !== null) return;
    navigate(loginRedirectTarget.resolve(state), { replace: true, state: { focusMain: true } });
  }, [token, navigate, state]);
}

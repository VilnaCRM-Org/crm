import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

const TOKEN_PARAM = 'token';
const MAX_TOKEN_LENGTH = 255;

function readToken(search: string): string | null {
  const token = new URLSearchParams(search).get(TOKEN_PARAM)?.trim() ?? '';
  return token.length > 0 && token.length <= MAX_TOKEN_LENGTH ? token : null;
}

export default function useResetToken(): string | null {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [token] = useState(() => readToken(search));
  const stripped = useRef(false);

  useLayoutEffect(() => {
    if (stripped.current || !new URLSearchParams(search).has(TOKEN_PARAM)) return;
    stripped.current = true;
    navigate(pathname, { replace: true });
  }, [navigate, pathname, search]);

  return token;
}

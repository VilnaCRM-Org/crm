import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

const TOKEN_PARAM = 'token';
const MAX_TOKEN_LENGTH = 255;

function readToken(search: string): string | null {
  const token = new URLSearchParams(search).get(TOKEN_PARAM)?.trim() ?? '';
  return token.length > 0 && token.length <= MAX_TOKEN_LENGTH ? token : null;
}

function useTokenParamStrip(): void {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const stripped = useRef(false);

  useLayoutEffect(() => {
    if (stripped.current || !new URLSearchParams(search).has(TOKEN_PARAM)) return;
    stripped.current = true;
    navigate(pathname, { replace: true });
  }, [navigate, pathname, search]);
}

export default function useResetToken(active: boolean): string | null {
  const { search } = useLocation();
  const [token, setToken] = useState(() => readToken(search));

  useEffect(() => {
    if (!active) setToken(null);
  }, [active]);
  useTokenParamStrip();

  return token;
}

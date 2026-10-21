import { useState } from 'react';

import { AuthProviderLoader } from '@auth/stores';

export default function useAuthProviderLoader(): AuthProviderLoader {
  const [loader] = useState(() => new AuthProviderLoader());
  return loader;
}

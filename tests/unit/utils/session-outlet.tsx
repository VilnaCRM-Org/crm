import type { JSX, ReactNode } from 'react';
import { Outlet, Route, Routes } from 'react-router';

import type {
  ProtectedSession,
  ProtectedSessionContext,
} from '@/routes/types/protected-outlet-context';

export const inertSession: ProtectedSession = {
  token: () => null,
  end: () => undefined,
};

interface SessionOutletProps {
  readonly children: ReactNode;
  readonly session?: ProtectedSession | undefined;
  readonly signOut?: (() => void) | undefined;
}

export default function SessionOutlet({
  children,
  session = inertSession,
  signOut = (): void => undefined,
}: SessionOutletProps): JSX.Element {
  const context: ProtectedSessionContext = { signOut, session };

  return (
    <Routes>
      <Route element={<Outlet context={context} />}>
        <Route path="*" element={children} />
      </Route>
    </Routes>
  );
}

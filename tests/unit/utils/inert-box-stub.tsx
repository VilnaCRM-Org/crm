import type { ReactElement, ReactNode } from 'react';

interface InertBoxStubProps {
  id: string;
  inert: boolean;
  children: ReactNode;
}

// The real InertBox writes the flag to a bare `inert` attribute on an unlabelled div, which
// neither jsdom nor Testing Library exposes to a semantic query. The stub keeps the prop flowing
// and re-publishes it as the group's accessible name.
export default function InertBoxStub({ id, inert, children }: InertBoxStubProps): ReactElement {
  return (
    <div role="group" aria-label={`${id} inert=${String(inert)}`}>
      {children}
    </div>
  );
}

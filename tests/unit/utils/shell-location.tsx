import type { JSX } from 'react';
import { useLocation } from 'react-router';

export default function ShellLocation(): JSX.Element {
  const { pathname, search, state } = useLocation();

  return <output aria-label="location">{`${pathname}${search}|${JSON.stringify(state)}`}</output>;
}

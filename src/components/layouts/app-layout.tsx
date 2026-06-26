import { Outlet } from 'react-router-dom';

export default function AppLayout(): JSX.Element {
  return (
    <main>
      <Outlet />
    </main>
  );
}

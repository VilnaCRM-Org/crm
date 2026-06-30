import { Outlet } from 'react-router-dom';

export default function AppLayout(): JSX.Element {
  return (
    <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Outlet />
    </main>
  );
}

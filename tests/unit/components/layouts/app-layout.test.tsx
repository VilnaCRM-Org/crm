import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import AppLayout from '@/components/layouts/app-layout';

type Entry = Parameters<typeof MemoryRouter>[0]['initialEntries'];

function renderLayout(entries: Entry): void {
  render(
    <MemoryRouter initialEntries={entries}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>home page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  it('renders the routed content inside a main landmark', () => {
    renderLayout(['/']);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('home page')).toBeInTheDocument();
  });

  it('moves focus to the main landmark after a post-login redirect', () => {
    renderLayout([{ pathname: '/', state: { focusMain: true } }] as Entry);

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('does not steal focus on ordinary navigation', () => {
    renderLayout(['/']);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('does not steal focus when navigation state exists without the focus marker', () => {
    renderLayout([{ pathname: '/', state: { from: { pathname: '/deals' } } }] as Entry);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });
});

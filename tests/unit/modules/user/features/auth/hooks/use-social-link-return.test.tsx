import { render, renderHook } from '@testing-library/react';
import { type JSX, type ReactNode, useEffect } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import useSocialLinkReturn from '@auth/hooks/use-social-link-return';
import FakeBroadcastChannel from '@tests/unit/utils/fake-broadcast-channel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <MemoryRouter initialEntries={['/auth/callback/github']}>
    <Routes>
      <Route path="/auth/callback/:provider" element={children} />
    </Routes>
  </MemoryRouter>
);

const query = { code: 'c-1', state: 'link.s', error: null };

const posted = (): unknown[] => FakeBroadcastChannel.opened.flatMap((channel) => channel.posted);

function SearchProbe({ seen }: { seen: string[] }): null {
  useEffect(() => {
    seen.push(window.location.search);
  }, [seen]);
  return null;
}

function ReturningPopup({ seen }: { seen: string[] }): JSX.Element {
  useSocialLinkReturn(query);
  return <SearchProbe seen={seen} />;
}

describe('useSocialLinkReturn', () => {
  let close: jest.SpyInstance;

  beforeEach(() => {
    FakeBroadcastChannel.install();
    close = jest.spyOn(window, 'close').mockImplementation(() => undefined);
    window.history.replaceState(null, '', '/auth/callback/github?code=c-1&state=link.s');
  });

  afterEach(() => {
    close.mockRestore();
    FakeBroadcastChannel.uninstall();
    window.history.replaceState(null, '', '/');
  });

  it('posts the query once for its provider, strips it and closes the window', () => {
    const { rerender } = renderHook(() => useSocialLinkReturn(query), { wrapper });
    rerender();

    expect(posted()).toEqual([{ provider: 'github', ...query }]);
    expect(window.location.search).toBe('');
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('posts and closes once under StrictMode, whose effects run twice', () => {
    renderHook(() => useSocialLinkReturn(query), { wrapper, reactStrictMode: true });

    expect(posted()).toEqual([{ provider: 'github', ...query }]);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('strips the query before the first paint, ahead of every passive effect', () => {
    const seen: string[] = [];

    render(<ReturningPopup seen={seen} />, { wrapper });

    expect(seen).toEqual(['']);
  });

  it('posts again for another query', () => {
    const next = { ...query, code: 'c-2' };
    const { rerender } = renderHook((each) => useSocialLinkReturn(each), {
      wrapper,
      initialProps: query,
    });

    rerender(next);

    expect(posted()).toEqual([
      { provider: 'github', ...query },
      { provider: 'github', ...next },
    ]);
  });
});

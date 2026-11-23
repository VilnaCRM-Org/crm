import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
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

describe('useSocialLinkReturn', () => {
  beforeEach(() => {
    FakeBroadcastChannel.install();
    jest.spyOn(window, 'close').mockImplementation(() => undefined);
    window.history.replaceState(null, '', '/auth/callback/github?code=c-1&state=link.s');
  });

  afterEach(() => {
    FakeBroadcastChannel.uninstall();
    window.history.replaceState(null, '', '/');
  });

  it('posts the query once for its provider, strips it and closes the window', () => {
    const { rerender } = renderHook(() => useSocialLinkReturn(query), { wrapper });
    rerender();

    expect(posted()).toEqual([{ provider: 'github', ...query }]);
    expect(window.location.search).toBe('');
    expect(window.close).toHaveBeenCalledTimes(1);
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

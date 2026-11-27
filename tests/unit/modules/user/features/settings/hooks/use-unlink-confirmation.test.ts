import { act, renderHook } from '@testing-library/react';

import useUnlinkConfirmation from '@/modules/user/features/settings/hooks/use-unlink-confirmation';
import type {
  SocialLinks,
  SocialLinkTarget,
  UnlinkConfirmation,
} from '@/modules/user/features/settings/types/social-link';

import buildSocialLinks from '../components/social-networks/social-links-fixture';

import { github } from './social-link-test-deps';

const setup = (
  overrides: Partial<SocialLinks> = {}
): { links: SocialLinks; result: { current: UnlinkConfirmation } } => {
  const links = buildSocialLinks(overrides);
  return { links, ...renderHook(() => useUnlinkConfirmation(links)) };
};

const focusable = (): { target: SocialLinkTarget; focus: jest.Mock } => {
  const focus = jest.fn();
  const control = { focus } as unknown as HTMLElement;
  return { target: { id: 'google', label: 'Google', controlRef: { current: control } }, focus };
};

describe('useUnlinkConfirmation', () => {
  it('asks nothing at first', () => {
    expect(setup().result.current.request).toEqual({ target: null, count: 0 });
  });

  it('asks about the pressed tile without unlinking, counting every request', () => {
    const { target } = focusable();
    const { links, result } = setup();

    act(() => result.current.ask(target));
    expect(result.current.request).toEqual({ target, count: 1 });
    act(() => result.current.ask(target));
    expect(result.current.request).toEqual({ target, count: 2 });
    act(() => result.current.ask(github));
    expect(result.current.request).toEqual({ target: github, count: 3 });

    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('asks and confirms nothing while busy', () => {
    const { target, focus } = focusable();
    const { links, result } = setup({ busy: true });

    act(() => result.current.ask(target));
    act(() => result.current.confirm(target));

    expect(result.current.request).toEqual({ target: null, count: 0 });
    expect(focus).not.toHaveBeenCalled();
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('keeps an asked question open when the card turns busy before the confirm', () => {
    const { target, focus } = focusable();
    const idle = buildSocialLinks();
    const busy = { ...idle, busy: true };
    const { result, rerender } = renderHook((links) => useUnlinkConfirmation(links), {
      initialProps: idle,
    });
    act(() => result.current.ask(target));
    rerender(busy);

    act(() => result.current.confirm(target));

    expect(result.current.request).toEqual({ target, count: 1 });
    expect(focus).not.toHaveBeenCalled();
    expect(busy.unlink).not.toHaveBeenCalled();
  });

  it('cancels, keeping the count, and returns to the tile', () => {
    const { target, focus } = focusable();
    const { links, result } = setup();
    act(() => result.current.ask(target));

    act(() => result.current.cancel(target));

    expect(result.current.request).toEqual({ target: null, count: 1 });
    expect(focus).toHaveBeenCalledTimes(1);
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('confirms once, from the tile', () => {
    const { target, focus } = focusable();
    const { links, result } = setup();
    act(() => result.current.ask(target));

    act(() => result.current.confirm(target));

    expect(result.current.request.target).toBeNull();
    expect((links.unlink as jest.Mock).mock.calls).toEqual([[target]]);
    expect(focus.mock.invocationCallOrder[0]).toBeLessThan(
      (links.unlink as jest.Mock).mock.invocationCallOrder[0] ?? 0
    );
  });

  it('unlinks nothing for a second confirm of an answered question', () => {
    const { target } = focusable();
    const { links, result } = setup();
    act(() => result.current.ask(target));
    act(() => result.current.confirm(target));

    act(() => result.current.confirm(target));

    expect((links.unlink as jest.Mock).mock.calls).toEqual([[target]]);
  });

  it('unlinks nothing when nothing was asked', () => {
    const { target, focus } = focusable();
    const { links, result } = setup();

    act(() => result.current.confirm(target));

    expect(result.current.request).toEqual({ target: null, count: 0 });
    expect(focus).not.toHaveBeenCalled();
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('unlinks nothing for a tile other than the one asked about', () => {
    const { target, focus } = focusable();
    const { links, result } = setup();
    act(() => result.current.ask(target));

    act(() => result.current.confirm(github));

    expect(result.current.request).toEqual({ target, count: 1 });
    expect(focus).not.toHaveBeenCalled();
    expect(links.unlink).not.toHaveBeenCalled();
  });

  it('drops the question when another account is linked, leaving the focus alone', () => {
    const { target, focus } = focusable();
    const { links, result } = setup();
    act(() => result.current.ask(target));

    act(() => result.current.link(github));

    expect(result.current.request).toEqual({ target: null, count: 1 });
    expect((links.link as jest.Mock).mock.calls).toEqual([[github]]);
    expect(focus).not.toHaveBeenCalled();
  });

  it('survives a tile whose control is gone', () => {
    const { result } = setup();

    expect(() => act(() => result.current.cancel(github))).not.toThrow();
  });
});

import { act, renderHook } from '@testing-library/react';

import type { ToastDraft, ToastDraftSet } from '@/components/types/ui-toast';
import useToastQueue from '@/hooks/use-toast-queue';

const success = (message: string): ToastDraft => ({ tone: 'success', message });

const failure = (message: string): ToastDraft => ({ tone: 'error', message });

const set = (...items: ToastDraft[]): ToastDraftSet => ({ items });

describe('useToastQueue', () => {
  it('starts empty with an empty announcement', () => {
    const { result } = renderHook(() => useToastQueue());

    expect(result.current.toasts).toEqual({ items: [] });
    expect(result.current.announcement).toBe('');
  });

  it('adds three drafts in one commit, in order, with consecutive ids', () => {
    let commits = 0;
    const { result } = renderHook(() => {
      commits += 1;
      return useToastQueue();
    });
    const before = commits;

    act(() => result.current.show(set(success('one'), success('two'), failure('three'))));

    expect(commits - before).toBe(1);
    expect(result.current.toasts.items).toEqual([
      { id: 1, tone: 'success', message: 'one' },
      { id: 2, tone: 'success', message: 'two' },
      { id: 3, tone: 'error', message: 'three' },
    ]);
  });

  it('keeps the action of a draft', () => {
    const { result } = renderHook(() => useToastQueue());
    const onActivate = jest.fn();

    act(() =>
      result.current.show(set({ ...failure('failed'), action: { label: 'Retry', onActivate } }))
    );

    expect(result.current.toasts.items[0]?.action).toEqual({ label: 'Retry', onActivate });
  });

  it('continues the id counter across calls', () => {
    const { result } = renderHook(() => useToastQueue());

    act(() => result.current.show(set(success('one'))));
    act(() => result.current.show(set(success('two'))));

    expect(result.current.toasts.items.map((toast) => toast.id)).toEqual([1, 2]);
  });

  it('drops the oldest toast of either tone when a fourth arrives', () => {
    const { result } = renderHook(() => useToastQueue());

    act(() => result.current.show(set(failure('oldest'), success('two'), success('three'))));
    act(() => result.current.show(set(success('four'))));

    expect(result.current.toasts.items.map((toast) => toast.message)).toEqual([
      'two',
      'three',
      'four',
    ]);
  });

  it('keeps only the last three of a draft set larger than the limit', () => {
    const { result } = renderHook(() => useToastQueue());

    act(() => result.current.show(set(success('a'), success('b'), success('c'), success('d'))));

    expect(result.current.toasts.items.map((toast) => toast.message)).toEqual(['b', 'c', 'd']);
  });

  it('removes a toast by id and keeps the others', () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => result.current.show(set(success('one'), success('two'))));

    act(() => result.current.dismiss(1));

    expect(result.current.toasts.items.map((toast) => toast.message)).toEqual(['two']);
  });

  it('ignores a dismissal for an id that is not shown', () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => result.current.show(set(success('one'))));

    act(() => result.current.dismiss(99));

    expect(result.current.toasts.items).toHaveLength(1);
  });

  it('announces the success texts of the latest show as one utterance', () => {
    const { result } = renderHook(() => useToastQueue());

    act(() => result.current.show(set(success('one'), success('two'), success('three'))));

    expect(result.current.announcement.replace('​', '')).toBe('one two three');
  });

  it('never puts an error text into the announcement', () => {
    const { result } = renderHook(() => useToastQueue());

    act(() => result.current.show(set(success('saved'), failure('broken'))));

    expect(result.current.announcement).not.toContain('broken');
    expect(result.current.announcement).toContain('saved');
  });

  it('announces nothing for a show that only holds errors', () => {
    const { result } = renderHook(() => useToastQueue());
    act(() => result.current.show(set(success('saved'))));

    act(() => result.current.show(set(failure('broken'))));

    expect(result.current.announcement).toBe('');
  });

  it('changes the text of an identical repeat through the alternating mark', () => {
    const { result } = renderHook(() => useToastQueue());

    act(() => result.current.show(set(success('saved'))));
    const first = result.current.announcement;
    act(() => result.current.show(set(success('saved'))));
    const second = result.current.announcement;
    act(() => result.current.show(set(success('saved'))));
    const third = result.current.announcement;

    expect(first).toBe('saved​');
    expect(second).toBe('saved');
    expect(third).toBe(first);
  });

  it('never dismisses a toast on its own', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useToastQueue());
    act(() => result.current.show(set(success('one'), failure('two'), success('three'))));

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current.toasts.items).toHaveLength(3);
    jest.useRealTimers();
  });
});

import { createRef } from 'react';

import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';
import CLEARED_NOTIFICATION_OUTLET from '@/lib/notifications/cleared-notification-outlet';
import NotificationOutletActions from '@/lib/notifications/notification-outlet-actions';
import type {
  NotificationFocusReturn,
  NotificationOutletState,
  NotificationTranslate,
} from '@/lib/notifications/types/notification-outlet-state';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import { buildNotificationDraft, buildNotificationDraftSet } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const CLOCK_VALUE = 1_789_000_000_000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const translate: NotificationTranslate = (key) => `text:${key}`;

const createActions = (): NotificationOutletActions =>
  new NotificationOutletActions(useNotificationOutletStore, () => CLOCK_VALUE);

const readState = (): NotificationOutletState => useNotificationOutletStore.getState();

describe('NotificationOutletActions', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => jest.useRealTimers());

  describe('raise', () => {
    it('shows three drafts in raised order with ids and the clock value', () => {
      const drafts = buildNotificationDraftSet(3);

      createActions().raise(drafts, translate);

      const state = readState();
      const expected = drafts.items.map((draft, index) => ({
        ...draft,
        id: index + 1,
        raisedAt: CLOCK_VALUE,
      }));
      expect(state.shown).toEqual({ items: expected });
      expect(state.raised).toEqual({ items: expected });
      expect(state.revision).toBe(1);
      expect(state.nextId).toBe(4);
    });

    it('announces the three texts joined by a space with the mark on the first raise', () => {
      const drafts = buildNotificationDraftSet(3);

      createActions().raise(drafts, translate);

      const spoken = drafts.items.map((draft) => `text:${draft.messageKey}`).join(' ');
      expect(readState().announcement).toEqual({
        polite: `${spoken}${ALTERNATING_MARK}`,
        assertive: '',
      });
    });

    it('keeps the newest three shown and records only the new draft as raised', () => {
      const actions = createActions();
      actions.raise(buildNotificationDraftSet(3), translate);
      useNotificationOutletStore.setState({ recorded: readState().revision });
      const fourth = buildNotificationDraft();

      actions.raise({ items: [fourth] }, translate);

      const state = readState();
      expect(state.shown.items.map((item) => item.id)).toEqual([2, 3, 4]);
      expect(state.shown.items[2]).toMatchObject({ ...fourth, id: 4 });
      expect(state.raised.items).toHaveLength(1);
      expect(state.raised.items[0]).toMatchObject({ ...fourth, id: 4 });
    });

    it('shows and announces only the newest three of one oversized raise', () => {
      const drafts = buildNotificationDraftSet(4);

      createActions().raise(drafts, translate);

      const state = readState();
      expect(state.shown.items.map((item) => item.id)).toEqual([2, 3, 4]);
      expect(state.raised.items.map((item) => item.id)).toEqual([1, 2, 3, 4]);
      const spoken = drafts.items
        .slice(1)
        .map((draft) => `text:${draft.messageKey}`)
        .join(' ');
      expect(state.announcement.polite).toBe(`${spoken}${ALTERNATING_MARK}`);
    });

    it('speaks successes politely and errors assertively, alternating the mark per raise', () => {
      const actions = createActions();
      const success = buildNotificationDraft({ kind: 'success' });
      const error = buildNotificationDraft({
        kind: 'error',
        messageKey: 'settings.toasts.save_failed',
      });
      const raiseBoth = (): void => actions.raise({ items: [success, error] }, translate);
      const polite = `text:${success.messageKey}`;
      const assertive = `text:${error.messageKey}`;

      raiseBoth();
      expect(readState().announcement).toEqual({
        polite: `${polite}${ALTERNATING_MARK}`,
        assertive: `${assertive}${ALTERNATING_MARK}`,
      });

      raiseBoth();
      expect(readState().announcement).toEqual({ polite, assertive });

      raiseBoth();
      expect(readState().announcement).toEqual({
        polite: `${polite}${ALTERNATING_MARK}`,
        assertive: `${assertive}${ALTERNATING_MARK}`,
      });
    });

    it('flips the mark for a raise that speaks nothing in one of the two regions', () => {
      const actions = createActions();
      const error = buildNotificationDraft({ kind: 'error' });

      actions.raise({ items: [error] }, translate);

      expect(readState().announcement.polite).toBe('');
      expect(readState().marked).toBe(true);
      actions.raise({ items: [error] }, translate);
      expect(readState().marked).toBe(false);
    });

    it('keeps no timer: every item is still shown ten minutes later', () => {
      jest.useFakeTimers();
      createActions().raise(buildNotificationDraftSet(3), translate);

      jest.advanceTimersByTime(TEN_MINUTES_MS);

      expect(readState().shown.items).toHaveLength(3);
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('dismiss, dismissAll', () => {
    const raiseSeveral = (actions: NotificationOutletActions): void => {
      actions.raise(buildNotificationDraftSet(2), translate);
      actions.raise(
        { items: [buildNotificationDraft(), buildNotificationDraft({ kind: 'error' })] },
        translate
      );
    };

    it('dismiss removes exactly the one item', () => {
      const actions = createActions();
      raiseSeveral(actions);
      const before = readState();

      actions.dismiss(3);

      expect(readState()).toEqual({
        ...before,
        shown: { items: before.shown.items.filter((item) => item.id !== 3) },
      });
      expect(readState().shown.items.map((item) => item.id)).toEqual([2, 4]);
      expect(readState().raised).toBe(before.raised);
    });

    it('dismiss of an unknown id changes nothing visible', () => {
      const actions = createActions();
      raiseSeveral(actions);
      const before = readState();

      actions.dismiss(99);

      expect(readState().shown).toEqual(before.shown);
    });

    it('dismissAll empties shown and nothing else', () => {
      const actions = createActions();
      raiseSeveral(actions);
      const before = readState();

      actions.dismissAll();

      expect(readState()).toEqual({ ...before, shown: { items: [] } });
    });
  });

  describe('publishFocus and clear', () => {
    const focus = (): NotificationFocusReturn => ({
      primary: createRef<HTMLElement>(),
      fallback: createRef<HTMLElement>(),
    });

    it('publishes both refs and clear resets them to null', () => {
      const actions = createActions();
      const published = focus();

      actions.publishFocus(published);

      expect(readState().focus).toBe(published);
      expect(readState().focus?.primary).toBe(published.primary);
      expect(readState().focus?.fallback).toBe(published.fallback);

      actions.clear();

      expect(readState().focus).toBeNull();
    });

    it('clear resets the four outlet fields and keeps the counters', () => {
      const actions = createActions();
      actions.raise(buildNotificationDraftSet(3), translate);
      actions.raise(buildNotificationDraftSet(1), translate);
      actions.raise(buildNotificationDraftSet(1, { kind: 'error' }), translate);
      actions.publishFocus(focus());
      const before = readState();

      actions.clear();

      const { shown, raised, announcement, focus: cleared } = CLEARED_NOTIFICATION_OUTLET;
      expect(readState()).toEqual({
        ...before,
        shown,
        raised,
        announcement,
        focus: cleared,
      });
      expect(readState()).toMatchObject({
        revision: 3,
        nextId: 6,
        marked: true,
      });
    });

    it('continues revision and ids after a clear', () => {
      const actions = createActions();
      actions.raise(buildNotificationDraftSet(1), translate);
      actions.raise(buildNotificationDraftSet(1), translate);
      actions.raise(buildNotificationDraftSet(1), translate);
      actions.clear();

      actions.raise(buildNotificationDraftSet(1), translate);

      const state = readState();
      expect(state.revision).toBe(4);
      expect(state.shown.items.map((item) => item.id)).toEqual([4]);
      expect(state.marked).toBe(false);
    });
  });
});

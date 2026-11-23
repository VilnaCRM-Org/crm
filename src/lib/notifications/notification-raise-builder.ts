import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';

import type { NotificationDraftSet } from './types/notification-draft';
import type { NotificationKind } from './types/notification-kind';
import type {
  NotificationAnnouncement,
  NotificationOutletState,
  NotificationTranslate,
} from './types/notification-outlet-state';
import type { NotificationRaiseRequest } from './types/notification-raise-request';
import type { ShownNotification } from './types/shown-notification';

const MAX_SHOWN = 3;
const SPOKEN_SEPARATOR = ' ';

class NotificationRaiseBuilder {
  public build(request: NotificationRaiseRequest): NotificationOutletState {
    const { state, drafts, translate, raisedAt } = request;
    const added = this.stamp(state, drafts, raisedAt);
    const marked = !state.marked;

    return {
      ...state,
      shown: { items: [...state.shown.items, ...added].slice(-MAX_SHOWN) },
      raised: { items: added },
      announcement: this.announce(added.slice(-MAX_SHOWN), translate, marked),
      revision: state.revision + 1,
      nextId: state.nextId + added.length,
      marked,
    };
  }

  private stamp(
    state: NotificationOutletState,
    drafts: NotificationDraftSet,
    raisedAt: number
  ): readonly ShownNotification[] {
    return drafts.items.map((draft, index): ShownNotification => ({
      ...draft,
      id: state.nextId + index,
      raisedAt,
    }));
  }

  private announce(
    items: readonly ShownNotification[],
    translate: NotificationTranslate,
    marked: boolean
  ): NotificationAnnouncement {
    return {
      polite: this.suffixed(this.spoken(items, 'success', translate), marked),
      assertive: this.suffixed(this.spoken(items, 'error', translate), marked),
    };
  }

  private spoken(
    items: readonly ShownNotification[],
    kind: NotificationKind,
    translate: NotificationTranslate
  ): string {
    return items
      .filter((item) => item.kind === kind)
      .map((item) => translate(item.messageKey))
      .join(SPOKEN_SEPARATOR);
  }

  private suffixed(text: string, marked: boolean): string {
    return text === '' || !marked ? text : `${text}${ALTERNATING_MARK}`;
  }
}

export default new NotificationRaiseBuilder();

import { type JSX, useRef } from 'react';

import Notice from '@/modules/user/features/notifications/components/bell-outcome-notice';

export default function OutcomeNoticeHeader(): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);

  return (
    <header>
      <button type="button" ref={bell}>
        Сповіщення
      </button>
      <Notice bellRef={bell} />
    </header>
  );
}

import type { TOptions } from 'i18next';

import type { NotificationMessageValues } from './types/notification-draft';

class NotificationValuesAdapter {
  public options(values: NotificationMessageValues | undefined): TOptions {
    return Object.fromEntries((values?.items ?? []).map(({ name, value }) => [name, value]));
  }
}

export default new NotificationValuesAdapter();

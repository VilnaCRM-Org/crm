import type { Page } from '@playwright/test';

export interface NotificationFootprint {
  readonly scriptChunks: () => readonly string[];
  readonly scriptLoads: (chunk: string) => number;
  readonly notificationRequests: () => readonly string[];
  readonly notificationStorageWrites: () => Promise<readonly string[]>;
}

const STORAGE_WRITES_KEY = '__notificationStorageWrites';
const NOTIFICATION_PATTERN = /notification/i;
const DATA_REQUEST_TYPES = new Set(['fetch', 'xhr', 'eventsource', 'websocket']);

const chunkNameOf = (url: string): string =>
  new URL(url).pathname.split('/').at(-1)?.split('.')[0] ?? '';

async function recordStorageWrites(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    const writes: string[] = [];
    Object.defineProperty(window, key, { value: writes });
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function recordSetItem(name: string, value: string): void {
      writes.push(`storage:${name}`);
      setItem.call(this, name, value);
    };
    const open = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function recordOpen(
      ...args: Parameters<IDBFactory['open']>
    ): IDBOpenDBRequest {
      writes.push(`indexeddb:${args[0]}`);
      return open.apply(this, args);
    };
    const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: (): string | undefined => cookie?.get?.call(document),
      set: (value: string): void => {
        writes.push(`cookie:${value.split('=')[0] ?? ''}`);
        cookie?.set?.call(document, value);
      },
    });
  }, STORAGE_WRITES_KEY);
}

export async function watchNotificationFootprint(page: Page): Promise<NotificationFootprint> {
  const scripts: string[] = [];
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(chunkNameOf(request.url()));
    if (!DATA_REQUEST_TYPES.has(request.resourceType())) return;
    const sent = `${request.url()} ${request.postData() ?? ''}`;
    if (NOTIFICATION_PATTERN.test(sent)) requests.push(sent);
  });
  await recordStorageWrites(page);

  return {
    scriptChunks: () => [...new Set(scripts)].sort(),
    scriptLoads: (chunk: string) => scripts.filter((name) => name === chunk).length,
    notificationRequests: () => requests,
    notificationStorageWrites: async (): Promise<readonly string[]> => {
      const writes = await page.evaluate(
        (key: string) => Reflect.get(window, key) as string[],
        STORAGE_WRITES_KEY
      );
      return writes.filter((write) => NOTIFICATION_PATTERN.test(write));
    },
  };
}

import type { Page } from '@playwright/test';

export interface NotificationFootprint {
  readonly scriptChunks: () => readonly string[];
  readonly scriptLoads: (chunk: string) => number;
  readonly notificationRequests: () => readonly string[];
  readonly notificationStorageWrites: () => Promise<readonly string[]>;
}

const STORAGE_WRITES_KEY = '__notificationStorageWrites';
const NOTIFICATION_PATTERN = /notification|settings\.toasts|\/api\/events\//i;
const DATA_REQUEST_TYPES = new Set(['fetch', 'xhr', 'eventsource', 'websocket']);

const chunkNameOf = (url: string): string =>
  new URL(url).pathname.split('/').at(-1)?.split('.')[0] ?? '';

async function recordStorageWrites(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    const writes: string[] = [];
    Object.defineProperty(window, key, { value: writes });
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function recordSetItem(name: string, value: string): void {
      writes.push(`storage:${name}=${value}`);
      setItem.call(this, name, value);
    };
    const { removeItem } = Storage.prototype;
    Storage.prototype.removeItem = function recordRemoveItem(name: string): void {
      writes.push(`storage:${name}`);
      removeItem.call(this, name);
    };
    const stored = (store: IDBObjectStore, value: unknown): string =>
      `indexeddb:${store.transaction.db.name}/${store.name}=${JSON.stringify(value)}`;
    const { add, put } = IDBObjectStore.prototype;
    IDBObjectStore.prototype.add = function recordAdd(
      ...args: Parameters<IDBObjectStore['add']>
    ): IDBRequest<IDBValidKey> {
      writes.push(stored(this, args[0]));
      return add.apply(this, args);
    };
    IDBObjectStore.prototype.put = function recordPut(
      ...args: Parameters<IDBObjectStore['put']>
    ): IDBRequest<IDBValidKey> {
      writes.push(stored(this, args[0]));
      return put.apply(this, args);
    };
    const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: (): string | undefined => cookie?.get?.call(document),
      set: (value: string): void => {
        writes.push(`cookie:${value}`);
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
        (key: string) => [
          ...(Reflect.get(window, key) as string[]),
          ...[window.localStorage, window.sessionStorage].flatMap((storage) =>
            Object.entries(storage).map(([name, value]) => `storage:${name}=${String(value)}`)
          ),
        ],
        STORAGE_WRITES_KEY
      );
      return writes.filter((write) => NOTIFICATION_PATTERN.test(write));
    },
  };
}

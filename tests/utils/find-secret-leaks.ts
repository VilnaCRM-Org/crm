import type { Page } from '@playwright/test';

export interface ClientStateDump {
  readonly url: string;
  readonly title: string;
  readonly historyState: string;
  readonly localStorage: string;
  readonly sessionStorage: string;
  readonly indexedDB: string;
  readonly unreadable: readonly string[];
}

export type ScannedPlace = Exclude<keyof ClientStateDump, 'unreadable'>;

export interface SecretLeak {
  readonly place: ScannedPlace;
  readonly secret: string;
}

export type NamedSecrets = Readonly<Record<string, string>>;

type PageEvaluator = Pick<Page, 'evaluate'>;

export async function readClientState(): Promise<ClientStateDump> {
  const entriesOf = (storage: Storage): string =>
    Object.keys(storage)
      .map((key) => `${key}=${storage.getItem(key)}`)
      .join('\n');

  const serialise = (value: unknown): string => {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key: string, item: unknown): unknown => {
      if (typeof item === 'bigint') return item.toString();
      if (typeof item !== 'object' || item === null) return item;
      if (seen.has(item)) return '[Repeated]';
      seen.add(item);
      return item;
    });
  };

  const dumpDatabase = (name: string): Promise<string | null> =>
    new Promise((resolve) => {
      const opened = indexedDB.open(name);
      opened.onerror = (): void => resolve('');
      opened.onsuccess = (): void => {
        const database = opened.result;
        const stores = Array.from(database.objectStoreNames);
        if (stores.length === 0) {
          database.close();
          resolve('');
          return;
        }
        const transaction = database.transaction(stores, 'readonly');
        const rows: unknown[] = [];
        const collect = (event: Event): void => {
          rows.push((event.target as IDBRequest).result);
        };
        stores.forEach((store) => {
          const objectStore = transaction.objectStore(store);
          objectStore.getAll().onsuccess = collect;
          objectStore.getAllKeys().onsuccess = collect;
        });
        transaction.oncomplete = (): void => {
          database.close();
          try {
            resolve(serialise(rows));
          } catch {
            resolve(null);
          }
        };
        transaction.onerror = (): void => {
          database.close();
          resolve('');
        };
      };
    });

  const databases = await indexedDB.databases();
  const names = databases.flatMap((database) => (database.name ? [database.name] : []));
  const dumps = await Promise.all(names.map(dumpDatabase));

  return {
    url: window.location.href,
    title: document.title,
    historyState: JSON.stringify(window.history.state),
    localStorage: entriesOf(window.localStorage),
    sessionStorage: entriesOf(window.sessionStorage),
    indexedDB: JSON.stringify([names, dumps]),
    unreadable: names.filter((_name, index) => dumps[index] === null),
  };
}

const PLACES: readonly ScannedPlace[] = [
  'url',
  'title',
  'historyState',
  'localStorage',
  'sessionStorage',
  'indexedDB',
];

const forms = (secret: string): readonly string[] => [
  secret,
  encodeURIComponent(secret),
  JSON.stringify(secret).slice(1, -1),
];

export async function findSecretLeaks(
  page: PageEvaluator,
  secrets: NamedSecrets
): Promise<SecretLeak[]> {
  const dump = await page.evaluate(readClientState);
  if (dump.unreadable.length > 0) {
    throw new Error(`IndexedDB could not be scanned: ${dump.unreadable.join(', ')}`);
  }

  return PLACES.flatMap((place) =>
    Object.entries(secrets)
      .filter(([, value]) => forms(value).some((form) => dump[place].includes(form)))
      .map(([name]) => ({ place, secret: name }))
  );
}

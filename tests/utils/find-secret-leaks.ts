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

  const tagOf = (item: object): string => Object.prototype.toString.call(item).slice(8, -1);

  const keep = (item: object): unknown => item;

  const decode = (item: object): unknown => new TextDecoder().decode(item as ArrayBuffer);

  const refuse = (item: object): never => {
    throw new Error(`Cannot serialise a ${tagOf(item)}`);
  };

  const byteTags = [
    'ArrayBuffer',
    'DataView',
    'Int8Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float16Array',
    'Float32Array',
    'Float64Array',
    'BigInt64Array',
    'BigUint64Array',
  ];

  const readers = new Map<string, (item: object) => unknown>([
    ['Map', (item): unknown => Array.from(item as Map<unknown, unknown>)],
    ['Set', (item): unknown => Array.from(item as Set<unknown>)],
    ...byteTags.map((tag): [string, (item: object) => unknown] => [tag, decode]),
    ...['Object', 'Array', 'Number', 'String', 'Boolean'].map(
      (tag): [string, (item: object) => unknown] => [tag, keep]
    ),
  ]);

  const readable = (item: object): unknown => (readers.get(tagOf(item)) ?? refuse)(item);

  const serialise = (value: unknown): string => {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key: string, item: unknown): unknown => {
      if (typeof item === 'bigint') return item.toString();
      if (typeof item !== 'object' || item === null) return item;
      if (seen.has(item)) return '[Repeated]';
      seen.add(item);
      return readable(item);
    });
  };

  const serialiseOrNull = (value: unknown): Promise<string | null> =>
    new Promise<string>((resolve) => resolve(serialise(value))).catch(() => null);

  const collectRows = (transaction: IDBTransaction, stores: string[], rows: unknown[]): void => {
    const collect = (event: Event): void => {
      rows.push((event.target as IDBRequest).result);
    };
    stores.forEach((store) => {
      const objectStore = transaction.objectStore(store);
      objectStore.getAll().onsuccess = collect;
      objectStore.getAllKeys().onsuccess = collect;
    });
  };

  const readStores = (database: IDBDatabase, stores: string[]): Promise<string | null> => {
    const rows: unknown[] = [];
    const transaction = database.transaction(stores, 'readonly');
    collectRows(transaction, stores, rows);
    return new Promise((resolve) => {
      transaction.oncomplete = (): void => resolve(serialiseOrNull(rows));
      transaction.onerror = (): void => resolve(null);
    });
  };

  const dumpStores = async (database: IDBDatabase): Promise<string | null> => {
    const stores = Array.from(database.objectStoreNames);
    const dump = stores.length === 0 ? '' : await readStores(database, stores);
    database.close();
    return dump;
  };

  const dumpDatabase = (name: string): Promise<string | null> =>
    new Promise((resolve) => {
      const opened = indexedDB.open(name);
      opened.onerror = (): void => resolve(null);
      opened.onsuccess = (): void => resolve(dumpStores(opened.result));
    });

  const databases = await indexedDB.databases();
  const names = databases.flatMap((database) => database.name || []);
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

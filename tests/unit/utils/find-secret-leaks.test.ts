import { buildPassword, buildToken } from '@tests/builders';
import {
  findSecretLeaks,
  readClientState,
  type NamedSecrets,
} from '@tests/utils/find-secret-leaks';

type PageEvaluator = Parameters<typeof findSecretLeaks>[0];

interface FakeStore {
  readonly name: string;
  readonly rows: readonly unknown[];
}

interface FakeDatabase {
  readonly name: string;
  readonly stores: readonly FakeStore[];
  readonly failTransaction?: boolean;
}

const livePage: PageEvaluator = {
  evaluate: ((run: () => unknown) => Promise.resolve(run())) as PageEvaluator['evaluate'],
};

const installIndexedDb = (databases: readonly FakeDatabase[], failOpen = false): void => {
  const open = (name: string): IDBOpenDBRequest => {
    const request = {} as IDBOpenDBRequest;
    const found = databases.find((database) => database.name === name);
    queueMicrotask(() => {
      if (failOpen || found === undefined) {
        request.onerror?.(new Event('error') as never);
        return;
      }
      const closed = { value: false };
      const transaction = {} as IDBTransaction;
      const database = {
        objectStoreNames: found.stores.map((store) => store.name),
        close: (): void => {
          closed.value = true;
        },
        transaction: (): IDBTransaction => {
          setTimeout(() => {
            if (found.failTransaction) {
              transaction.onerror?.(new Event('error') as never);
              return;
            }
            transaction.oncomplete?.(new Event('complete'));
          });
          return transaction;
        },
      } as unknown as IDBDatabase;
      Object.assign(transaction, {
        objectStore: (store: string): IDBObjectStore =>
          ({
            getAll: (): IDBRequest => {
              const getAll = {} as IDBRequest;
              queueMicrotask(() =>
                getAll.onsuccess?.({
                  target: { result: found.stores.find((s) => s.name === store)?.rows },
                } as never)
              );
              return getAll;
            },
          }) as unknown as IDBObjectStore,
      });
      Object.defineProperty(request, 'result', { value: database });
      request.onsuccess?.(new Event('success'));
    });
    return request;
  };
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: {
      databases: async (): Promise<IDBDatabaseInfo[]> => [
        ...databases.map((database) => ({ name: database.name })),
        {},
      ],
      open,
    },
  });
};

describe('findSecretLeaks', () => {
  const token = buildToken();
  const password = buildPassword();
  const secrets: NamedSecrets = { token, password };

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/sign-in');
    document.title = 'Sign in';
    installIndexedDb([]);
  });

  it('reports nothing for a clean page', async () => {
    window.localStorage.setItem('theme', 'dark');

    expect(await findSecretLeaks(livePage, secrets)).toEqual([]);
  });

  it('names every place that holds a secret, never the secret itself', async () => {
    window.history.replaceState({ token }, '', `/sign-in?next=${password}`);
    window.localStorage.setItem('session', token);
    window.sessionStorage.setItem('draft', password);
    document.title = `Code ${token}`;
    installIndexedDb([{ name: 'app', stores: [{ name: 'tokens', rows: [[{ token }]] }] }]);

    const leaks = await findSecretLeaks(livePage, secrets);

    expect(leaks).toEqual([
      { place: 'url', secret: 'password' },
      { place: 'title', secret: 'token' },
      { place: 'historyState', secret: 'token' },
      { place: 'localStorage', secret: 'token' },
      { place: 'sessionStorage', secret: 'password' },
      { place: 'indexedDB', secret: 'token' },
    ]);
    expect(JSON.stringify(leaks)).not.toContain(token);
    expect(JSON.stringify(leaks)).not.toContain(password);
  });

  it('finds a secret in its URL-encoded and JSON-escaped forms', async () => {
    const odd = 'p@ss word"1';
    window.history.replaceState(null, '', `/sign-in?p=${encodeURIComponent(odd)}`);
    window.localStorage.setItem('copy', JSON.stringify({ odd }));

    expect(await findSecretLeaks(livePage, { odd })).toEqual([
      { place: 'url', secret: 'odd' },
      { place: 'localStorage', secret: 'odd' },
    ]);
  });

  it('passes the in-page reader to evaluate', async () => {
    const evaluate = jest.fn().mockResolvedValue({
      url: '',
      title: '',
      historyState: 'null',
      localStorage: '[]',
      sessionStorage: '[]',
      indexedDB: '[[],[]]',
    });

    await findSecretLeaks({ evaluate } as unknown as PageEvaluator, secrets);

    expect(evaluate).toHaveBeenCalledWith(readClientState);
  });
});

describe('readClientState', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/sign-in');
    document.title = 'Sign in';
  });

  it('dumps the url, title, history state and both storages', async () => {
    installIndexedDb([]);
    window.history.replaceState({ from: '/boards' }, '', '/sign-in');
    window.localStorage.setItem('a', '1');
    window.sessionStorage.setItem('b', '2');

    expect(await readClientState()).toEqual({
      url: `${window.location.origin}/sign-in`,
      title: 'Sign in',
      historyState: '{"from":"/boards"}',
      localStorage: 'a=1',
      sessionStorage: 'b=2',
      indexedDB: '[[],[]]',
    });
  });

  it('dumps every row of every object store of every database', async () => {
    installIndexedDb([
      { name: 'one', stores: [{ name: 's', rows: [['x']] }] },
      { name: 'two', stores: [] },
    ]);

    const state = await readClientState();

    expect(state.indexedDB).toBe('[["one","two"],["[[[\\"x\\"]]]",""]]');
  });

  it('keeps going when a database fails to open or its transaction fails', async () => {
    installIndexedDb([
      { name: 'broken', stores: [{ name: 's', rows: [] }], failTransaction: true },
    ]);

    expect((await readClientState()).indexedDB).toBe('[["broken"],[""]]');

    installIndexedDb([{ name: 'gone', stores: [] }], true);

    expect((await readClientState()).indexedDB).toBe('[["gone"],[""]]');
  });
});

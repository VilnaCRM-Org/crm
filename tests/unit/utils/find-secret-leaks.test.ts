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
  readonly keys?: readonly unknown[];
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
      const answer = (result: unknown): IDBRequest => {
        const request = {} as IDBRequest;
        queueMicrotask(() => request.onsuccess?.({ target: { result } } as never));
        return request;
      };
      const storeOf = (store: string): FakeStore | undefined =>
        found.stores.find((candidate) => candidate.name === store);
      Object.assign(transaction, {
        objectStore: (store: string): IDBObjectStore =>
          ({
            getAll: (): IDBRequest => answer(storeOf(store)?.rows),
            getAllKeys: (): IDBRequest => answer(storeOf(store)?.keys ?? []),
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
      unreadable: [],
    });

    await findSecretLeaks({ evaluate } as unknown as PageEvaluator, secrets);

    expect(evaluate).toHaveBeenCalledWith(readClientState);
  });

  it('finds a secret held only as an out-of-line key', async () => {
    installIndexedDb([{ name: 'app', stores: [{ name: 'sessions', rows: [], keys: [token] }] }]);

    expect(await findSecretLeaks(livePage, secrets)).toEqual([
      { place: 'indexedDB', secret: 'token' },
    ]);
  });

  it.each([
    ['a Map value', (): unknown => new Map([['session', token]])],
    ['a Map key', (): unknown => new Map([[token, 'session']])],
    ['a Set', (): unknown => new Set([token])],
    ['an ArrayBuffer', (): unknown => new TextEncoder().encode(token).buffer],
    ['a typed array', (): unknown => new TextEncoder().encode(token)],
    ['a DataView', (): unknown => new DataView(new TextEncoder().encode(token).buffer)],
  ])('finds a secret kept inside %s', async (_name, build) => {
    installIndexedDb([{ name: 'app', stores: [{ name: 's', rows: [{ held: build() }] }] }]);

    expect(await findSecretLeaks(livePage, secrets)).toEqual([
      { place: 'indexedDB', secret: 'token' },
    ]);
  });

  it.each([
    ['a Blob', (): unknown => new Blob([token])],
    ['a File', (): unknown => new File([token], 'session.txt')],
    ['an Error', (): unknown => new Error(token)],
  ])('fails instead of reporting a clean page when a store holds %s', async (_name, build) => {
    installIndexedDb([{ name: 'opaque', stores: [{ name: 's', rows: [{ held: build() }] }] }]);

    await expect(findSecretLeaks(livePage, secrets)).rejects.toThrow(
      'IndexedDB could not be scanned: opaque'
    );
  });

  it('fails instead of reporting a clean page when a database cannot be serialised', async () => {
    const unserialisable = {
      toJSON: (): never => {
        throw new Error('unserialisable');
      },
    };
    installIndexedDb([{ name: 'bad', stores: [{ name: 's', rows: [unserialisable] }] }]);

    await expect(findSecretLeaks(livePage, secrets)).rejects.toThrow(
      'IndexedDB could not be scanned: bad'
    );
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
      unreadable: [],
    });
  });

  it('dumps every row and every key of every object store of every database', async () => {
    installIndexedDb([
      { name: 'one', stores: [{ name: 's', rows: [['x']], keys: ['k'] }] },
      { name: 'two', stores: [] },
    ]);

    const state = await readClientState();

    expect(state.indexedDB).toBe('[["one","two"],["[[[\\"x\\"]],[\\"k\\"]]",""]]');
    expect(state.unreadable).toEqual([]);
  });

  it('serialises a BigInt as its digits and a repeated or cyclic object as a marker', async () => {
    const cyclic: { a: number; self?: unknown } = { a: 1 };
    cyclic.self = cyclic;
    installIndexedDb([
      { name: 'odd', stores: [{ name: 's', rows: [{ n: BigInt(10), cyclic }], keys: [] }] },
    ]);

    const state = await readClientState();

    expect(JSON.parse(state.indexedDB)).toEqual([
      ['odd'],
      ['[[{"n":"10","cyclic":{"a":1,"self":"[Repeated]"}}],[]]'],
    ]);
    expect(state.unreadable).toEqual([]);
  });

  it('serialises a Map as its entries, a Set as its items and bytes as text', async () => {
    const bytes = new TextEncoder().encode('bytes');
    installIndexedDb([
      {
        name: 'typed',
        stores: [
          {
            name: 's',
            rows: [
              {
                map: new Map([['k', new Set(['v'])]]),
                buffer: bytes.buffer,
                view: bytes,
                plain: Object.create(null) as object,
              },
            ],
            keys: [],
          },
        ],
      },
    ]);

    const state = await readClientState();

    expect(JSON.parse(state.indexedDB)).toEqual([
      ['typed'],
      ['[[{"map":[["k",["v"]]],"buffer":"bytes","view":"bytes","plain":{}}],[]]'],
    ]);
    expect(state.unreadable).toEqual([]);
  });

  it('marks a Map that contains itself as repeated', async () => {
    const map = new Map<string, unknown>();
    map.set('self', map);
    installIndexedDb([{ name: 'loop', stores: [{ name: 's', rows: [map], keys: [] }] }]);

    const state = await readClientState();

    expect(JSON.parse(state.indexedDB)).toEqual([['loop'], ['[[[["self","[Repeated]"]]],[]]']]);
  });

  it('settles a database it cannot serialise as unreadable rather than hanging', async () => {
    const unserialisable = {
      toJSON: (): never => {
        throw new Error('unserialisable');
      },
    };
    installIndexedDb([
      { name: 'bad', stores: [{ name: 's', rows: [unserialisable] }] },
      { name: 'good', stores: [{ name: 's', rows: ['y'] }] },
    ]);

    const state = await readClientState();

    expect(state.indexedDB).toBe('[["bad","good"],[null,"[[\\"y\\"],[]]"]]');
    expect(state.unreadable).toEqual(['bad']);
  });

  it('keeps going when a database fails to open or its transaction fails', async () => {
    installIndexedDb([
      { name: 'broken', stores: [{ name: 's', rows: [] }], failTransaction: true },
    ]);

    expect(await readClientState()).toMatchObject({
      indexedDB: '[["broken"],[""]]',
      unreadable: [],
    });

    installIndexedDb([{ name: 'gone', stores: [] }], true);

    expect(await readClientState()).toMatchObject({ indexedDB: '[["gone"],[""]]', unreadable: [] });
  });
});
